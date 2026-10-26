window.__ModuleLoader__.load({
	id: "dsh-session-palette",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const React = require("react");
		const { createSnapshotStore } = require("@deepseek-ai/dsh-client-store");

		const h = React.createElement;
		const NS = "session-palette";
		const MODAL_ID = "session-palette";
		const SHORTCUT_ID = "session.palette.open";
		const LIST_ID = "dsh-session-palette-list";
		const OPTION_ID_PREFIX = "dsh-session-palette-option-";
		const DEFAULT_WORKSPACE_TITLE = "default-workspace";
		const MAX_VISIBLE_ROWS = 10;

		const zh = {
			"shortcut.open": "打开会话面板",
			"shortcut.aliases": "会话, 切换会话, 搜索会话, session, sessions, switch session, palette",
			title: "会话面板",
			placeholder: "搜索会话、工作区…",
			loading: "正在加载会话…",
			"empty.title": "没有匹配的会话",
			"empty.hint": "换个关键词试试",
			"footer.count": "{count} 个会话",
			"footer.select": "选择",
			"footer.open": "打开",
			"footer.close": "关闭",
			"tokens": "总消耗 {value}",
			"tokens.none": "总消耗 —",
			"tokens.breakdown": "输入 {input} · 输出 {output} · 缓存读 {cacheRead} · 缓存写 {cacheWrite}",
			"time.now": "刚刚",
			"time.minutes": "{n} 分钟前",
			"time.hours": "{n} 小时前",
			"time.days": "{n} 天前",
			"time.unknown": "—",
			"workspace.default": "默认工作区",
			"workspace.unknown": "未知工作区",
			"untitled": "未命名会话",
			running: "正在运行",
		};

		const en = {
			"shortcut.open": "Open session palette",
			"shortcut.aliases": "sessions, switch session, search sessions, palette, session",
			title: "Session palette",
			placeholder: "Search sessions or workspaces…",
			loading: "Loading sessions…",
			"empty.title": "No matching sessions",
			"empty.hint": "Try another keyword",
			"footer.count": "{count} sessions",
			"footer.select": "select",
			"footer.open": "open",
			"footer.close": "close",
			"tokens": "{value} tokens",
			"tokens.none": "— tokens",
			"tokens.breakdown": "Input {input} · Output {output} · Cache read {cacheRead} · Cache write {cacheWrite}",
			"time.now": "just now",
			"time.minutes": "{n}m ago",
			"time.hours": "{n}h ago",
			"time.days": "{n}d ago",
			"time.unknown": "—",
			"workspace.default": "Default workspace",
			"workspace.unknown": "Unknown workspace",
			"untitled": "Untitled session",
			running: "Running",
		};

		const CSS = `
.dsh-session-palette {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	box-sizing: border-box;
	padding: max(12vh, var(--dsh-frame-overlay-top, 24px)) 20px 24px;
	font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif);
	color: var(--dsw-alias-label-primary, #1f2328);
	-webkit-font-smoothing: antialiased;
}
.dsh-session-palette-backdrop {
	position: absolute;
	inset: 0;
	background: var(--dsw-alias-bg-mask-1, rgba(12, 15, 22, 0.3));
	backdrop-filter: blur(2px);
	animation: dsh-session-palette-fade 120ms ease-out;
}
.dsh-session-palette-panel {
	position: relative;
	display: flex;
	flex-direction: column;
	width: min(720px, 100%);
	max-height: min(76vh, 760px);
	overflow: hidden;
	background: var(--dsw-alias-bg-layer-2, #ffffff);
	border: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12));
	border-radius: 16px;
	box-shadow: var(--dsw-elevation-prominent, 0 24px 64px rgba(0, 0, 0, 0.28));
	backdrop-filter: var(--dsw-menu-backdrop-filter, none);
	animation: dsh-session-palette-in 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.dsh-session-palette-search {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: 0 0 auto;
	padding: 14px 16px;
	border-bottom: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
}
.dsh-session-palette-search-icon {
	display: flex;
	color: var(--dsw-alias-label-tertiary, #8b919c);
}
.dsh-session-palette-input {
	flex: 1 1 auto;
	min-width: 0;
	padding: 0;
	border: 0;
	outline: 0;
	background: transparent;
	color: inherit;
	font: inherit;
	font-size: 17px;
	line-height: 24px;
}
.dsh-session-palette-input::placeholder {
	color: var(--dsw-alias-label-tertiary, #8b919c);
}
.dsh-session-palette kbd {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 18px;
	height: 18px;
	box-sizing: border-box;
	padding: 0 4px;
	border: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.14));
	border-radius: 5px;
	background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.03));
	color: var(--dsw-alias-label-tertiary, #8b919c);
	font-family: inherit;
	font-size: 11px;
	line-height: 1;
}
.dsh-session-palette-list {
	flex: 1 1 auto;
	max-height: calc(${MAX_VISIBLE_ROWS} * 58px + 12px);
	overflow-y: auto;
	overscroll-behavior: contain;
	padding: 6px;
	scrollbar-width: thin;
}
.dsh-session-palette-row {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 58px;
	box-sizing: border-box;
	padding: 9px 10px;
	border-radius: 10px;
	cursor: default;
}
.dsh-session-palette-row.is-active {
	background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.055));
}
.dsh-session-palette-row-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 30px;
	height: 30px;
	border-radius: 8px;
	background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.05));
	color: var(--dsw-alias-label-secondary, #5c6370);
}
.dsh-session-palette-row.is-active .dsh-session-palette-row-icon {
	color: var(--dsw-alias-brand-primary, #4d6bfe);
	background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 12%, transparent);
}
.dsh-session-palette-row-main {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1 1 auto;
	min-width: 0;
}
.dsh-session-palette-row-title {
	overflow: hidden;
	color: var(--dsw-alias-label-primary, #1f2328);
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.dsh-session-palette-row-meta {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	overflow: hidden;
	color: var(--dsw-alias-label-tertiary, #8b919c);
	font-size: 12px;
	line-height: 18px;
	white-space: nowrap;
}
.dsh-session-palette-workspace {
	min-width: 0;
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
}
.dsh-session-palette-time,
.dsh-session-palette-usage {
	flex: 0 0 auto;
}
.dsh-session-palette-usage {
	font-variant-numeric: tabular-nums;
}
.dsh-session-palette-dot {
	flex: 0 0 auto;
	opacity: 0.55;
}
.dsh-session-palette-running {
	flex: 0 0 auto;
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--dsw-alias-state-business-primary, #4d6bfe);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #4d6bfe) 16%, transparent);
	animation: dsh-session-palette-pulse 1.6s ease-in-out infinite;
}
.dsh-session-palette-enter {
	flex: 0 0 auto;
	padding: 0 5px;
	border: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.14));
	border-radius: 5px;
	color: var(--dsw-alias-label-tertiary, #8b919c);
	font-size: 12px;
	line-height: 18px;
}
.dsh-session-palette-empty {
	padding: 42px 16px;
	text-align: center;
}
.dsh-session-palette-empty-title {
	color: var(--dsw-alias-label-secondary, #5c6370);
	font-size: 14px;
	line-height: 22px;
}
.dsh-session-palette-empty-hint {
	margin-top: 4px;
	color: var(--dsw-alias-label-tertiary, #8b919c);
	font-size: 12px;
	line-height: 18px;
}
.dsh-session-palette-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex: 0 0 auto;
	padding: 8px 14px;
	border-top: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
	color: var(--dsw-alias-label-tertiary, #8b919c);
	font-size: 11px;
	line-height: 16px;
}
.dsh-session-palette-hints {
	display: flex;
	align-items: center;
	gap: 12px;
}
.dsh-session-palette-hints span {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}
@keyframes dsh-session-palette-in {
	from { opacity: 0; transform: translateY(-8px) scale(0.985); }
	to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dsh-session-palette-fade {
	from { opacity: 0; }
	to { opacity: 1; }
}
@keyframes dsh-session-palette-pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
	.dsh-session-palette-panel,
	.dsh-session-palette-backdrop,
	.dsh-session-palette-running {
		animation: none;
	}
}
`;

		/** Human-readable token count with one significant decimal at most. */
		function formatTokens(value) {
			if (!Number.isFinite(value) || value <= 0) return "0";
			const trim = (number, digits) => number.toFixed(digits).replace(/\.0+$/, "");
			if (value >= 1e9) return `${trim(value / 1e9, value >= 1e10 ? 0 : 1)}B`;
			if (value >= 1e6) return `${trim(value / 1e6, value >= 1e7 ? 0 : 1)}M`;
			if (value >= 1e3) return `${trim(value / 1e3, value >= 1e4 ? 0 : 1)}K`;
			return String(Math.round(value));
		}

		/**
		 * Read the tokenUsage projection wire value. The projection publishes the
		 * four totals directly; persisted state versions may wrap them in `totals`,
		 * so accept both.
		 */
		function usageBuckets(usage) {
			if (usage === null || typeof usage !== "object") return null;
			const buckets = usage.totals !== null && typeof usage.totals === "object" ? usage.totals : usage;
			const count = (value) => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0);
			const result = {
				input: count(buckets.uncachedInputTokens),
				output: count(buckets.outputTokens),
				cacheRead: count(buckets.cacheReadTokens),
				cacheWrite: count(buckets.cacheWriteTokens),
			};
			result.total = result.input + result.output + result.cacheRead + result.cacheWrite;
			return result.total > 0 ? result : null;
		}

		function workspaceLabelOf(workspace, cwd, t) {
			if (workspace !== undefined) {
				if (workspace.title === DEFAULT_WORKSPACE_TITLE) return t("workspace.default");
				if (typeof workspace.title === "string" && workspace.title.trim() !== "") return workspace.title;
			}
			if (typeof cwd === "string" && cwd.trim() !== "") {
				const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
				if (base !== undefined && base !== "") return base;
			}
			return t("workspace.unknown");
		}

		function formatDate(timestamp, now) {
			try {
				const date = new Date(timestamp);
				const sameYear = date.getFullYear() === new Date(now).getFullYear();
				return new Intl.DateTimeFormat(undefined, sameYear
					? { month: "short", day: "numeric" }
					: { year: "numeric", month: "short", day: "numeric" }).format(date);
			}
			catch {
				return new Date(timestamp).toLocaleDateString();
			}
		}

		function relativeTime(timestamp, now, t) {
			if (!Number.isFinite(timestamp) || timestamp <= 0) return t("time.unknown");
			const minute = 60_000;
			const hour = 60 * minute;
			const day = 24 * hour;
			const diff = Math.max(0, now - timestamp);
			if (diff < minute) return t("time.now");
			if (diff < hour) return t("time.minutes", { n: Math.floor(diff / minute) });
			if (diff < day) return t("time.hours", { n: Math.floor(diff / hour) });
			if (diff < 7 * day) return t("time.days", { n: Math.floor(diff / day) });
			return formatDate(timestamp, now);
		}

		/**
		 * Derive the visible palette rows from the global Session catalog and the
		 * Workspace projection. Archived and subagent Sessions are not switchable
		 * from here, and blank New Session rows carry no conversation to preview.
		 */
		function selectRows(list, workspaceState, query, t) {
			const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
			const archived = new Set(workspaceState.archivedSessionIds ?? []);
			const owners = new Map();
			for (const workspace of workspaceState.items ?? []) {
				for (const sessionId of workspace.sessionIds ?? []) owners.set(sessionId, workspace);
			}
			const rows = [];
			for (const sessionId of list.ids ?? []) {
				const session = list.byId?.[sessionId];
				if (session === undefined) continue;
				if (session.blank === true || session.origin === "subagent" || archived.has(sessionId)) continue;
				const workspace = owners.get(sessionId);
				const storedTitle = typeof session.title === "string" && session.title.trim() !== "" ? session.title : undefined;
				const title = typeof session.displayTitle === "string" && session.displayTitle.trim() !== ""
					? session.displayTitle
					: storedTitle ?? t("untitled");
				const workspaceLabel = workspaceLabelOf(workspace, session.cwd, t);
				if (terms.length > 0) {
					const haystack = `${title}\n${workspaceLabel}\n${session.cwd ?? ""}\n${sessionId}`.toLowerCase();
					if (!terms.every((term) => haystack.includes(term))) continue;
				}
				rows.push({
					id: sessionId,
					title,
					workspaceLabel,
					workspacePath: workspace?.path ?? session.cwd ?? "",
					updatedAt: Number.isFinite(session.updatedAt) ? session.updatedAt : 0,
					usage: usageBuckets(session.projectionValues?.tokenUsage),
					running: session.running === true,
				});
			}
			rows.sort((left, right) => right.updatedAt - left.updatedAt || left.title.localeCompare(right.title));
			return rows;
		}

		function usageTitle(usage, t) {
			if (usage === null) return undefined;
			return t("tokens.breakdown", {
				input: formatTokens(usage.input),
				output: formatTokens(usage.output),
				cacheRead: formatTokens(usage.cacheRead),
				cacheWrite: formatTokens(usage.cacheWrite),
			});
		}

		function ChatIcon() {
			return h("svg", {
				width: 16,
				height: 16,
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
			}, h("path", {
				d: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7a8.6 8.6 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z",
				stroke: "currentColor",
				strokeWidth: 1.7,
				strokeLinecap: "round",
				strokeLinejoin: "round",
			}));
		}

		function SearchIcon() {
			return h("svg", {
				width: 18,
				height: 18,
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
			}, h("circle", {
				cx: 11,
				cy: 11,
				r: 7,
				stroke: "currentColor",
				strokeWidth: 1.8,
			}), h("path", {
				d: "m20 20-3.2-3.2",
				stroke: "currentColor",
				strokeWidth: 1.8,
				strokeLinecap: "round",
			}));
		}

		/**
		 * The `shell.overlay` entry: a Spotlight-style panel over the whole frame.
		 * It subscribes to the Session and Workspace stores directly, so rows follow
		 * live list updates and projection refreshes while it is open.
		 */
		function SessionPalette({ api, t }) {
			// Bind every store through a wrapper: `workspaces.list` is a class
			// instance whose methods need their receiver.
			const subscribePalette = React.useCallback((listener) => api.palette.subscribe(listener), [api]);
			const getPalette = React.useCallback(() => api.palette.getSnapshot(), [api]);
			const subscribeSessions = React.useCallback((listener) => api.sessions.list.subscribe(listener), [api]);
			const getSessions = React.useCallback(() => api.sessions.list.getSnapshot(), [api]);
			const subscribeWorkspaces = React.useCallback((listener) => api.workspaces.list.subscribe(listener), [api]);
			const getWorkspaces = React.useCallback(() => api.workspaces.list.getSnapshot(), [api]);
			const state = React.useSyncExternalStore(subscribePalette, getPalette);
			const list = React.useSyncExternalStore(subscribeSessions, getSessions);
			const workspaceState = React.useSyncExternalStore(subscribeWorkspaces, getWorkspaces);
			const rows = React.useMemo(
				() => selectRows(list, workspaceState, state.query, t),
				[list, workspaceState, state.query, t],
			);
			const active = rows.length === 0 ? -1 : Math.min(Math.max(state.selected, 0), rows.length - 1);
			const inputRef = React.useRef(null);
			const previousFocusRef = React.useRef(null);
			const composingRef = React.useRef(false);
			const now = Date.now();

			const update = (patch) => {
				api.palette.set({ ...api.palette.getSnapshot(), ...patch });
			};

			const move = (delta) => {
				if (rows.length === 0) return;
				const current = Math.min(Math.max(api.palette.getSnapshot().selected, 0), rows.length - 1);
				update({ selected: ((current + delta) % rows.length + rows.length) % rows.length });
			};

			const choose = (row) => {
				if (row !== undefined) api.choose(row.id);
			};

			React.useEffect(() => {
				if (!state.open) return undefined;
				previousFocusRef.current = document.activeElement;
				const frame = requestAnimationFrame(() => {
					const input = inputRef.current;
					if (input !== null) {
						input.focus();
						input.select();
					}
				});
				const previousOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
				return () => {
					cancelAnimationFrame(frame);
					document.body.style.overflow = previousOverflow;
					const previous = previousFocusRef.current;
					if (previous !== null && previous.isConnected && typeof previous.focus === "function") {
						try {
							previous.focus({ preventScroll: true });
						}
						catch {
							previous.focus();
						}
					}
				};
			}, [state.open]);

			React.useEffect(() => {
				if (!state.open || active < 0) return;
				const node = document.querySelector(`[data-dsh-palette-active="true"]`);
				if (node !== null) node.scrollIntoView({ block: "nearest" });
			}, [state.open, active]);

			React.useEffect(() => {
				if (!state.open || active < 0) return;
				const start = Math.max(0, active - 4);
				const end = Math.min(rows.length, active + 6);
				for (let index = start; index < end; index += 1) {
					const row = rows[index];
					if (row !== undefined) api.refreshProjection(row.id);
				}
			}, [state.open, active, rows, api]);

			React.useEffect(() => {
				if (!state.open) return;
				if (rows.length === 0 && state.selected !== 0) {
					update({ selected: 0 });
				}
				else if (rows.length > 0 && state.selected > rows.length - 1) {
					update({ selected: rows.length - 1 });
				}
			}, [state.open, state.selected, rows.length]);

			if (!state.open) return null;

			const loading = rows.length === 0 && list.phase !== "ready";

			const onQueryChange = (event) => {
				update({ query: event.target.value, selected: 0 });
			};

			const onKeyDown = (event) => {
				if (event.nativeEvent?.isComposing === true || composingRef.current) return;
				switch (event.key) {
					case "ArrowDown":
						event.preventDefault();
						event.stopPropagation();
						move(1);
						break;
					case "ArrowUp":
						event.preventDefault();
						event.stopPropagation();
						move(-1);
						break;
					case "PageDown":
						event.preventDefault();
						event.stopPropagation();
						move(MAX_VISIBLE_ROWS);
						break;
					case "PageUp":
						event.preventDefault();
						event.stopPropagation();
						move(-MAX_VISIBLE_ROWS);
						break;
					case "Home":
						event.preventDefault();
						event.stopPropagation();
						if (rows.length > 0) update({ selected: 0 });
						break;
					case "End":
						event.preventDefault();
						event.stopPropagation();
						if (rows.length > 0) update({ selected: rows.length - 1 });
						break;
					case "Enter":
						event.preventDefault();
						event.stopPropagation();
						choose(rows[active]);
						break;
					case "Escape":
						event.preventDefault();
						event.stopPropagation();
						api.close();
						break;
					case "Tab":
						event.preventDefault();
						event.stopPropagation();
						if (inputRef.current !== null) inputRef.current.focus();
						break;
					default:
						break;
				}
			};

			const optionId = (index) => `${OPTION_ID_PREFIX}${index}`;

			return h("div", { className: "dsh-session-palette" },
				h("div", { className: "dsh-session-palette-backdrop", onClick: api.close }),
				h("div", {
					className: "dsh-session-palette-panel",
					role: "dialog",
					"aria-modal": "true",
					"aria-label": t("title"),
					"data-shortcut-modal": MODAL_ID,
				},
					h("div", { className: "dsh-session-palette-search" },
						h("span", { className: "dsh-session-palette-search-icon" }, h(SearchIcon)),
						h("input", {
							ref: inputRef,
							className: "dsh-session-palette-input",
							type: "text",
							value: state.query,
							placeholder: t("placeholder"),
							"aria-label": t("placeholder"),
							role: "combobox",
							"aria-expanded": true,
							"aria-controls": LIST_ID,
							"aria-activedescendant": active >= 0 ? optionId(active) : undefined,
							autoComplete: "off",
							spellCheck: false,
							onChange: onQueryChange,
							onKeyDown,
							onCompositionStart: () => { composingRef.current = true; },
							onCompositionEnd: () => { composingRef.current = false; },
						}),
						h("kbd", null, "esc"),
					),
					h("div", { className: "dsh-session-palette-list", id: LIST_ID, role: "listbox", "aria-label": t("title") },
						rows.length === 0
							? h("div", { className: "dsh-session-palette-empty" },
								h("div", { className: "dsh-session-palette-empty-title" }, loading ? t("loading") : t("empty.title")),
								loading ? null : h("div", { className: "dsh-session-palette-empty-hint" }, t("empty.hint")),
							)
							: rows.map((row, index) => h("div", {
								key: row.id,
								id: optionId(index),
								role: "option",
								"aria-selected": index === active,
								"data-dsh-palette-active": index === active ? "true" : undefined,
								className: `dsh-session-palette-row${index === active ? " is-active" : ""}`,
								title: row.title,
								onMouseEnter: () => {
									if (index !== active) update({ selected: index });
								},
								onMouseDown: (event) => event.preventDefault(),
								onClick: () => choose(row),
							},
								h("span", { className: "dsh-session-palette-row-icon" }, h(ChatIcon)),
								h("div", { className: "dsh-session-palette-row-main" },
									h("div", { className: "dsh-session-palette-row-title" }, row.title),
									h("div", { className: "dsh-session-palette-row-meta" },
										h("span", { className: "dsh-session-palette-workspace", title: row.workspacePath || undefined }, row.workspaceLabel),
										h("span", { className: "dsh-session-palette-dot" }, "·"),
										h("span", {
											className: "dsh-session-palette-time",
											title: row.updatedAt > 0 ? new Date(row.updatedAt).toLocaleString() : undefined,
										}, relativeTime(row.updatedAt, now, t)),
										h("span", { className: "dsh-session-palette-dot" }, "·"),
										h("span", {
											className: "dsh-session-palette-usage",
											title: usageTitle(row.usage, t),
										}, row.usage === null ? t("tokens.none") : t("tokens", { value: formatTokens(row.usage.total) })),
									),
								),
								row.running ? h("span", { className: "dsh-session-palette-running", title: t("running") }) : null,
								index === active ? h("span", { className: "dsh-session-palette-enter", "aria-hidden": "true" }, "↵") : null,
							)),
					),
					h("div", { className: "dsh-session-palette-footer" },
						h("span", null, t("footer.count", { count: rows.length })),
						h("span", { className: "dsh-session-palette-hints" },
							h("span", null, h("kbd", null, "↑"), h("kbd", null, "↓"), t("footer.select")),
							h("span", null, h("kbd", null, "↵"), t("footer.open")),
							h("span", null, h("kbd", null, "esc"), t("footer.close")),
						),
					),
				),
			);
		}

		function injectStyle() {
			if (typeof document === "undefined") return () => {};
			const tagId = "dsh-session-palette/palette.css";
			const existing = document.querySelector(`style[data-plugin-css="${tagId}"]`);
			if (existing !== null) return () => {};
			const style = document.createElement("style");
			style.dataset.plugin = "dsh-session-palette";
			style.dataset.pluginCss = tagId;
			style.textContent = CSS;
			document.head.appendChild(style);
			return () => { style.remove(); };
		}

		/**
		 * Client plugin body: one shortcut registration, one overlay registration,
		 * and the palette state they share.
		 */
		function apply(ctx) {
			try {
				const sessions = ctx.sessions;
				const workspaces = ctx.workspaces;
				const uiWorkspace = ctx.uiWorkspace;
				const t = ctx.locale.bind(NS);
				const palette = createSnapshotStore({ open: false, query: "", selected: 0 });
				const attempted = new Set();

				const close = () => {
					if (!palette.getSnapshot().open) return;
					palette.set({ open: false, query: "", selected: 0 });
				};

				const open = () => {
					attempted.clear();
					palette.set({ open: true, query: "", selected: 0 });
					if (sessions.list.getSnapshot().phase !== "ready") {
						sessions.refresh().catch((error) => {
							console.warn("session palette: failed to refresh the session list:", error);
						});
					}
				};

				const toggle = () => {
					if (palette.getSnapshot().open) close();
					else open();
				};

				const api = {
					palette,
					sessions,
					workspaces,
					close,
					choose: (sessionId) => {
						close();
						try {
							uiWorkspace.openSession(sessionId);
						}
						catch (error) {
							console.error("session palette: failed to open session:", error);
						}
					},
					refreshProjection: (sessionId) => {
						if (attempted.has(sessionId)) return;
						const session = sessions.list.getSnapshot().byId?.[sessionId];
						if (session?.projectionValues?.tokenUsage !== undefined) return;
						attempted.add(sessionId);
						sessions.refreshProjections(sessionId).catch((error) => {
							console.warn("session palette: failed to refresh session projections:", error);
						});
					},
				};

				ctx.effect(() => ctx.locale.register(NS, { zh, en }), "session-palette: dictionaries");
				ctx.effect(() => injectStyle(), "session-palette: styles");

				ctx.effect(() => ctx.shortcuts.register({
					id: SHORTCUT_ID,
					label: () => t("shortcut.open"),
					aliases: t("shortcut.aliases").split(",").map((alias) => alias.trim()).filter(Boolean),
					defaults: {
						"desktop:macos": { code: "KeyP", modifiers: ["primary", "shift"] },
						"desktop:windows": { code: "KeyP", modifiers: ["primary", "shift"] },
						"desktop:linux": { code: "KeyP", modifiers: ["primary", "shift"] },
						"web:macos": { code: "KeyP", modifiers: ["primary", "shift"] },
						"web:windows": { code: "KeyP", modifiers: ["primary", "shift"] },
					},
					regions: ["page", "editable", "terminal"],
					modals: [MODAL_ID],
					resolve: () => ({ status: "handled", run: toggle }),
				}), "session-palette: shortcut");

				ctx.slots.inject("shell.overlay", () => ctx.slots.register({
					name: "shell.overlay",
					id: "session-palette",
					locale: NS,
					inject: () => ({ api }),
				}, SessionPalette));
			}
			catch (error) {
				console.error("session-palette: activation failed", error);
				throw error;
			}
		}

		const inject = ["slots", "sessions", "workspaces", "uiWorkspace", "shortcuts", "locale"];

		exports.apply = apply;
		exports.inject = inject;
		exports.__internals = {
			formatTokens,
			usageBuckets,
			relativeTime,
			selectRows,
			workspaceLabelOf,
		};
		return module.exports;
	}
});
