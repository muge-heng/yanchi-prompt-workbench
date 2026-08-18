import { useMemo, useState } from "react";
import { useStore, newPrompt, type SmartView } from "./store";
import { cx, uid, tt, TAG_COLORS, type Prompt, type Vault } from "./lib";
import { Icon, Modal, SyncDot } from "./ui";

const VAULT_ICONS = ["briefcase", "agent", "image", "video", "pen", "inbox", "book", "folder", "sparkle", "grid"];

export function NewVaultModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { set, toast, nav } = useStore();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("briefcase");
  const [color, setColor] = useState(TAG_COLORS[0]);
  return (
    <Modal open={open} onClose={onClose} title={tt("新建仓库", "New vault")} width={440}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>{tt("仓库名称", "Vault name")}</label>
          <input className="input" autoFocus placeholder={tt("例如：生图模板库", "e.g. Image template library")} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && create()} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>{tt("描述（可选）", "Description (optional)")}</label>
          <input className="input" placeholder={tt("一句话说明这个仓库存什么", "One line about what this vault holds")} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>{tt("图标", "Icon")}</label>
          <div className="flex flex-wrap gap-1.5">
            {VAULT_ICONS.map((ic) => (
              <button key={ic} className={cx("icon-btn border", icon === ic && "border-[var(--brass-2)] bg-[#f6eeda]")}
                style={{ borderColor: icon === ic ? "var(--brass-2)" : "var(--line)" }} onClick={() => setIcon(ic)}>
                <Icon name={ic} size={15} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>{tt("点缀色", "Accent color")}</label>
          <div className="flex gap-2">
            {TAG_COLORS.slice(0, 7).map((c) => (
              <button key={c} onClick={() => setColor(c)} className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: color === c ? "var(--ink)" : "transparent" }} aria-label={tt("选择颜色", "Pick color")} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <button className="btn" onClick={onClose}>{tt("取消", "Cancel")}</button>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={create}>{tt("创建仓库", "Create vault")}</button>
        </div>
      </div>
    </Modal>
  );

  function create() {
    const v: Vault = { id: uid(), name: name.trim(), icon, desc: desc.trim(), color, createdAt: Date.now(), updatedAt: Date.now(), syncOn: true };
    set((s) => ({ ...s, vaults: [...s.vaults, v] }));
    toast("ok", tt("仓库", "Vault") + `「${v.name}」` + tt("已创建", " created"));
    nav({ name: "list", vaultId: v.id });
    setName(""); setDesc("");
    onClose();
  }
}

function countBy(s: { prompts: Prompt[] }, fn: (p: Prompt) => boolean) {
  return s.prompts.filter((p) => !p.deletedAt && fn(p)).length;
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { state, route, nav, select, set, toast, syncStatus, queue, conflicts, selectedId, setFocus } = useStore();
  const [newVault, setNewVault] = useState(false);
  const [openVaults, setOpenVaults] = useState<string[]>([state.vaults[0]?.id].filter(Boolean));
  const [newGroupFor, setNewGroupFor] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");

  const live = useMemo(() => state.prompts.filter((p) => !p.deletedAt), [state.prompts]);
  const W = 7 * 86_400_000;
  /* 左栏区域开关 · which sidebar sections are visible */
  const sb = state.settings.sidebar ?? { smartViews: true, vaults: true, tags: true, typeCenter: true, syncCard: true };

  const smartViews: { smart: SmartView; label: string; icon: string; n: number }[] = [
    { smart: "recent-used", label: tt("最近使用", "Recently used"), icon: "clock", n: live.filter((p) => p.lastUsedAt && Date.now() - p.lastUsedAt < W).length },
    { smart: "recent-edit", label: tt("最近编辑", "Recently edited"), icon: "pen", n: live.filter((p) => Date.now() - p.updatedAt < W).length },
    { smart: "fav", label: tt("收藏", "Favorites"), icon: "star", n: live.filter((p) => p.favorite).length },
    { smart: "draft", label: tt("草稿", "Drafts"), icon: "doc", n: live.filter((p) => p.tagIds.some((t) => /待测试|to.?test/i.test(state.tags.find((x) => x.id === t)?.name || ""))).length },
    { smart: "often", label: tt("高频使用", "Heavy use"), icon: "bolt", n: live.filter((p) => p.useCount >= 10).length },
    { smart: "idle", label: tt("长期未动", "Long untouched"), icon: "eye", n: live.filter((p) => Date.now() - p.updatedAt > 30 * 86_400_000).length },
    { smart: "versioned", label: tt("有版本", "Versioned"), icon: "history", n: live.filter((p) => p.versions.length > 0).length },
    { smart: "pending-sync", label: tt("待同步", "Pending sync"), icon: "sync", n: live.filter((p) => p.sync === "pending").length },
  ];

  function quickCreate() {
    const vaultId = route.vaultId || state.vaults[0]?.id;
    if (!vaultId) { toast("warn", tt("请先创建一个仓库", "Please create a vault first")); setNewVault(true); return; }
    const p = newPrompt(vaultId, "custom", tt("未命名提示词", "Untitled prompt"));
    set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
    nav({ name: "list", vaultId });
    select(p.id); setFocus(true);
    toast("ok", tt("已新建，开始书写", "Created. Start writing"));
  }

  function addGroup(vaultId: string) {
    if (!groupName.trim()) return;
    set((s) => ({ ...s, groups: [...s.groups, { id: uid(), vaultId, name: groupName.trim(), order: 99 }] }));
    toast("ok", tt("分组", "Group") + `「${groupName.trim()}」` + tt("已创建", " created"));
    setGroupName(""); setNewGroupFor(null);
  }

  const isOn = (r: { name: string; vaultId?: string; smart?: string; tagId?: string; groupId?: string }) =>
    route.name === r.name && route.vaultId === r.vaultId && route.smart === (r as any).smart && route.tagId === (r as any).tagId && route.groupId === (r as any).groupId;

  return (
    <aside className={cx("linen relative z-30 flex h-full flex-none flex-col border-r transition-[width] duration-300", collapsed ? "w-[64px]" : "w-[248px]")}
      style={{ borderColor: "var(--line-2)", background: "linear-gradient(180deg, #efe6d0, #e9dfc6)", boxShadow: "inset -6px 0 12px -8px rgba(84,64,34,0.25)" }}>
      {/* 品牌 Brand */}
      <div className={cx("flex items-center gap-3 px-4 pb-4 pt-5", collapsed && "justify-center px-0")}>
        <div className="seal-stamp flex h-10 w-10 flex-none items-center justify-center rounded-[10px] text-[20px] font-black">砚</div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="title-serif text-[17px] font-black leading-tight tracking-wide">{tt("砚池", "Yanchi")}</div>
            <div className="engrave text-[10.5px] tracking-[0.18em]">{tt("私人提示词工作台", "Private prompt workbench")}</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3.5 pb-3">
          <button className="btn btn-primary w-full" onClick={quickCreate}>
            <Icon name="plus" size={14} /> {tt("新建提示词", "New prompt")}
          </button>
        </div>
      )}

      <div className="thin-scroll flex-1 overflow-y-auto px-2.5 pb-3">
        {/* 主导航 Main navigation */}
        <div className="space-y-0.5">
          {([
            { name: "home", label: tt("工作台", "Workbench"), icon: "home" },
            { name: "vaults", label: tt("仓库总览", "All vaults"), icon: "grid" },
            ...(sb.typeCenter ? [{ name: "types", label: tt("类型中心", "Type Center"), icon: "layers" }] : []),
            { name: "sync", label: tt("同步中心", "Sync Center"), icon: "sync", badge: conflicts.length + queue.length },
            { name: "trash", label: tt("回收站", "Trash"), icon: "trash" },
            { name: "settings", label: tt("设置", "Settings"), icon: "settings" },
          ] as any[]).map((it: any) => (
            <button key={it.name} title={it.label} className={cx("nav-item", isOn({ name: it.name }) && "on", collapsed && "justify-center !px-0")}
              onClick={() => { nav({ name: it.name }); if (it.name !== "list") select(null); }}>
              <Icon name={it.icon} size={16} />
              {!collapsed && <span className="flex-1 text-left">{it.label}</span>}
              {!collapsed && it.badge > 0 && (
                <span className="rounded-full px-1.5 py-[1px] text-[10px] font-bold text-[#fdf6ea]" style={{ background: "var(--seal)" }}>{it.badge}</span>
              )}
            </button>
          ))}
        </div>

        {!collapsed && (
          <>
            {/* 智能视图 Smart views */}
            {sb.smartViews && (<>
            <div className="engrave mt-5 mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.22em]">{tt("智能视图", "Smart views")}</div>
            <div className="space-y-0.5">
              {smartViews.map((v) => (
                <button key={v.smart} className={cx("nav-item !py-[6.5px]", isOn({ name: "list", smart: v.smart } as any) && "on")}
                  onClick={() => nav({ name: "list", smart: v.smart })}>
                  <Icon name={v.icon} size={14} className="opacity-80" />
                  <span className="flex-1 text-left text-[12.5px]">{v.label}</span>
                  <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{v.n || ""}</span>
                </button>
              ))}
            </div>
            </>)}

            {/* 仓库 Vaults */}
            {sb.vaults && (<>
            <div className="mt-5 mb-1.5 flex items-center justify-between px-3">
              <span className="engrave text-[10.5px] font-bold tracking-[0.22em]">{tt("仓库", "Vaults")}</span>
              <button className="icon-btn !h-6 !w-6" onClick={() => setNewVault(true)} title={tt("新建仓库", "New vault")}><Icon name="plus" size={13} /></button>
            </div>
            <div className="space-y-0.5">
              {state.vaults.map((v) => {
                const groups = state.groups.filter((g) => g.vaultId === v.id).sort((a, b) => a.order - b.order);
                const open = openVaults.includes(v.id);
                const n = countBy(state, (p) => p.vaultId === v.id);
                return (
                  <div key={v.id}>
                    <div className={cx("nav-item !py-[7px]", isOn({ name: "list", vaultId: v.id }) && !route.groupId && "on")}>
                      <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => nav({ name: "list", vaultId: v.id })} title={v.name}>
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md border"
                          style={{ color: v.color, borderColor: "color-mix(in srgb, " + v.color + " 35%, var(--line))", background: "color-mix(in srgb, " + v.color + " 10%, var(--card))" }}>
                          <Icon name={v.icon} size={13} />
                        </span>
                        <span className="flex-1 truncate text-[12.5px]">{v.name}</span>
                        <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{n}</span>
                      </button>
                      <button className="icon-btn !h-5 !w-5 !rounded" onClick={() => setOpenVaults((o) => (open ? o.filter((x) => x !== v.id) : [...o, v.id]))} aria-label={tt("展开分组", "Toggle groups")}>
                        <Icon name={open ? "chevD" : "chevR"} size={11} />
                      </button>
                    </div>
                    {open && (
                      <div className="ml-[26px] space-y-0.5 border-l py-0.5 pl-2" style={{ borderColor: "var(--line-2)" }}>
                        {groups.map((g) => (
                          <button key={g.id} className={cx("nav-item !px-2 !py-[5px]", route.groupId === g.id && "on")}
                            onClick={() => nav({ name: "list", vaultId: v.id, groupId: g.id })}>
                            <Icon name="folder" size={12.5} className="opacity-75" />
                            <span className="flex-1 truncate text-left text-[12px]">{g.name}</span>
                            <span className="text-[10px] tabular-nums" style={{ color: "var(--ink-3)" }}>{countBy(state, (p) => p.groupId === g.id)}</span>
                          </button>
                        ))}
                        {newGroupFor === v.id ? (
                          <div className="flex items-center gap-1 px-1 py-0.5">
                            <input className="input !py-[4px] !text-[12px]" autoFocus placeholder={tt("分组名", "Group name")} value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") addGroup(v.id); if (e.key === "Escape") setNewGroupFor(null); }}
                              onBlur={() => { if (groupName.trim()) addGroup(v.id); else setNewGroupFor(null); }} />
                          </div>
                        ) : (
                          <button className="nav-item !px-2 !py-[5px] !text-[11.5px] opacity-70" onClick={() => { setNewGroupFor(v.id); if (!open) setOpenVaults((o) => [...o, v.id]); }}>
                            <Icon name="plus" size={11} /> {tt("新分组", "New group")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>)}

            {/* 标签 Tags */}
            {sb.tags && (<>
            <div className="mt-5 mb-1.5 px-3">
              <span className="engrave text-[10.5px] font-bold tracking-[0.22em]">{tt("标签", "Tags")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-2.5">
              {state.tags.map((t) => (
                <button key={t.id} className={cx("chip chip-btn", route.tagId === t.id && "!border-[var(--brass-2)] !bg-[#f6eeda] font-medium text-[var(--ink)]")}
                  onClick={() => nav({ name: "list", tagId: t.id })}>
                  <span className="dot !h-[6px] !w-[6px]" style={{ background: t.color }} />
                  {t.name}
                </button>
              ))}
            </div>
            </>)}
          </>
        )}
      </div>

      {/* 底部状态 Footer status */}
      <div className={cx("border-t p-3", collapsed && "px-2")} style={{ borderColor: "var(--line-2)", background: "rgba(255,252,244,0.5)" }}>
        {!collapsed && sb.syncCard ? (
          <button className="card card-hover w-full px-3 py-2.5 text-left" onClick={() => nav({ name: "sync" })}>
            <div className="flex items-center justify-between">
              <SyncDot status={syncStatus} />
              {queue.length > 0 && <span className="text-[10.5px]" style={{ color: "var(--warn)" }}>{queue.length} {tt("条待同步", "pending")}</span>}
            </div>
            <div className="mt-1 truncate text-[10.5px]" style={{ color: "var(--ink-3)" }}>
              {state.settings.wsUrl ? state.settings.wsUrl : tt("本地模式 · 未配置同步", "Local mode · sync not configured")}
            </div>
          </button>
        ) : !collapsed ? null : (
          sb.syncCard ? (
            <button className="icon-btn mx-auto" title={tt("同步中心", "Sync Center")} onClick={() => nav({ name: "sync" })}>
              <span className={cx("dot", syncStatus === "online" && "breathe")} style={{ background: syncStatus === "online" ? "var(--ok)" : "var(--ink-3)" }} />
            </button>
          ) : null
        )}
        <button className="icon-btn mt-2 w-full" onClick={onToggle} title={collapsed ? tt("展开侧栏", "Expand sidebar") : tt("收起侧栏", "Collapse sidebar")}>
          <Icon name={collapsed ? "expand" : "collapse"} size={15} />
        </button>
      </div>

      <NewVaultModal open={newVault} onClose={() => setNewVault(false)} />
      {/* 保持焦点模式入口可用 Keep focus-mode entry available */}
      {selectedId && collapsed && (
        <button className="icon-btn absolute -right-0 top-1/2" onClick={() => setFocus(true)} title={tt("专注模式", "Focus mode")}><Icon name="eye" size={14} /></button>
      )}
    </aside>
  );
}
