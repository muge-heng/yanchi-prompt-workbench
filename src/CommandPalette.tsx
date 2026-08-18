import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, newPrompt, type SmartView } from "./store";
import { cx, getTypeDef, tl, tt } from "./lib";
import { Icon, Kbd, TypeBadge } from "./ui";

interface Item { id: string; kind: "action" | "prompt"; label: string; icon?: string; hint?: string; type?: string; run: () => void }

export default function CommandPalette() {
  const { state, paletteOpen, setPaletteOpen, nav, select, setFocus, set, toast, focus } = useStore();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQ(""); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const items = useMemo<Item[]>(() => {
    const live = state.prompts.filter((p) => !p.deletedAt);
    const vaultId = state.vaults[0]?.id;
    const go = (r: any) => () => { nav(r); select(null); };
    const actions: Item[] = [
      { id: "a-new", kind: "action", label: tt("新建提示词", "New prompt"), icon: "plus", hint: "N", run: () => {
        const vid = vaultId;
        if (!vid) { toast("warn", tt("请先创建一个仓库", "Please create a vault first")); nav({ name: "vaults" }); return; }
        const p = newPrompt(vid, "custom");
        set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
        nav({ name: "list", vaultId: vid });
        select(p.id); setFocus(true);
      } },
      { id: "a-home", kind: "action", label: tt("回到工作台", "Go to workspace"), icon: "home", run: go({ name: "home" }) },
      { id: "a-vaults", kind: "action", label: tt("仓库总览", "Vault overview"), icon: "grid", run: go({ name: "vaults" }) },
      { id: "a-types", kind: "action", label: tt("打开类型中心", "Open Type Center"), icon: "settings", run: go({ name: "types" }) },
      { id: "a-sync", kind: "action", label: tt("打开同步中心", "Open Sync Center"), icon: "sync", run: go({ name: "sync" }) },
      { id: "a-trash", kind: "action", label: tt("打开回收站", "Open trash"), icon: "trash", run: go({ name: "trash" }) },
      { id: "a-settings", kind: "action", label: tt("打开设置", "Open settings"), icon: "settings", hint: "⌘,", run: go({ name: "settings" }) },
      { id: "a-focus", kind: "action", label: focus ? tt("退出专注模式", "Exit focus mode") : tt("进入专注模式", "Enter focus mode"), icon: "eye", hint: "⌘\\", run: () => setFocus(!focus) },
      ...(([[ "recent-used", tt("最近使用", "Recently used")], ["recent-edit", tt("最近编辑", "Recently edited")], ["fav", tt("收藏", "Favorites")], ["draft", tt("草稿", "Drafts")], ["often", tt("高频使用", "Most used")], ["idle", tt("长期未动", "Long idle")], ["versioned", tt("有版本历史", "Has versions")]] as [SmartView, string][])
        .map(([sv, label]) => ({ id: "sv-" + sv, kind: "action" as const, label: `${tt("智能视图", "Smart view")} · ${label}`, icon: "sparkle", run: go({ name: "list", smart: sv }) }))),
    ];
    const prompts: Item[] = live
      .filter((p) => !q.trim() || (p.title + p.summary + p.body).toLowerCase().includes(q.toLowerCase()))
      .slice(0, q ? 8 : 4)
      .map((p) => ({
        id: "p-" + p.id, kind: "prompt" as const, label: p.title, type: p.type, icon: getTypeDef(p.type).icon,
        run: () => { nav({ name: "list", vaultId: p.vaultId }); select(p.id); setFocus(true); },
      }));
    const acts = actions.filter((a) => !q.trim() || a.label.toLowerCase().includes(q.toLowerCase())).slice(0, q ? 6 : 8);
    return [...prompts, ...acts];
  }, [q, state, focus, nav, select, setFocus, set, toast]);

  useEffect(() => { setIdx(0); }, [q]);

  if (!paletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0" style={{ background: "rgba(59, 50, 33, 0.36)", backdropFilter: "blur(2px)" }} onClick={() => setPaletteOpen(false)} />
      <div className="pop-in card relative w-full max-w-[560px] overflow-hidden" style={{ boxShadow: "var(--shadow-lift)" }}>
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <Icon name="search" size={15} className="opacity-50" />
          <input ref={inputRef} className="w-full bg-transparent text-[14px] outline-none" placeholder={tt("搜索提示词或命令…", "Search prompts or commands…")}
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && items[idx]) { items[idx].run(); setPaletteOpen(false); }
              if (e.key === "Escape") setPaletteOpen(false);
            }} />
          <Kbd>esc</Kbd>
        </div>
        <div className="thin-scroll max-h-[46vh] overflow-y-auto p-1.5">
          {items.length === 0 && <div className="px-4 py-8 text-center text-[12.5px]" style={{ color: "var(--ink-3)" }}>{tt("没有匹配的内容", "No matches")}</div>}
          {items.map((it, i) => (
            <button key={it.id} className={cx("flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors", i === idx && "bg-[#efe4c9]")}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { it.run(); setPaletteOpen(false); }}>
              <span className={cx("flex h-7 w-7 flex-none items-center justify-center rounded-lg border", i === idx && "border-[var(--brass-2)]")}
                style={{ borderColor: "var(--line)", background: "var(--card)", color: it.type ? getTypeDef(it.type).color : "var(--ink-2)" }}>
                <Icon name={it.icon || "doc"} size={14} />
              </span>
              <span className="min-w-0 flex-1 truncate">{it.label}</span>
              {it.kind === "prompt" && it.type ? <TypeBadge type={it.type as any} size="sm" /> : it.hint && <Kbd>{it.hint}</Kbd>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t px-4 py-2 text-[10.5px]" style={{ borderColor: "var(--line)", background: "var(--card-2)", color: "var(--ink-3)" }}>
          <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> {tt("选择", "select")}</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> {tt("执行", "run")}</span>
          <span className="ml-auto">{tt("砚池命令面板", "Yanchi command palette")}</span>
        </div>
      </div>
    </div>
  );
}
