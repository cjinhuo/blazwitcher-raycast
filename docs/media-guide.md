# README 与 Raycast Store 素材录制清单

## 本轮实录（2026-10-15）

使用包含搜索防抖修复的 `codex/readme-store` 开发版本，录制代码为 `e6502c5719feb7597b9ad299e4e51172d0f51a70`。Chrome 使用 `raycast-blaz`（`Profile 3`）演示配置：11 个真实中文 AI 文档页面、5 个分组，并新增 4 条书签和 4 篇历史素材。

拼音首字母、域名分词、来源筛选、正文预览、打开动作和搜索配置六类已完成原生录制，6 个 GIF 与 6 个 MP4 已通过完整解码与接触表检查。配置片展示历史显示数量从 10 改为 5 并重开验证。**媒体已完成；本地测试设置恢复为 10、恢复后的重开验证仍待完成。**详情见 [录制记录](../media/recording-manifest.json)，视频见 [素材预览](../media/recordings.html)。

## 实际案例与文件

| 文件（GIF 与同名 MP4）  | 实录内容                                                                                                                                              | 状态   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `media/pinyin-search`   | `/t sxw` 显示 4 篇上下文文档 → `/t sxwcj` 定位层级 → 回到 `/t sxw` → `/t sxwlx` 定位类型                                                              | 已完成 |
| `media/domain-search`   | `/t kuaisu` 3 条 → `/t kuaisu rm` 2 条 → `/t kuaisu rm claude.com` 1 条 → `/t rm claude.com kuaisu` 仍为同一篇 Claude 入门文档                        | 已完成 |
| `media/source-filters`  | `/t sxwcj` 找到“上下文层级”；`/h openviking.ai zhibiao` 找到“指标与 Metrics”；`/b zhishi zl` 找到“示例：知识蒸馏”                                     | 已完成 |
| `media/page-preview`    | `⌘D` 展开实际正文与表格，滚动后收起                                                                                                                   | 已完成 |
| `media/open-actions`    | `Enter` 从“检索机制”切换到已有“上下文层级”，标签仍为 11 个；`⌘Enter` 将历史中的“指标与 Metrics”打开到新标签，增至 12 个，随后已关闭新增标签恢复 11 个 | 已完成 |
| `media/search-settings` | 历史显示数量 10 → 5，重新打开命令后 `/h openviking.ai` 显示 5 条                                                                                      | 已完成 |

这些数量是本轮演示环境的实际结果，不是对任意用户数据的保证。相近标题使用 OpenViking 的“上下文类型”“上下文层级”“上下文提取”“上下文编译概览”；入门页面来自 Qwen、Claude Code Docs 和 Dify Docs。首字母和域名分词的介绍沿用 Chrome 版，并链接 [text-search-engine](https://github.com/cjinhuo/text-search-engine)。

正文预览依赖在 Chrome 中安装并启用官方 [Raycast Browser Extension](https://www.raycast.com/browser-extension)。`media/page-preview.png` 与对应视频必须展示实际提取的正文，不能用元数据或错误面板代替。

## 剪辑与收尾

- 六类成品保持原播放速度；打开动作由两个真实操作片段合并，不伪造界面。
- 搜索配置片保留原片 8–13.2 秒的设置操作和 19.5–24 秒的稳定结果，已裁去完整的根命令文件列表。两个真实窗口等比放入 780 × 770 画布并补白，未变速。
- 配置演示只修改历史显示数量。历史天数 14、读取上限 2,000、书签显示数量 10、最优建议 2、严格搜索关闭、启动缓存开启、无痕关闭均保持不变。读取上限 2,000 为已有设置，新安装默认值为 1,000。
- 本地测试清理仍需将历史显示数量恢复为 10，并重新打开命令核对；这项清理与六类成品的完成状态分别记录在 [录制记录](../media/recording-manifest.json)。设置截图应取自改值前显示 10 的原片，不能当作恢复成功的证据。
- 两份 README 共用 `media/` 素材，截图命名为 `media/search-overview.png`、`media/page-preview.png`；设置截图为 `docs/screenshots/search-settings.png`。替换前检查中英文说明与实录一致。
- 已打开标签可能来自其他 Chrome 窗口；书签与历史限定演示配置。发布前检查所有可见结果、地址、配置名和背景，避免纳入私人内容。

## Raycast Store 截图

商店截图与 README GIF 分开准备，格式以 [Raycast 官方指南](https://developers.raycast.com/basics/prepare-an-extension-for-store#screenshots) 为准：

- **2000 × 1250，PNG，16:10 横图**。
- 官方建议至少 3 张，最多 6 张。
- 在 Raycast 开发模式中使用 **Window Capture**，选择 **Save to Metadata**。捕获热键由你在 Advanced Preferences 中设置，不是插件的默认热键。
- 放入根目录的 `metadata/`。以下是建议名称，Window Capture 生成的文件可按实际名称保留。
- 统一背景和主题，画面只包含 Raycast 扩展，不展示其他应用或敏感数据。

| 文件                                         | 展示内容                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `metadata/blazwitcher-raycast-1.png`         | 拼音首字母输入与相近中文标题，突出核心搜索能力                               |
| `metadata/blazwitcher-raycast-2.png`         | `/h` 或 `/b` 筛选、来源信息和结果列表                                        |
| `metadata/blazwitcher-raycast-3.png`         | Actions 菜单，展示打开、复制、来源切换等动作                                 |
| `metadata/blazwitcher-raycast-4.png`（可选） | 公开页面的正文预览，说明依赖官方 Raycast Browser Extension，且正文实际可读取 |

商店截图不作为 README 图片路径的替代：README 使用 `media/`，商店展示使用 `metadata/`。浏览器版的 AI 分组、侧边栏、彩色命中高亮和 `Command+Shift+K` 唤醒演示不适用于此 Raycast 版本。
