# Raycast Store Readiness Implementation Plan

> **For agentic workers:** Use subagent-driven implementation with separate UI copy, browser messages, and release metadata responsibilities. Parent verifies integration and captures native screenshots.

**Goal:** Prepare Blazwitcher for Raycast Store submission under julian0197 with English controls and real Store screenshots.

**Architecture:** Keep current search, data access, preferences keys, keyboard bindings, and privacy boundaries. Translate user-facing text directly; keep Chinese page titles and Pinyin search fixtures unchanged. Use the official Raycast CLI and Window Capture rather than adding a localization layer or screenshot compositor.

**Tech Stack:** TypeScript, React, Raycast API 2.8.0, npm, existing Node test runner.

---

## Task 1: English interface

Files: src/components/_.tsx, src/components/preview-markdown.ts, src/actions.ts, src/types.ts, src/shortcuts.ts, src/search/result-sections.ts, src/hooks/_.ts; existing corresponding tests.

- [x] Translate controls, sections, actions, tooltips and errors to US English; retain identifiers and browser metadata.
- [x] Use `sourceNames = { tab: "Tab", bookmark: "Bookmark", history: "History" }`; use `All Sources`, `Open Tabs`, `Top Suggestions` consistently.
- [x] Remove the root List navigationTitle prop; keep native command navigation.
- [x] Update existing copy assertions without adding mirror tests for string-only changes.

## Task 2: Browser errors

Files: src/browser/*.ts; tests/browser.test.ts, tests/page-content.test.ts and existing affected service/loading tests.

- [x] Translate surfaced browser, preview, SQLite and service errors; keep Chrome/JXA machine error tokens and logic unchanged.
- [x] Preserve stale-result protection and captured Chrome targets.
- [x] Use en-US for extension-generated dates, leaving page text unchanged.

## Task 3: Release metadata and documentation

Files: package.json, package-lock.json, CHANGELOG.md, AGENTS.md, README.md, README.zh-CN.md, CONTRIBUTING.md, THIRD_PARTY_NOTICES.md; docs/store-submission.md.

- [x] Set author to `julian0197`; preserve original source and asset attribution.
- [x] Use `Blazwitcher`, `Search Browser`, and categories `["Productivity", "Web"]`.
- [x] Update @raycast/api from 2.5.2 to verified current 2.8.0 using the public npm registry; synchronize lockfile.
- [x] Add `"publish": "npx @raycast/api@latest publish"`, npm-publication guard, and official Raycast lint without discarding existing checks.
- [x] Add `## [Initial Version] - {PR_MERGE_DATE}` in CHANGELOG.md.
- [x] Update bilingual user instructions for English controls; fix text-search-engine notice to 1.6.0 and history default to 1000.
- [x] Describe Store images in metadata/, author account, submission commands and future contribution synchronization. Do not invent a live Store URL.
- [x] Update AGENTS.md so UI copy uses US English while contributor discussion/docs can remain Chinese.

## Task 4: Native Store screenshots

Files: metadata/blazwitcher-raycast-1.png, metadata/blazwitcher-raycast-2.png, metadata/blazwitcher-raycast-3.png.

- [ ] Launch the new developer command and verify it is the English julian0197 extension.
- [ ] Keep raycast-blaz demo pages; screenshot `/t sxw` multiple Chinese-title matches, bookmark-only `/b zhishi zl`, and expanded page-body preview.
- [ ] Use native Window Capture, Save to Metadata, consistent background and theme. Verify each real PNG is 2000x1250 and contains no other applications or private data.

## Task 5: Verification and delivery

- [x] Run Node 22.22.2 typecheck and 127 tests; pass official Raycast lint, ESLint, Prettier and build after formatting the plan.
- [ ] Verify real search, source change, preview and an existing-tab action in Raycast/Chrome.
- [ ] Check English UI literals, links, manifests, public registry lock URLs, screenshots and staged scope.
- [ ] Commit and push codex/store-ready; create and attach a PR to cjinhuo/blazwitcher-raycast. Do not run the final official Store publishing command as part of this preparation PR.
