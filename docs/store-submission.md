# Raycast Store 提交指南

## 分支与发布来源

[`cjinhuo/blazwitcher-raycast/master`](https://github.com/cjinhuo/blazwitcher-raycast/tree/master) 是唯一开发源。功能代码、测试、中文 README、协作说明和开发记录都留在 master。

`production` 只保存从 master 生成的 Store 文件，不在此分支独立开发，也不将它的删减结果合回 master。发布时记录生成器输出的 `sourceCommit`，在 production 的提交说明中写明 `Source: <master SHA>`。

生成规则由 master 中的三个文件维护：

- `scripts/prepare-production.mjs`：从已提交的 master 导出文件，裁剪开发依赖与脚本。
- `store/README.md`：仅供最终用户阅读的英文说明。
- `store/manifest.json`：Store 名称、标题与贡献者信息；命令、偏好和运行依赖仍来自 master 的 `package.json`。

生成器保留运行源码、图标、许可、Changelog、构建和 lint 配置、商店 PNG，以及 Store README 实际引用的 GIF/PNG。它不导出 `AGENTS.md`、`CONTRIBUTING.md`、`openspec/`、`docs/`、`tests/`、`scripts/`、`store/`、中文 README、MP4 或录制记录。

生产包只保留 `build`、`dev`、`lint`、`fix-lint` 和 `publish` 五个脚本；移除 `tsx`、`react-test-renderer` 和其类型包，通过 npm 按 master 锁文件重新计算剩余依赖，不升级运行依赖。TypeScript 的输入仅包含 `src` 与 Raycast 生成的类型声明。

## 生成与验证

先将准备发布的修改合入 master，并确认本地 master 与计划发布的远端提交一致。使用 Node.js 22.22.2 或更新版本，在干净的 master checkout 中执行：

```bash
npm ci
npm run check
npm run prepare:production -- --output .local/releases/<release-id>/blazwitcher
```

将 `<release-id>` 换成当次发布标识。输出目录必须名为 `blazwitcher` 且尚不存在。生成器不会覆盖已有目录、提交代码、切换分支、推送或发布。普通模式要求当前分支为 master 且没有未提交修改，所有输入都取自同一个已提交的 master SHA。

只为审阅尚未提交的打包规则时，可以增加 `--preview`。此时只读取本地 `store/README.md`、`store/manifest.json` 和当前生成器；运行源码、素材及依赖仍取自已提交 master，不会带入开发目录里的未提交功能修复。输出明确标记 `preview: true`。预览包不能作为正式发布依据，打包改动合入 master 后必须重新生成。

在生成目录独立检查依赖、官方 lint 和构建：

```bash
(
  cd .local/releases/<release-id>/blazwitcher &&
  npm ci --ignore-scripts --no-audit --no-fund &&
  npm run lint &&
  npm run build -- --output dist
)
```

显式传入 `--output dist` 可避免检查构建覆盖当前安装的开发扩展。官方 lint 会验证发布账号、贡献者账号、manifest、图标和代码规范。构建与测试不能代替真实 Raycast 的搜索、Chrome 跳转和正文预览验收。

核对产物里的 `src/` 与该 `sourceCommit` 完全一致，README 的本地链接均有效，锁文件没有测试依赖，且没有本地诊断或敏感文件。

## 更新 production 与官方 PR

以下命令均从 master 仓库根目录执行；上面的检查使用子 shell，不会改变当前终端目录。首次准备 production 时，为它创建独立 checkout：

```bash
git worktree add -b production .local/production/blazwitcher master
```

以后复用这个 checkout。每次覆盖之前，确认其没有需要保留的未提交或未跟踪文件；有改动时先 review，不直接覆盖。

从刚生成的新目录同步，并保留 worktree 的 Git 入口：

```bash
rsync -a --delete --exclude=.git --exclude=node_modules --exclude=dist --exclude=raycast-env.d.ts \
  .local/releases/<release-id>/blazwitcher/ .local/production/blazwitcher/
git -C .local/production/blazwitcher diff --stat
git -C .local/production/blazwitcher status --short
```

同步目标必须是 `.local/production/blazwitcher/`，不能把 master 根目录当作 rsync 的目标。首次同步会显示开发文件被移除，这是预期的 Store 裁剪；master 中的原文件仍然保留。review 后再提交 production，记录源 SHA，并按授权范围推送。

当前官方审核入口是 [PR #32429](https://github.com/raycast/extensions/pull/32429)。更新它时，把已验证的 production 文件同步到现有 PR 分支的 `extensions/blazwitcher/`，同时移除旧的 `extensions/blazwitcher-raycast/`。确认没有同时存在两个扩展目录。名称变更可能影响 CLI 选择提交分支，因此不要默认再次运行 publish 就一定更新原 PR；应先核对已有 fork 和分支，继续使用同一个 PR。

源仓库的 `npm run publish` 会拒绝直接发布开发目录。真正发布时只从生成的 production checkout 使用官方发布流程，并检查变更范围。CLI 复制文件时不完整遵循 `.gitignore`，不要把 `.local`、`.env`、诊断文件或开发记录带入提交。

首次 Changelog 使用 `{PR_MERGE_DATE}` 占位符。后续若官方仓库已有其他贡献，先把相应修复同步回 master，再生成 production。通过审核并合并后才算发布到 Store；此前不添加尚不存在的 Store 安装链接。

## 账号、版权与素材

发布账号 `author` 保持为 Raycast 用户名 `julian0197`。`contributors` 包含 `cjinhuo`：Git 历史中有其贡献，2026-10-26 Raycast 官方用户接口也确认该 handle 存在，返回姓名 Shanks。贡献者与发布账号是不同的人。

保留 `LICENSE`、`THIRD_PARTY_NOTICES.md` 与 `licenses/` 的版权声明。Store 名称为 `blazwitcher`，标题为 **Blazwitcher - Fuzzy Chrome Search**。命令、设置和状态文案使用美式英语，中文网页标题与拼音查询保持不变。

商店 PNG 位于 `metadata/`，每张 2000 × 1250，最多六张。生成时将现有截图改名为 `blazwitcher-1.png` 等；只改文件名，不改界面像素。2026-10-16 的三个截图仍带鼠标高亮，审核建议重拍；文件改名和尺寸检查不代表已完成重拍。

GIF 留在 Store README，重复 MP4、录制记录、中文 README 和完整开发文档仍保留在 master。真实拍摄过程与历史证据见 [素材清单](media-guide.md)。

官方依据：[发布流程](https://developers.raycast.com/basics/publish-an-extension)、[Store 准备要求](https://developers.raycast.com/basics/prepare-an-extension-for-store)、[Manifest](https://developers.raycast.com/information/manifest)。
