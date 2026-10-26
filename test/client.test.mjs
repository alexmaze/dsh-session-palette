import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(here);

const messages = {
	"workspace.default": "默认工作区",
	"workspace.unknown": "未知工作区",
	"untitled": "未命名会话",
	"time.now": "刚刚",
	"time.minutes": "{n} 分钟前",
	"time.hours": "{n} 小时前",
	"time.days": "{n} 天前",
	"time.unknown": "—",
	"tokens": "总消耗 {value}",
	"tokens.none": "总消耗 —",
	"tokens.breakdown": "输入 {input} · 输出 {output} · 缓存读 {cacheRead} · 缓存写 {cacheWrite}",
	"shortcut.open": "打开会话面板",
	"shortcut.aliases": "会话, 切换会话",
	title: "会话面板",
	placeholder: "搜索会话、工作区…",
	loading: "正在加载会话…",
	"empty.title": "没有匹配的会话",
	"empty.hint": "换个关键词试试",
	"footer.count": "{count} 个会话",
	"footer.select": "选择",
	"footer.open": "打开",
	"footer.close": "关闭",
	running: "正在运行",
};

const t = (key, params = {}) => {
	const text = messages[key] ?? key;
	return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
};

function createSnapshotStore(initial) {
	let state = initial;
	const listeners = new Set();
	return {
		getSnapshot: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		set: (next) => {
			state = next;
			for (const listener of listeners) listener(state);
		},
		update: (mutator) => {
			mutator(state);
			for (const listener of listeners) listener(state);
		},
	};
}

function loadClientModule() {
	let registration;
	const window = {
		__ModuleLoader__: {
			load: (value) => {
				registration = value;
			},
		},
	};
	const react = {
		createElement: () => null,
		useCallback: (callback) => callback,
		useEffect: () => {},
		useMemo: (factory) => factory(),
		useRef: (value) => ({ current: value }),
		useSyncExternalStore: () => undefined,
	};
	const source = readFileSync(join(packageRoot, "lib/client.js"), "utf8");
	const factory = new Function("window", source);
	factory(window);
	assert.ok(registration, "client bundle must register a module factory");
	assert.equal(registration.id, "dsh-session-palette");
	const require = (specifier) => {
		if (specifier === "react") return react;
		if (specifier === "@deepseek-ai/dsh-client-store") return { createSnapshotStore };
		throw new Error(`unexpected require: ${specifier}`);
	};
	return registration.factory(require);
}


const mod = loadClientModule();
const internals = mod.__internals;

assert.equal(typeof mod.apply, "function");
assert.deepEqual(mod.inject, ["slots", "sessions", "workspaces", "uiWorkspace", "shortcuts", "locale"]);

/* ---------- pure row derivation ---------- */

const list = {
	phase: "ready",
	ids: ["s-new", "s-old", "s-arch", "s-sub", "s-blank", "s-totals"],
	byId: {
		"s-new": {
			id: "s-new",
			displayTitle: "修复登录态",
			updatedAt: 5_000,
			cwd: "/w/a",
			running: true,
			projectionValues: {
				tokenUsage: {
					uncachedInputTokens: 100,
					outputTokens: 50,
					cacheReadTokens: 1_000,
					cacheWriteTokens: 0,
				},
			},
		},
		"s-old": {
			id: "s-old",
			displayTitle: "旧会话",
			updatedAt: 3_000,
			cwd: "/w/b",
			projectionValues: {
				tokenUsage: {
					totals: {
						uncachedInputTokens: 10,
						outputTokens: 20,
						cacheReadTokens: 0,
						cacheWriteTokens: 5,
					},
				},
			},
		},
		"s-arch": { id: "s-arch", displayTitle: "归档会话", updatedAt: 9_000, cwd: "/w/a" },
		"s-sub": { id: "s-sub", displayTitle: "子会话", updatedAt: 8_000, origin: "subagent" },
		"s-blank": { id: "s-blank", displayTitle: "New Session", updatedAt: 7_000, blank: true },
		"s-totals": { id: "s-totals", displayTitle: "第三方工作区里的会话", updatedAt: 1_000, cwd: "/w/c" },
	},
};

const workspaces = {
	items: [
		{ workspaceId: "w1", title: "default-workspace", path: "/w/a", sessionIds: ["s-new", "s-arch"] },
		{ workspaceId: "w2", title: "alpha", path: "/w/b", sessionIds: ["s-old"] },
		{ workspaceId: "w3", title: "beta", path: "/w/c", sessionIds: ["s-totals"] },
	],
	archivedSessionIds: ["s-arch"],
};

const all = internals.selectRows(list, workspaces, "", t);
assert.deepEqual(all.map((row) => row.id), ["s-new", "s-old", "s-totals"], "archived, subagent, and blank rows are hidden; recency orders rows");
assert.equal(all[0].workspaceLabel, "默认工作区");
assert.equal(all[1].workspaceLabel, "alpha");
assert.equal(all[0].usage.total, 1_150);
assert.equal(all[1].usage.total, 35);
assert.equal(all[2].usage, null);
assert.equal(all[0].running, true);

assert.deepEqual(internals.selectRows(list, workspaces, "alpha", t).map((row) => row.id), ["s-old"], "workspace name is searchable");
assert.deepEqual(internals.selectRows(list, workspaces, "默认", t).map((row) => row.id), ["s-new"], "localized default workspace label is searchable");
assert.deepEqual(internals.selectRows(list, workspaces, "修 登录", t).map((row) => row.id), ["s-new"], "space-separated terms are ANDed");
assert.deepEqual(internals.selectRows(list, workspaces, "S-OLD", t).map((row) => row.id), ["s-old"], "session id search is case-insensitive");
assert.deepEqual(internals.selectRows(list, workspaces, "zzz", t), [], "no match yields an empty list");

/* ---------- projections and formatting ---------- */

assert.deepEqual(internals.usageBuckets({ uncachedInputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4 }), {
	input: 1,
	output: 2,
	cacheRead: 3,
	cacheWrite: 4,
	total: 10,
});
assert.deepEqual(internals.usageBuckets({ totals: { uncachedInputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4 } }), {
	input: 1,
	output: 2,
	cacheRead: 3,
	cacheWrite: 4,
	total: 10,
});
assert.equal(internals.usageBuckets(null), null);
assert.equal(internals.usageBuckets({}), null);

assert.equal(internals.formatTokens(999), "999");
assert.equal(internals.formatTokens(1_200), "1.2K");
assert.equal(internals.formatTokens(12_345), "12K");
assert.equal(internals.formatTokens(1_000_000), "1M");
assert.equal(internals.formatTokens(1_500_000), "1.5M");
assert.equal(internals.formatTokens(2_000_000_000), "2B");

const now = Date.UTC(2026, 9, 23, 12, 0, 0);
assert.equal(internals.relativeTime(now - 10_000, now, t), "刚刚");
assert.equal(internals.relativeTime(now - 3 * 60_000, now, t), "3 分钟前");
assert.equal(internals.relativeTime(now - 5 * 3_600_000, now, t), "5 小时前");
assert.equal(internals.relativeTime(now - 2 * 86_400_000, now, t), "2 天前");
assert.equal(internals.relativeTime(0, now, t), "—");

/* ---------- plugin registration ---------- */

const calls = { opened: [], effects: 0, shortcuts: null, slot: null };
const sessions = {
	list: createSnapshotStore({ phase: "ready", ids: [], byId: {} }),
	refresh: async () => {},
	refreshProjections: async () => {},
};
const workspaceStore = createSnapshotStore(workspaces);
const ctx = {
	sessions,
	workspaces: { list: workspaceStore },
	uiWorkspace: {
		openSession: (id) => calls.opened.push(id),
	},
	locale: {
		bind: () => t,
		register: () => () => {},
	},
	shortcuts: {
		register: (config) => {
			calls.shortcuts = config;
			return () => {};
		},
	},
	slots: {
		inject: (_name, callback) => callback(),
		register: (registration, Component) => {
			calls.slot = { registration, Component };
			return () => {};
		},
	},
	effect: (callback) => {
		calls.effects += 1;
		return callback();
	},
};

globalThis.document = {
	querySelector: () => null,
	createElement: () => ({ dataset: {}, textContent: "" }),
	head: { appendChild: () => {} },
	body: { style: { overflow: "" } },
};

mod.apply(ctx);

assert.equal(calls.effects, 3, "dictionaries, styles, and shortcut are registered as effects");
assert.equal(calls.shortcuts.id, "session.palette.open");
assert.deepEqual(calls.shortcuts.defaults["desktop:macos"], { code: "KeyP", modifiers: ["primary", "shift"] });
assert.deepEqual(calls.shortcuts.defaults["web:windows"], { code: "KeyP", modifiers: ["primary", "shift"] });
assert.deepEqual(calls.shortcuts.modals, ["session-palette"]);
assert.deepEqual(calls.shortcuts.regions, ["page", "editable", "terminal"]);
assert.equal(calls.slot.registration.name, "shell.overlay");
assert.equal(calls.slot.registration.id, "session-palette");
assert.equal(typeof calls.slot.Component, "function");

const injected = calls.slot.registration.inject();
assert.ok(injected.api);
assert.equal(calls.shortcuts.resolve().status, "handled");
assert.equal(injected.api.palette.getSnapshot().open, false);
calls.shortcuts.resolve().run();
assert.equal(injected.api.palette.getSnapshot().open, true);
calls.shortcuts.resolve().run();
assert.equal(injected.api.palette.getSnapshot().open, false);

injected.api.choose("s-new");
assert.deepEqual(calls.opened, ["s-new"]);
assert.equal(injected.api.palette.getSnapshot().open, false);

console.log("client tests passed");
