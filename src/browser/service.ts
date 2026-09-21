import { readTabs, describeError } from "./chrome";
import { discoverProfiles } from "./profiles";
import { readBookmarks } from "./bookmarks";
import { readHistory } from "./history";
import { SearchIndex } from "../search/engine";
import {
  isScope,
  normalizeBrowserOptions,
  defaultBrowserOptions,
  type BrowserOptions,
} from "./service-types";
import type { BrowserEntry, Profile, SearchResult, Source } from "../types";
import type {
  DataSnapshot,
  ResultRef,
  SearchPage,
  SearchRequest,
} from "./service-types";

const readers = { readTabs, discoverProfiles, readBookmarks, readHistory };
const sources: Source[] = ["tab", "bookmark", "history"];
const emptyStates = (): DataSnapshot["states"] => ({
  tab: { loading: false, warnings: [], count: 0 },
  bookmark: { loading: false, warnings: [], count: 0 },
  history: { loading: false, warnings: [], count: 0 },
});

/** 在 Raycast 扩展进程内持有索引；查询序号和数据版本阻止旧结果执行操作。 */
export class BrowserService {
  private options = defaultBrowserOptions;
  private profiles: Profile[] = [];
  private profileId = "";
  private entries: Record<Source, BrowserEntry[]> = {
    tab: [],
    bookmark: [],
    history: [],
  };
  private states = emptyStates();
  private index = new SearchIndex([]);
  private version = 0;
  private generation = 0;
  private latestRequest = 0;
  private searchToken = 0;
  private cache?: { key: string; results: SearchResult[]; requestId: number };

  constructor(
    private publish: (state: DataSnapshot) => void,
    private io = readers,
  ) {}

  snapshot(): DataSnapshot {
    return {
      version: this.version,
      profiles: this.profiles.map(({ id, name }) => ({ id, name })),
      profileId: this.profileId,
      states: structuredClone(this.states),
    };
  }

  private changed(reindex = false) {
    if (reindex)
      this.index = new SearchIndex(Object.values(this.entries).flat());
    this.version++;
    this.searchToken++;
    this.cache = undefined;
    this.publish(this.snapshot());
  }

  async configure(options: BrowserOptions, profileId?: string) {
    const normalized = normalizeBrowserOptions(options);
    const changed =
      JSON.stringify(this.options) !== JSON.stringify(normalized) ||
      (profileId !== undefined && profileId !== this.profileId);
    this.options = normalized;
    // 先保存选择意图，读取完成前的刷新也必须使用新配置。
    if (profileId !== undefined) this.profileId = profileId;
    if (changed) {
      this.entries = { tab: [], bookmark: [], history: [] };
      this.states = emptyStates();
      this.changed(true);
    }
    await this.load();
  }

  refresh() {
    return this.load();
  }

  pause() {
    this.generation++;
    this.searchToken++;
    this.cache = undefined;
  }

  cancel(requestId: number) {
    if (!Number.isSafeInteger(requestId) || requestId < this.latestRequest)
      return;
    this.latestRequest = requestId;
    this.searchToken++;
    this.cache = undefined;
  }

  private async load() {
    const generation = ++this.generation;
    const live = () => generation === this.generation;
    const options = this.options;
    const wanted = sources.filter(
      (source) => options.scope === "all" || source === options.scope,
    );
    for (const source of wanted)
      this.states[source] = {
        ...this.states[source],
        loading: true,
        warnings: [],
      };
    this.changed();
    const loadTabs = async () => {
      if (!wanted.includes("tab")) return;
      try {
        const result = await this.io.readTabs(options.includeIncognito);
        if (!live()) return;
        this.entries.tab = result.tabs;
        this.states.tab = {
          count: result.tabs.length,
          loading: false,
          warnings: result.running
            ? []
            : ["Chrome 未运行；启动后刷新即可读取标签页。"],
        };
      } catch (error) {
        if (!live()) return;
        this.entries.tab = [];
        this.states.tab = {
          count: 0,
          loading: false,
          warnings: [describeError(error)],
        };
      }
      this.changed(true);
    };
    const loadFiles = async () => {
      if (!wanted.some((s) => s !== "tab")) return;
      try {
        const found = await this.io.discoverProfiles();
        if (!live()) return;
        this.profiles = found.profiles;
        const next = this.profileId;
        this.profileId =
          next === "all" || found.profiles.some((p) => p.id === next)
            ? next
            : found.defaultId;
        const selected = found.profiles.filter(
          (p) => this.profileId === "all" || p.id === this.profileId,
        );
        await Promise.all(
          (["bookmark", "history"] as const).map(async (source) => {
            if (!wanted.includes(source)) return;
            const entries: BrowserEntry[] = [];
            const warnings: string[] = [];
            if (!selected.length)
              warnings.push(
                "未找到 Chrome 配置，请先运行 Google Chrome 后刷新。",
              );
            for (const profile of selected) {
              if (!live()) return;
              try {
                if (source === "bookmark") {
                  const result = await this.io.readBookmarks(profile);
                  entries.push(...result.entries);
                  warnings.push(
                    ...result.warnings.map(
                      (message) => `${profile.name}：${message}`,
                    ),
                  );
                } else
                  entries.push(
                    ...(await this.io.readHistory(
                      profile,
                      options.historyLimit,
                    )),
                  );
              } catch (error) {
                warnings.push(`${profile.name}：${describeError(error)}`);
              }
            }
            if (!live()) return;
            if (source === "history")
              entries.sort((a, b) => (b.visitedAt ?? 0) - (a.visitedAt ?? 0));
            this.entries[source] =
              source === "history"
                ? entries.slice(0, options.historyLimit)
                : entries;
            this.states[source] = {
              loading: false,
              warnings,
              count: this.entries[source].length,
            };
            this.changed(true);
          }),
        );
      } catch (error) {
        if (!live()) return;
        for (const source of ["bookmark", "history"] as const) {
          if (!wanted.includes(source)) continue;
          this.entries[source] = [];
          this.states[source] = {
            loading: false,
            warnings: [describeError(error)],
            count: 0,
          };
        }
        this.changed(true);
      }
    };
    await Promise.all([loadTabs(), loadFiles()]);
  }

  async search(request: SearchRequest): Promise<SearchPage> {
    if (
      !request ||
      !Number.isSafeInteger(request.requestId) ||
      request.requestId < this.latestRequest ||
      request.version !== this.version ||
      !isScope(request.scope) ||
      typeof request.query !== "string" ||
      !Number.isSafeInteger(request.offset) ||
      request.offset < 0
    )
      throw new Error("STALE_RESULT");
    this.latestRequest = request.requestId;
    const token = ++this.searchToken;
    const scope =
      this.options.scope === "all" ? request.scope : this.options.scope;
    const key = JSON.stringify([this.version, scope, request.query]);
    const results =
      this.cache?.key === key
        ? this.cache.results
        : await this.index.search(
            request.query,
            scope,
            () => token !== this.searchToken,
          );
    if (token !== this.searchToken || request.version !== this.version)
      throw new Error("STALE_RESULT");
    this.cache = { key, results, requestId: request.requestId };
    return {
      requestId: request.requestId,
      version: this.version,
      total: results.length,
      offset: request.offset,
      results: results.slice(request.offset, request.offset + 50),
    };
  }

  entry(ref: ResultRef): BrowserEntry {
    if (
      !ref ||
      ref.version !== this.version ||
      ref.requestId !== this.latestRequest ||
      ref.requestId !== this.cache?.requestId
    )
      throw new Error("结果已更新，请重新选择。");
    const entry = this.cache.results.find(
      (result) => result.entry.id === ref.id,
    )?.entry;
    if (!entry) throw new Error("结果已更新，请重新选择。");
    return entry;
  }
}
