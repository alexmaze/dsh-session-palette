# dsh-session-palette

[English](README.md) | [简体中文](README.zh.md)

一个 Spotlight / Alfred 风格的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 会话切换面板。

按下 **⌘⇧P**（Windows/Linux：**Ctrl+Shift+P**），输入关键字，就能在全部工作区中跳转到任意会话。没有输入时默认列出所有会话，按最近对话时间倒序。`↑` / `↓` 选择，`Enter` 切换。

[![test](https://github.com/alexmaze/dsh-session-palette/actions/workflows/test.yml/badge.svg)](https://github.com/alexmaze/dsh-session-palette/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```
┌────────────────────────────────────────────────────────────┐
│  🔍  搜索会话、工作区…                                esc  │
├────────────────────────────────────────────────────────────┤
│  ▢  修复登录态过期的问题                         ↵          │
│     默认工作区 · 3 小时前 · 总消耗 1.2M                     │
│  ▢  重构插件加载流程                                        │
│     dsh-core · 昨天 · 总消耗 86.4K                         │
│  …                                                          │
├────────────────────────────────────────────────────────────┤
│  15 个会话                    ↑↓ 选择   ↵ 打开   esc 关闭   │
└────────────────────────────────────────────────────────────┘
```

## 功能

- **一个全局快捷键**：`⌘⇧P` / `Ctrl+Shift+P`，可在 **设置 → 键盘快捷键** 中改键。
- **默认展开全部会话**：清空输入框即回到全量列表，按最近对话时间倒序。
- **全字段搜索**：会话名、工作区名、工作目录、会话 ID；多个空格分隔的关键词按 AND 匹配，不区分大小写。
- **全键盘操作**：`↑` / `↓` 移动，`PageUp` / `PageDown` 翻页，`Home` / `End` 首尾，`Enter` 切换，`Esc` 关闭；再按一次快捷键也能收起面板。
- **最多显示 10 条**：列表超过 10 条时在面板内滚动，选中项会自动滚入可视区。
- **每行展示**：会话名、工作区名、最近一轮对话时间（相对时间）、总 token 消耗。
- **消耗明细**：鼠标悬停在消耗数字上可看到输入 / 输出 / 缓存读 / 缓存写四项拆分。
- **合理过滤**：隐藏子会话（subagent）、空白 New Session 和已归档会话，避免列出无法直接切换的条目。
- **实时数据**：面板打开期间跟随会话列表与投影更新；可见行缺少 `tokenUsage` 缓存时会按需拉取。
- **中英文界面**：跟随 DSH 语言设置。

## 安装

前置条件：DSH `0.2.x`，带 UI 插件支持（已在 `0.2.1-rc.2` 验证），Desktop 或 Web 均可。

直接从 GitHub 安装带 tag 的版本：

```sh
# Desktop
dsh plugin --profile desktop add "github:alexmaze/dsh-session-palette#v0.1.0"

# Web
dsh plugin --profile web add "github:alexmaze/dsh-session-palette#v0.1.0"
```

CLI 会安装包，并把它的 bundle 层追加到 profile 的 `dsh.profile.bundles`。如果 bundle 没有自动启用，在 **Plugins** 页面打开 **会话面板 / Session Palette**。如果当前窗口还没加载插件，刷新页面（`⌘R`）或重启应用。

也可以在 UI 中安装：**Plugins → Add plugin**，粘贴：

```text
github:alexmaze/dsh-session-palette#v0.1.0
```

Git 安装会固定在你指定的 ref 上。更新时先移除旧包，再安装新的 tag / commit。卸载：

```sh
dsh plugin --profile desktop remove dsh-session-palette
```

如果 `dsh.profile.bundles` 里还残留这一行，手动删除，或在 Plugins 页面停用。

## 使用

| 按键 | 动作 |
| --- | --- |
| `⌘⇧P` / `Ctrl+Shift+P` | 打开 / 收起面板 |
| `↑` / `↓` | 移动选择 |
| `PageUp` / `PageDown` | 每次移动 10 行 |
| `Home` / `End` | 第一行 / 最后一行 |
| `Enter` | 切换到选中会话 |
| `Esc` | 关闭面板 |
| 点击某一行 | 切换到该会话 |
| 点击遮罩 | 关闭面板 |

说明：

- 快捷键是一个普通的 DSH 命令：会出现在 **设置 → 键盘快捷键**，参与冲突检测，并按设备/平台分别保存。
- **Linux Web** 的浏览器键位限制较严，默认不绑定，需要在设置页面手动指定。
- 部分浏览器会把 `⌘⇧P` / `Ctrl+Shift+P` 用于打印等原生动作。推荐在 **Desktop** 中使用；如果 Web 版按键被浏览器截获，换一个键即可。

## 「总消耗」是什么

数字来自 `tokenUsage` 会话投影，累加四个 provider 上报的桶：

```text
uncachedInputTokens + outputTokens + cacheReadTokens + cacheWriteTokens
```

这是 **token 总量，不是金额**。缓存命中也会计入，所以通常远大于「输入 + 输出」。悬停数字可以看到四项拆分。

## 实现说明

- **Host 半**：一个几乎为空的 Loader 行，作用是让 `@deepseek-ai/dsh-client-modules` 通过 `dsh.client` 声明发现并服务浏览器半。
- **浏览器半**：以 lazy-CJS（`window.__ModuleLoader__.load({ id, factory })`）交付，只依赖 shell 平台模块 `react` 和 `@deepseek-ai/dsh-client-store`。
- 会话目录取自全局 `ctx.sessions.list`；工作区归属取自 `ctx.workspaces.list`（`sessionIds` 是权威归属）；切换调用 `ctx.uiWorkspace.openSession(sessionId)`。
- 快捷键通过 `ctx.shortcuts.register()` 注册；面板注册到 `shell.overlay` 槽位，并用 `data-shortcut-modal="session-palette"` 标记为模态层，因此打开时背景快捷键被屏蔽，而它自己的快捷键仍可切换关闭。
- 没有 `tokenUsage` 缓存的行会触发 `ctx.sessions.refreshProjections()`，投影到达后列表实时更新。

包结构：

```text
dsh-session-palette/
├── package.json          # dsh.bundle + dsh.client 声明
├── cordis.patch.yml      # 插入唯一的 Loader 行
├── lib/index.js          # Host 半（无 Host 行为）
├── lib/client.js         # 浏览器半：快捷键、覆盖层、搜索、切换
├── locale/{en,zh}.json   # Plugins 页面显示元数据
├── icon.svg              # Plugins 页面图标
├── test/client.test.mjs  # 行过滤/搜索/格式化 + 注册测试
└── .github/workflows/    # CI：语法检查 + 单元测试
```

## 开发

无需构建步骤：Host 入口是普通 ESM，浏览器入口是自包含的 lazy-CJS bundle。

```sh
git clone https://github.com/alexmaze/dsh-session-palette.git
cd dsh-session-palette

# 把工作副本链接进开发 profile
dsh plugin --profile web add "link:$PWD"

node test/client.test.mjs
```

修改 `lib/client.js` 后刷新 DSH 页面（若启用了 HMR 也可自动生效）。测试覆盖行过滤（归档 / 子会话 / 空白）、多关键词搜索、工作区归属、token 总计（含旧版 `totals` 包装）、时间格式化，以及快捷键与槽位注册。

## 兼容性与限制

- **已在 DSH `0.2.1-rc.2`（macOS）验证**。插件使用了公开的 client plugin、shortcut、session、workspace 和 overlay API；DSH 插件 API 仍在快速演进，未来版本若调整这些接口，插件可能需要跟进。
- **已归档会话不会显示**，因为 DSH 要求先取消归档才能打开；子会话和空白 New Session 同样隐藏。
- **冷会话的 token 消耗可能稍晚出现**：没有投影缓存时先显示 `—`，按需加载完成后更新。
- **不显示金额成本**，因为 DSH 没有把按模型计价的信息暴露给客户端。

## License

[MIT](LICENSE) © Alex Yan
