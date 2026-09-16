export type Source = "tab" | "bookmark" | "history";
export type Scope = Source | "all";
export type Range = [number, number];

export interface Profile {
  id: string;
  name: string;
  path: string;
}

export interface BrowserEntry {
  id: string;
  source: Source;
  title: string;
  url: string;
  profile?: Profile;
  tabId?: string;
  windowId?: string;
  active?: boolean;
  incognito?: boolean;
  folder?: string;
  visitedAt?: number;
}

export interface SearchResult {
  entry: BrowserEntry;
  titleRanges: Range[];
  urlRanges: Range[];
  score: number;
}

export const sourceNames: Record<Source, string> = {
  tab: "标签页",
  bookmark: "书签",
  history: "历史记录",
};
