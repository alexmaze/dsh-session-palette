# dsh-session-palette

[English](README.md) | [简体中文](README.zh.md)

A Spotlight / Alfred-style session switcher for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Press **⌘⇧P** (**Ctrl+Shift+P** on Windows/Linux), type a keyword, and jump to any session across every workspace. Nothing to type? The panel lists all sessions, newest first. `↑` / `↓` to select, `Enter` to switch.

[![test](https://github.com/alexmaze/dsh-session-palette/actions/workflows/test.yml/badge.svg)](https://github.com/alexmaze/dsh-session-palette/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```
┌────────────────────────────────────────────────────────────┐
│  🔍  Search sessions or workspaces…                  esc   │
├────────────────────────────────────────────────────────────┤
│  ▢  Fix the expired login state                      ↵     │
│     default-workspace · 3h ago · 1.2M tokens                │
│  ▢  Refactor the plugin loader                              │
│     dsh-core · yesterday · 86.4K tokens                     │
│  …                                                          │
├────────────────────────────────────────────────────────────┤
│  15 sessions                  ↑↓ select  ↵ open  esc close  │
└────────────────────────────────────────────────────────────┘
```

## Features

- **One global shortcut** — `⌘⇧P` / `Ctrl+Shift+P`; rebind it in **Settings → Keyboard Shortcuts**.
- **All sessions by default** — an empty query lists every session, ordered by the latest conversation.
- **Search across everything** — session title, workspace name, working directory, and session ID; multiple space-separated terms are ANDed and matching is case-insensitive.
- **Keyboard-first** — `↑` / `↓` to move, `PageUp` / `PageDown` to page, `Home` / `End` to jump, `Enter` to switch, `Esc` to close. Press the shortcut again to dismiss the panel.
- **At most 10 rows visible** — longer results scroll inside the panel and the active row is kept in view.
- **Useful metadata per row** — session title, workspace, relative time of the latest conversation, and total token consumption.
- **Token breakdown** — hover the consumption figure to see input, output, cache-read, and cache-write totals.
- **Sensible filtering** — subagent sessions, blank "New Session" rows, and archived sessions are hidden, because they cannot be switched to directly.
- **Live data** — the list follows session list and projection updates while the panel is open; missing `tokenUsage` projections are loaded on demand for the visible rows.
- **Bilingual UI** — follows the DSH locale (English / 简体中文).

## Install

Requirements: DSH `0.2.x` with UI plugin support (tested with `0.2.1-rc.2`), on Desktop or Web.

Install the tagged release directly from GitHub:

```sh
# Desktop
dsh plugin --profile desktop add "github:alexmaze/dsh-session-palette#v0.1.0"

# Web
dsh plugin --profile web add "github:alexmaze/dsh-session-palette#v0.1.0"
```

The CLI installs the package and appends its bundle layer to the profile's `dsh.profile.bundles`. If the bundle is not enabled automatically, enable **Session Palette** on the **Plugins** page. If the running window has not picked the plugin up yet, refresh the page (`⌘R`) or restart the app.

You can also install it through the UI: **Plugins → Add plugin** and paste

```text
github:alexmaze/dsh-session-palette#v0.1.0
```

Git installs are pinned to the ref you pass. To update, remove the package and add a newer tag or commit. To uninstall:

```sh
dsh plugin --profile desktop remove dsh-session-palette
```

If the plugin's row remains in `dsh.profile.bundles`, remove it there or disable it on the Plugins page.

## Usage

| Key | Action |
| --- | --- |
| `⌘⇧P` / `Ctrl+Shift+P` | Open / close the palette |
| `↑` / `↓` | Move the selection |
| `PageUp` / `PageDown` | Move by 10 rows |
| `Home` / `End` | First / last row |
| `Enter` | Switch to the selected session |
| `Esc` | Close the palette |
| Click a row | Switch to that session |
| Click the backdrop | Close the palette |

Notes:

- The shortcut is a normal DSH command: it appears in **Settings → Keyboard Shortcuts**, participates in conflict detection, and can be rebound per device/platform.
- On **Linux Web** the default is intentionally unbound because browser key restrictions differ; assign a key in the settings page.
- Some browsers reserve `⌘⇧P` / `Ctrl+Shift+P` for printing or other actions. The **Desktop** app is the recommended way to use this plugin; if the Web binding is swallowed by the browser, pick another key.

## What "total consumption" means

The figure comes from the `tokenUsage` session projection, summing four provider-reported buckets:

```text
uncachedInputTokens + outputTokens + cacheReadTokens + cacheWriteTokens
```

This is a **token total, not money**. Cache hits are included, so the number is usually much larger than input + output alone. Hover the figure for the four-way breakdown.

## How it works

- The **host half** is a nearly empty Loader row. Its job is to make `@deepseek-ai/dsh-client-modules` discover the package's browser half through the `dsh.client` declaration.
- The **browser half** is shipped as a lazy-CJS bundle (`window.__ModuleLoader__.load({ id, factory })`) and only depends on shell platform modules: `react` and `@deepseek-ai/dsh-client-store`.
- Session data comes from the global `ctx.sessions.list`; workspace ownership comes from `ctx.workspaces.list` (`sessionIds` is authoritative); switching calls `ctx.uiWorkspace.openSession(sessionId)`.
- The shortcut is registered with `ctx.shortcuts.register()`; the panel is registered into the `shell.overlay` slot and marked with `data-shortcut-modal="session-palette"`, so background shortcuts are blocked while it is open, while the palette's own shortcut toggles it closed.
- Rows without a cached `tokenUsage` value trigger `ctx.sessions.refreshProjections()` for the visible window and update live when the projection arrives.

Package layout:

```text
dsh-session-palette/
├── package.json          # dsh.bundle + dsh.client declarations
├── cordis.patch.yml      # inserts the single Loader row
├── lib/index.js          # host half (no host behavior)
├── lib/client.js         # browser half: shortcut, overlay, search, switch
├── locale/{en,zh}.json   # Plugins page display metadata
├── icon.svg              # Plugins page icon
├── test/client.test.mjs  # pure row/search/format + registration tests
└── .github/workflows/    # CI: syntax check + unit tests
```

## Development

No build step is required: the host entry is plain ESM and the browser entry is a self-contained lazy-CJS bundle.

```sh
git clone https://github.com/alexmaze/dsh-session-palette.git
cd dsh-session-palette

# Link the working copy into a development profile
dsh plugin --profile web add "link:$PWD"

node test/client.test.mjs
```

Edit `lib/client.js`, then refresh the DSH page (or rely on HMR if it is enabled). The test suite covers row filtering (archived / subagent / blank), multi-term search, workspace ownership, token totals (including the legacy `totals` wrapper), time formatting, and shortcut/slot registration.

## Compatibility and limitations

- **Tested with DSH `0.2.1-rc.2`** on macOS. The plugin uses the public client plugin, shortcut, session, workspace, and overlay APIs. DSH's plugin API is still evolving; if a future release changes these surfaces, the plugin may need an update.
- **Archived sessions are hidden** because DSH requires unarchiving before they can be opened. Subagent sessions and blank New Session rows are hidden as well.
- **Token usage can lag** for cold sessions without a projection cache. The row shows `—` until the lazy projection load completes.
- **No monetary cost** is shown because DSH does not expose per-model pricing to the client.

## License

[MIT](LICENSE) © Alex Yan
