import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AppState, Prompt, Version, DebugRun, Tag, Vault, Group } from "./lib";
import { uid, makeBackup, download } from "./lib";
import { seedState } from "./seed";
import { SyncEngine, type SyncStatus, type SyncLog } from "./sync";

/* ---------- IndexedDB 轻封装（失败自动回退 localStorage） ---------- */
const LS_KEY = "yanchi.state.v1";
function idbOpen(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open("yanchi-db", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function idbGet(): Promise<AppState | null> {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction("kv", "readonly").objectStore("kv").get("state");
    tx.onsuccess = () => res((tx.result as any) ?? null);
    tx.onerror = () => rej(tx.error);
  });
}
async function idbSet(v: AppState) {
  const db = await idbOpen();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction("kv", "readwrite").objectStore("kv").put(v, "state");
    tx.onsuccess = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/* ---------- 路由与上下文 ---------- */
export type RouteName = "home" | "vaults" | "list" | "sync" | "settings" | "trash";
export type SmartView = "recent-used" | "recent-edit" | "fav" | "draft" | "often" | "idle" | "versioned" | "pending-sync";
export interface Route { name: RouteName; vaultId?: string; tagId?: string; smart?: SmartView; groupId?: string }

export interface Toast { id: string; kind: "ok" | "warn" | "err" | "info"; msg: string; action?: { label: string; fn: () => void } }

interface Ctx {
  ready: boolean;
  state: AppState;
  set: (fn: (s: AppState) => AppState) => void;
  patchPrompt: (id: string, patch: Partial<Prompt>) => void;
  toasts: Toast[];
  toast: (kind: Toast["kind"], msg: string, action?: Toast["action"]) => void;
  closeToast: (id: string) => void;
  route: Route; nav: (r: Route) => void;
  selectedId: string | null; select: (id: string | null) => void;
  focus: boolean; setFocus: (b: boolean) => void;
  paletteOpen: boolean; setPaletteOpen: (b: boolean) => void;
  /* 同步运行时 */
  syncStatus: SyncStatus; syncLogs: SyncLog[]; queue: string[];
  conflicts: { local: Prompt; remote: Prompt }[];
  syncApi: ReturnType<typeof useSyncApi> extends never ? any : SyncApi;
  storageKB: number;
}

export interface SyncApi {
  connect: (url?: string) => void;
  disconnect: () => void;
  sendTest: () => void;
  pushPrompts: (ids: string[]) => void;
  pushScope: () => void;
  flushQueue: () => void;
  clearQueue: () => void;
  resolveConflict: (id: string, how: "local" | "remote" | "both") => void;
  lastSyncAt: number | null;
}

const StoreCtx = createContext<Ctx>(null as any);
export const useStore = () => useContext(StoreCtx);

function useSyncApi(
  stateRef: { current: AppState },
  set: (fn: (s: AppState) => AppState) => void,
  setStatus: (s: SyncStatus) => void,
  setLogs: (fn: (l: SyncLog[]) => SyncLog[]) => void,
  setQueue: (fn: (q: string[]) => string[]) => void,
  setConflicts: (fn: (c: { local: Prompt; remote: Prompt }[]) => { local: Prompt; remote: Prompt }[]) => void,
  lastSyncRef: { current: number | null },
  toast: (k: Toast["kind"], m: string) => void
): SyncApi {
  const engineRef = useRef<SyncEngine | null>(null);
  const getEngine = () => {
    if (!engineRef.current) {
      engineRef.current = new SyncEngine({
        onStatus: (s) => setStatus(s),
        onLog: (log) => setLogs((l) => [log, ...l].slice(0, 120)),
        onRemotePrompt: (remote: Prompt) => {
          const local = stateRef.current.prompts.find((p) => p.id === remote.id);
          if (local && local.updatedAt > remote.updatedAt && local.updatedAt !== remote.updatedAt) {
            setConflicts((c) => [...c.filter((x) => x.local.id !== remote.id), { local, remote }]);
            toast("warn", `「${remote.title}」在另一台设备也被修改，已放入冲突中心`);
          } else {
            set((s) => ({
              ...s,
              prompts: local ? s.prompts.map((p) => (p.id === remote.id ? { ...remote, sync: "synced" as const } : p)) : [{ ...remote, sync: "synced" as const }, ...s.prompts],
            }));
            toast("ok", `已接收「${remote.title}」`);
          }
          lastSyncRef.current = Date.now();
        },
      });
    }
    return engineRef.current;
  };

  const serialize = useCallback(
    (ids: string[]) => {
      const s = stateRef.current;
      return ids.map((id) => s.prompts.find((p) => p.id === id)).filter(Boolean) as Prompt[];
    },
    [stateRef]
  );

  return {
    connect: (url) => {
      const target = url ?? stateRef.current.settings.wsUrl;
      if (!target) { toast("warn", "请先填写 WebSocket 地址"); return; }
      getEngine().connect(target, stateRef.current.settings.ns, stateRef.current.settings.deviceName);
    },
    disconnect: () => getEngine().close(),
    sendTest: () => {
      if (getEngine().send({ type: "test", note: "来自砚池的测试消息", at: Date.now() })) toast("ok", "测试消息已发送，请观察日志回显");
      else toast("err", "当前未连接，无法发送测试消息");
    },
    pushPrompts: (ids) => {
      const list = serialize(ids);
      let ok = 0;
      list.forEach((p) => { if (getEngine().send({ type: "push", prompt: p })) ok++; });
      if (ok > 0) {
        set((s) => ({ ...s, prompts: s.prompts.map((p) => (ids.includes(p.id) ? { ...p, sync: "synced" as const } : p)) }));
        setQueue((q) => q.filter((id) => !ids.includes(id)));
        lastSyncRef.current = Date.now();
        toast("ok", `已推送 ${ok} 条提示词`);
      } else {
        setQueue((q) => [...q, ...ids.filter((id) => !q.includes(id))]);
        toast("warn", "当前未连接，已放入待同步队列，连接后自动补发");
      }
    },
    pushScope: () => {
      const s = stateRef.current;
      let list = s.prompts.filter((p) => !p.deletedAt);
      if (s.settings.scope === "fav") list = list.filter((p) => p.favorite);
      getEngine().send({ type: "scope-push", count: list.length, prompts: list });
      set((st) => ({ ...st, prompts: st.prompts.map((p) => (p.deletedAt ? p : { ...p, sync: "synced" as const })) }));
      lastSyncRef.current = Date.now();
      toast("ok", `已按同步范围推送 ${list.length} 条`);
    },
    flushQueue: () => {
      const q = [...(engineRef.current ? [] : [])];
      void q;
    },
    clearQueue: () => { setQueue(() => []); toast("info", "待同步队列已清空"); },
    resolveConflict: (id, how) => {
      setConflicts((cs) => {
        const c = cs.find((x) => x.local.id === id);
        if (!c) return cs;
        if (how === "remote") set((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...c.remote, sync: "synced" as const } : p)) }));
        if (how === "both")
          set((s) => ({
            ...s,
            prompts: [{ ...c.remote, id: uid(), title: c.remote.title + "（远端副本）", sync: "synced" as const, createdAt: Date.now(), updatedAt: Date.now() }, ...s.prompts],
          }));
        if (how === "local") set((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...p, sync: "synced" as const } : p)) }));
        return cs.filter((x) => x.local.id !== id);
      });
      toast("ok", how === "local" ? "已保留本地版本" : how === "remote" ? "已采用远端版本" : "已保留两份");
    },
    get lastSyncAt() { return lastSyncRef.current; },
  } as SyncApi;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => seedState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<{ local: Prompt; remote: Prompt }[]>([]);
  const [storageKB, setStorageKB] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastSyncRef = useRef<number | null>(null);
  const saveTimer = useRef<any>(null);
  const quotaWarned = useRef(false);

  const toast = useCallback((kind: Toast["kind"], msg: string, action?: Toast["action"]) => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, kind, msg, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3200);
  }, []);
  const closeToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /* 载入 */
  useEffect(() => {
    let live = true;
    (async () => {
      let data: AppState | null = null;
      try { data = await idbGet(); } catch { data = null; }
      if (!data) {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) data = JSON.parse(raw);
        } catch { data = null; }
      }
      if (!live) return;
      if (data && data.vaults) setState({ ...seedState(), ...data, settings: { ...seedState().settings, ...data.settings } });
      setReady(true);
    })();
    return () => { live = false; };
  }, []);

  /* 自动保存（防抖，双写 IDB + localStorage） */
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        setStorageKB(Math.round((JSON.stringify(state).length * 2) / 1024));
        quotaWarned.current = false;
      } catch {
        if (!quotaWarned.current) {
          quotaWarned.current = true;
          toast("warn", "本机存储空间接近上限或受到限制，建议导出备份或清理回收站。");
        }
      }
      idbSet(state).catch(() => { /* 已写入 localStorage 作为备份 */ });
    }, 450);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, ready]);

  const set = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const patchPrompt = useCallback(
    (id: string, patch: Partial<Prompt>) => {
      const p0 = stateRef.current.prompts.find((x) => x.id === id);
      const st = stateRef.current.settings;
      const enqueue = !!(p0 && !p0.deletedAt && st.autoSync && st.wsUrl.trim() && p0.sync !== "local");
      setState((s) => ({
        ...s,
        prompts: s.prompts.map((p) =>
          p.id === id
            ? { ...p, ...patch, updatedAt: patch.updatedAt ?? Date.now(), ...(enqueue && !patch.deletedAt ? { sync: "pending" as const } : {}) }
            : p
        ),
      }));
      /* 实时同步：仅在配置了同步地址且开启自动同步时入队 */
      if (enqueue) setQueue((q) => (q.includes(id) ? q : [...q, id]));
    },
    []
  );

  const syncApi = useSyncApi(stateRef, set, setSyncStatus, setSyncLogs, setQueue, setConflicts, lastSyncRef, toast);

  /* 队列自动补发 */
  useEffect(() => {
    if (syncStatus === "online" && queue.length > 0 && stateRef.current.settings.autoSync) {
      const t = setTimeout(() => syncApi.pushPrompts(queue), 800);
      return () => clearTimeout(t);
    }
  }, [syncStatus, queue, syncApi]);

  /* 导出工具挂到 window 之外：通过 helpers 暴露 */
  const helpers = useMemo(
    () => ({
      exportPrompts: (ids: string[], withVersions = true) => {
        const list = stateRef.current.prompts.filter((p) => ids.includes(p.id));
        const name = `砚池备份_${list.length}条_${new Date().toISOString().slice(0, 10)}.json`;
        download(name, JSON.stringify(makeBackup(stateRef.current, list, withVersions), null, 2));
        toast("ok", `已导出备份（${list.length} 条）`);
      },
      exportAll: () => {
        const list = stateRef.current.prompts.filter((p) => !p.deletedAt);
        const name = `砚池全量备份_${new Date().toISOString().slice(0, 10)}.json`;
        download(name, JSON.stringify(makeBackup(stateRef.current, list, true), null, 2));
        toast("ok", `已导出全量备份（${list.length} 条）`);
      },
    }),
    [toast]
  );
  (helpers as any); // 保留引用

  const value: Ctx = {
    ready, state, set, patchPrompt,
    toasts, toast, closeToast,
    route, nav: (r) => { setRoute(r); },
    selectedId, select: (id) => setSelectedId(id),
    focus, setFocus, paletteOpen, setPaletteOpen,
    syncStatus, syncLogs, queue, conflicts, syncApi, storageKB,
  };
  (value as any).helpers = helpers;

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useHelpers() {
  const ctx = useStore() as any;
  return ctx.helpers as {
    exportPrompts: (ids: string[], withVersions?: boolean) => void;
    exportAll: () => void;
  };
}

/* ---------- 常用领域操作 ---------- */
export function newPrompt(vaultId: string, type: Prompt["type"], title = "未命名提示词"): Prompt {
  const nowTs = Date.now();
  return {
    id: uid(), vaultId, type, title, summary: "", body: "", negative: "",
    fields: type === "chat" ? { turns: [] } : type === "agent" ? { examples: [] } : type === "video" ? { shots: [] } : {},
    params: {}, tagIds: [], favorite: false, pinned: false, deletedAt: null,
    useCount: 0, lastUsedAt: null, lastDebugAt: null,
    createdAt: nowTs, updatedAt: nowTs, presets: [], versions: [], runs: [], sync: "local",
  };
}

export function versionOf(p: Prompt, label?: string): Version {
  return {
    id: uid(), at: Date.now(),
    label: label || `v${p.versions.length + 1} · 手动存档`,
    body: p.body, fields: JSON.parse(JSON.stringify(p.fields)), negative: p.negative,
  };
}

export function runOf(final: string, values: Record<string, string>, note = ""): DebugRun {
  return { id: uid(), at: Date.now(), final, values, copied: false, sent: false, note };
}

export type { Tag, Vault, Group };
