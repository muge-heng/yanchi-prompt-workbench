import { useEffect, useState } from "react";
import { StoreProvider, useStore, newPrompt } from "./store";
import { cx } from "./lib";
import Sidebar from "./Sidebar";
import Home from "./Home";
import { VaultListPage, PromptListPage } from "./lists";
import Editor from "./Editor";
import Settings from "./Settings";
import SyncCenter from "./SyncCenter";
import CommandPalette from "./CommandPalette";
import TypeManager from "./TypeManager";
import { Icon, SyncDot } from "./ui";
import { tt } from "./lib";

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { ready, state, set, route, selectedId, select, focus, setFocus, paletteOpen, setPaletteOpen, nav, toast } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const selected = state.prompts.find((p) => p.id === selectedId && !p.deletedAt) || null;

  /* 选中项被删除、或专注模式下无选中时自动退出 */
  useEffect(() => {
    if (selectedId && !selected) { select(null); setFocus(false); }
    if (focus && !selectedId) setFocus(false);
  }, [selectedId, selected, focus, select, setFocus]);

  /* 全局快捷键 */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(!paletteOpen); return; }
      if (mod && e.key === "\\") { e.preventDefault(); if (selectedId) setFocus(!focus); return; }
      if (mod && e.key === ",") { e.preventDefault(); nav({ name: "settings" }); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); toast("ok", tt("已保存到本机", "Saved to this device")); return; }
      if (typing) return;
      if (e.key === "Escape" && focus) { setFocus(false); return; }
      if (mod) return;
      if (e.key.toLowerCase() === "n") { quickNew(); return; }
      if (e.key === "/") {
        e.preventDefault();
        if (route.name !== "list" && route.name !== "trash") nav({ name: "list", smart: "recent-edit" });
        setTimeout(() => (document.querySelector("[data-search-input]") as HTMLInputElement | null)?.focus(), 60);
        return;
      }
      if (e.key === "[" || e.key === "]") step(e.key === "]" ? 1 : -1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen, focus, selectedId, route, state.prompts, state.vaults]);

  function quickNew() {
    const vid = route.vaultId || state.vaults[0]?.id;
    if (!vid) { toast("warn", tt("请先创建一个仓库", "Please create a vault first")); nav({ name: "vaults" }); return; }
    const p = newPrompt(vid, "custom");
    set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
    nav({ name: "list", vaultId: vid });
    select(p.id); setFocus(true);
  }

  function step(d: number) {
    const live = state.prompts.filter((p) => !p.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt);
    if (live.length === 0) return;
    const i = live.findIndex((p) => p.id === selectedId);
    const next = live[(i + d + live.length) % live.length];
    if (next) select(next.id);
  }

  if (!ready) {
    return (
      <div className="paper-bg flex h-screen flex-col items-center justify-center gap-5">
        <div className="seal-stamp flex h-16 w-16 items-center justify-center rounded-2xl text-[30px] font-black" style={{ animation: "breathe 2s ease-in-out infinite" }}>砚</div>
        <div className="text-center">
          <div className="title-serif text-[17px] font-bold">{tt("正在打开本地仓库", "Opening your local vault")}</div>
          <div className="mt-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>{tt("数据从本机浏览器读取，不经过任何服务器", "Data is read from this browser — no server involved")}</div>
        </div>
        <div className="h-[3px] w-[140px] overflow-hidden rounded-full" style={{ background: "var(--line-2)" }}>
          <div className="h-full w-1/2 rounded-full" style={{ background: "var(--brass)", animation: "slideRight 1s ease-in-out infinite alternate" }} />
        </div>
      </div>
    );
  }

  const content =
    route.name === "home" ? <Home /> :
    route.name === "vaults" ? <VaultListPage /> :
    route.name === "sync" ? <SyncCenter /> :
    route.name === "settings" ? <Settings /> :
    route.name === "types" ? <TypeManager /> :
    <PromptListPage />;

  return (
    <div className={cx("paper-bg flex h-screen overflow-hidden", state.settings.reduceMotion && "reduce-motion")}>
      {!focus && (
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>
      )}

      {/* 移动端顶栏 */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-[52px] items-center gap-3 border-b px-4 md:hidden"
        style={{ borderColor: "var(--line-2)", background: "linear-gradient(180deg, #f3ecdd, #ede3cd)" }}>
        <button className="icon-btn" onClick={() => setDrawer(true)} aria-label={tt("打开菜单", "Open menu")}><Icon name="collapse" size={16} /></button>
        <div className="seal-stamp flex h-7 w-7 items-center justify-center rounded-lg text-[14px] font-black">砚</div>
        <span className="title-serif text-[15px] font-bold">{tt("砚池", "Yanchi")}</span>
        <span className="ml-auto"><SyncDot status={useStoreSyncStatus()} text={false} /></span>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(59,50,33,0.35)" }} onClick={() => setDrawer(false)} />
          <div className="slide-in absolute left-0 top-0 h-full">
            <Sidebar collapsed={false} onToggle={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 pt-[52px] md:pt-0">
        {!focus && <section className="min-w-0 flex-1">{content}</section>}

        {selected && (
          <>
            {/* 桌面详情栏 */}
            <section
              className={cx("hidden min-w-0 border-l lg:block", focus ? "flex-1" : "w-[540px] flex-none xl:w-[620px]")}
              style={{ borderColor: "var(--line-2)", boxShadow: "inset 8px 0 16px -12px rgba(84,64,34,0.3)" }}>
              <Editor key={selected.id} p={selected} />
            </section>
            {/* 小屏详情浮层 */}
            <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "var(--card)" }}>
              <Editor key={selected.id} p={selected} />
            </div>
          </>
        )}
      </main>

      <Toasts />
      <CommandPalette />
    </div>
  );
}

function useStoreSyncStatus() {
  const { syncStatus } = useStore();
  return syncStatus;
}

function Toasts() {
  const { toasts, closeToast } = useStore();
  const KIND_COLOR: Record<string, string> = { ok: "var(--ok)", warn: "var(--warn)", err: "var(--err)", info: "var(--slate)" };
  const KIND_ICON: Record<string, string> = { ok: "check", warn: "clock", err: "close", info: "sparkle" };
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[99] flex w-[330px] flex-col gap-2.5">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in card pointer-events-auto flex items-start gap-2.5 px-4 py-3" style={{ boxShadow: "var(--shadow-lift)" }}>
          <span className="mt-[1px] flex-none" style={{ color: KIND_COLOR[t.kind] }}>
            <Icon name={KIND_ICON[t.kind]} size={14} sw={2.2} />
          </span>
          <div className="min-w-0 flex-1 text-[12.5px] leading-relaxed">{t.msg}</div>
          {t.action && (
            <button className="btn flex-none !px-2.5 !py-[5px] !text-[11.5px]" onClick={() => { t.action!.fn(); closeToast(t.id); }}>
              {t.action.label}
            </button>
          )}
          <button className="icon-btn !h-6 !w-6 flex-none" onClick={() => closeToast(t.id)} aria-label={tt("关闭提示", "Dismiss")}><Icon name="close" size={11} /></button>
        </div>
      ))}
    </div>
  );
}
