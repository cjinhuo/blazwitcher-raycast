# Raycast Store 提交指南

## 发布账号与语言

`package.json` 的 `author` 是 Raycast 用户名 `julian0197`，对应 [MSK 的 Raycast 账号](https://www.raycast.com/julian0197)。GitHub 仓库 owner 与 Raycast 发布账号可以不同；发布账号应参与维护，并拥有相应提交权限。`contributors` 仅填写已经确认的 Raycast 用户名，不猜测原作者的 Raycast 账号。

发布账号不会转移源代码或图标版权。保留 `LICENSE`、`THIRD_PARTY_NOTICES.md` 与 `licenses/` 中的原始声明。

命令、设置、动作和状态文案统一使用美式英语，满足 Raycast 当前语言规范；无需增加多语言框架。README 保留中英文，中文页面标题、拼音和中文搜索输入照常支持。

## 商店截图

截图直接作为仓库文件提交，无需在 manifest 中填写截图 URL。将真实 Raycast 界面的 PNG 放入 `metadata/`，每张 **2000 × 1250**，最多六张；建议至少三张，按文件名顺序展示：

1. `blazwitcher-raycast-1.png`：用 `/t sxw` 搜索相近中文标题，展示拼音首字母搜索。
2. `blazwitcher-raycast-2.png`：用 `/b zhishi zl` 匹配“知识蒸馏”，展示独立的书签来源与拼音搜索。
3. `blazwitcher-raycast-3.png`：按 `⌘D` 展开真实网页正文，展示官方 Raycast Browser Extension 提供的预览。

只使用干净演示 Chrome 配置中的公开页面。截图必须来自实际运行的英文界面；保留清晰的 Raycast 窗口，可以按尺寸要求裁切或居中排版，不伪造结果。GIF 和 MP4 保留在 README 的 `media/` 中，不能代替商店 PNG 截图。

## 检查与提交

使用 Node.js 22.22.2 或更新版本，在项目根目录执行：

```bash
npm ci
npm run check
```

`npm run check` 包括类型检查、测试、官方 `ray lint`、ESLint、Prettier 和构建。另在真实 Raycast 内确认搜索、来源筛选、打开标签、配置与正文预览；仅有构建通过不足以证明实际功能可用。

本次适配先提交到项目自身的上架准备 PR，供维护者审阅截图、界面、元数据和验证结果。用户确认准备内容后，再由具有账号和仓库权限的维护者执行官方送审命令：

```bash
npm run publish
```

该脚本使用官方 `npx @raycast/api@latest publish`，按提示完成 GitHub 授权并创建或更新 [`raycast/extensions`](https://github.com/raycast/extensions) 的审核 PR。发布前检查工具展示的文件与 PR 内容；首次 Changelog 使用 `{PR_MERGE_DATE}` 占位符，由官方流程替换日期。

不要运行 `npm publish`；`prepublishOnly` 会拒绝把此扩展上传到 npm。通过审核并合并后才算发布到 Store；此前继续按 README 从源码安装，不提前添加未存在的 Store 安装链接。

官方依据：[发布流程](https://developers.raycast.com/basics/publish-an-extension)、[Store 准备要求](https://developers.raycast.com/basics/prepare-an-extension-for-store)、[Manifest](https://developers.raycast.com/information/manifest)。具体账号验证、截图与依赖检查以当次 `ray lint` 和官方审核结果为准。
