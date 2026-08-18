import { useMemo, useState, type ReactNode } from "react";
import { useStore, useHelpers, newPrompt, type SmartView } from "./store";
import { cx, timeAgo, uid, allTypes, getTypeDef, tl, tb, tt, composePrompt, extractVars, type Prompt, type Vault, type Tag } from "./lib";
import { Icon, Modal, Confirm, Reveal, TypeBadge, EmptyState, Toggle } from "./ui";
import { NewVaultModal } from "./Sidebar";

export function hl(text: string, q: string): ReactNode {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/* ================= 仓库总览 ================= */
export function VaultListPage() {
  const { state, set, nav, toast } = useStore();
  const helpers = useHelpers();
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Vault | null>(null);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Vault | null>(null);

  const live = state.prompts.filter((p) => !p.deletedAt);

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[980px] px-7 pb-16 pt-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="engrave mb-1 text-[11px] tracking-[0.25em]">VAULTS</div>
              <h1 className="title-serif text-[26px] font-black">{tt("仓库总览", "All vaults")}</h1>
              <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>{state.vaults.length} {tt("个空间", "spaces")} · {live.length} {tt("条提示词", "prompts")} · {tt("数据保存在本机", "data stays on this device")}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setNewOpen(true)}><Icon name="plus" size={14} /> {tt("新建仓库", "New vault")}</button>
          </div>
        </Reveal>

        {state.vaults.length === 0 ? (
          <div className="card mt-8">
            <EmptyState icon="grid" title={tt("还没有仓库", "No vaults yet")} desc={tt("仓库是你组织提示词的最大单位，比如「工作项目」「生图模板库」。", "A vault is the biggest unit for organizing prompts, e.g. “Work projects” or “Image templates”.")}>
              <button className="btn btn-primary" onClick={() => setNewOpen(true)}><Icon name="plus" size={13} /> {tt("创建第一个仓库", "Create your first vault")}</button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {state.vaults.map((v, i) => {
              const ps = live.filter((p) => p.vaultId === v.id);
              const tags = [...new Set(ps.flatMap((p) => p.tagIds))].slice(0, 3);
              const lastUp = ps.reduce((m, p) => Math.max(m, p.updatedAt), 0);
              return (
                <Reveal key={v.id} delay={i * 60}>
                  <div className="card card-hover group flex h-full flex-col p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border"
                        style={{ color: v.color, borderColor: "color-mix(in srgb, " + v.color + " 38%, var(--line))", background: "color-mix(in srgb, " + v.color + " 10%, var(--card))", boxShadow: "var(--inset)" }}>
                        <Icon name={v.icon} size={20} />
                      </span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="icon-btn" title={tt("重命名", "Rename")} onClick={() => { setEditing(v); setName(v.name); }}><Icon name="pen" size={13} /></button>
                        <button className="icon-btn" title={tt("导出仓库", "Export vault")} onClick={() => helpers.exportPrompts(ps.map((p) => p.id))}><Icon name="download" size={13} /></button>
                        <button className="icon-btn hover:!text-[var(--err)]" title={tt("删除仓库", "Delete vault")} onClick={() => setToDelete(v)}><Icon name="trash" size={13} /></button>
                      </div>
                    </div>
                    <button className="text-left" onClick={() => nav({ name: "list", vaultId: v.id })}>
                      <div className="title-serif text-[16px] font-bold">{v.name}</div>
                      <div className="mt-1 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{v.desc || tt("暂无描述", "No description yet")}</div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tid) => {
                        const t = state.tags.find((x) => x.id === tid);
                        return t ? <span key={tid} className="chip !py-[1.5px] !text-[10.5px]"><span className="dot !h-[5px] !w-[5px]" style={{ background: t.color }} />{t.name}</span> : null;
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                      <span className="tabular-nums">{ps.length} {tt("条", "items")} · {ps.filter((p) => p.favorite).length} {tt("收藏", "starred")}</span>
                      <span>{lastUp ? timeAgo(lastUp) + " " + tt("前更新", "ago") : tt("空仓库", "Empty vault")}</span>
                    </div>
                    <button className="btn mt-3 w-full !py-[7px] !text-[12px] opacity-90" onClick={() => nav({ name: "list", vaultId: v.id })}>
                      {tt("进入仓库", "Open vault")} <Icon name="chevR" size={12} />
                    </button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      <NewVaultModal open={newOpen} onClose={() => setNewOpen(false)} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={tt("重命名仓库", "Rename vault")} width={380}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          onKeyDown={(e) => e.key === "Enter" && saveName()} />
        <div className="mt-4 flex justify-end gap-2.5">
          <button className="btn" onClick={() => setEditing(null)}>{tt("取消", "Cancel")}</button>
          <button className="btn btn-primary" onClick={saveName}>{tt("保存", "Save")}</button>
        </div>
      </Modal>

      <Confirm open={!!toDelete} onClose={() => setToDelete(null)} title={`${tt("删除仓库", "Delete vault")}「${toDelete?.name}」`}
        desc={`${live.filter((p) => p.vaultId === toDelete?.id).length} ${tt("条提示词将一并移入回收站，可随时恢复。", "prompts inside will also move to Trash and can be restored anytime.")}`}
        okText={tt("移入回收站", "Move to Trash")} onOk={() => {
          if (!toDelete) return;
          set((s) => ({
            ...s,
            vaults: s.vaults.filter((v) => v.id !== toDelete.id),
            groups: s.groups.filter((g) => g.vaultId !== toDelete.id),
            prompts: s.prompts.map((p) => (p.vaultId === toDelete.id && !p.deletedAt ? { ...p, deletedAt: Date.now() } : p)),
          }));
          toast("ok", tt("已删除仓库，内容可在回收站恢复", "Vault deleted; its contents can be restored from Trash"));
          nav({ name: "vaults" });
        }} />
    </div>
  );

  function saveName() {
    if (!editing || !name.trim()) return;
    set((s) => ({ ...s, vaults: s.vaults.map((v) => (v.id === editing.id ? { ...v, name: name.trim() } : v)) }));
    toast("ok", "已保存");
    setEditing(null);
  }
}

/* ================= 智能视图表题 ================= */
const SMART_LABEL: Record<SmartView, { t: string; d: string; icon: string }> = {
  "recent-used": { t: "最近使用", d: "近 7 天试运行或复制过的提示词", icon: "clock" },
  "recent-edit": { t: "最近编辑", d: "近 7 天改动过的内容", icon: "pen" },
  fav: { t: "收藏", d: "你标过星号的常用资产", icon: "star" },
  draft: { t: "草稿", d: "带「待测试」标签、尚未成熟的内容", icon: "doc" },
  often: { t: "高频使用", d: "使用次数 ≥ 10 的主力提示词", icon: "bolt" },
  idle: { t: "长期未动", d: "超过 30 天未编辑，也许可以归档或打磨", icon: "eye" },
  versioned: { t: "有版本历史", d: "存过版本、可回滚的提示词", icon: "history" },
  "pending-sync": { t: "待同步", d: "修改尚未推送到局域网设备", icon: "sync" },
};

/* ================= 提示词列表 ================= */
export function PromptListPage() {
  const store = useStore();
  const { state, route, select, selectedId, set, toast, setFocus, syncStatus } = store;
  const helpers = useHelpers();
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState<string>("all");
  const [sort, setSort] = useState<"update" | "create" | "use" | "title">("update");
  const [view, setView] = useState<"card" | "compact">("card");
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  const vault = route.vaultId ? state.vaults.find((v) => v.id === route.vaultId) : undefined;
  const group = route.groupId ? state.groups.find((g) => g.id === route.groupId) : undefined;
  const tag = route.tagId ? state.tags.find((t) => t.id === route.tagId) : undefined;
  const smart = route.smart ? SMART_LABEL[route.smart] : undefined;
  const isTrash = route.name === "trash";

  const base = useMemo(() => state.prompts.filter((p) => (isTrash ? !!p.deletedAt : !p.deletedAt)), [state.prompts, isTrash]);

  const filtered = useMemo(() => {
    let list = base;
    if (route.vaultId) list = list.filter((p) => p.vaultId === route.vaultId);
    if (route.groupId) list = list.filter((p) => p.groupId === route.groupId);
    if (route.tagId) list = list.filter((p) => p.tagIds.includes(route.tagId!));
    if (route.smart) {
      const W = 7 * 86_400_000, M = 30 * 86_400_000;
      const testTag = (p: Prompt) => p.tagIds.some((t) => state.tags.find((x) => x.id === t)?.name === "待测试");
      switch (route.smart) {
        case "recent-used": list = list.filter((p) => p.lastUsedAt && Date.now() - p.lastUsedAt < W); break;
        case "recent-edit": list = list.filter((p) => Date.now() - p.updatedAt < W); break;
        case "fav": list = list.filter((p) => p.favorite); break;
        case "draft": list = list.filter(testTag); break;
        case "often": list = list.filter((p) => p.useCount >= 10); break;
        case "idle": list = list.filter((p) => Date.now() - p.updatedAt > M); break;
        case "versioned": list = list.filter((p) => p.versions.length > 0); break;
        case "pending-sync": list = list.filter((p) => p.sync === "pending"); break;
      }
    }
    if (typeF !== "all") list = list.filter((p) => p.type === typeF);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter((p) => {
        const tagNames = p.tagIds.map((t) => state.tags.find((x) => x.id === t)?.name || "").join(" ");
        return [p.title, p.summary, p.body, p.negative, tagNames, Object.values(p.fields).filter((v) => typeof v === "string").join(" "), extractVars(p).join(" ")].join("\n").toLowerCase().includes(k);
      });
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "update") return b.updatedAt - a.updatedAt;
      if (sort === "create") return b.createdAt - a.createdAt;
      if (sort === "use") return b.useCount - a.useCount;
      return a.title.localeCompare(b.title, "zh");
    });
  }, [base, route, typeF, q, sort, state.tags]);

  const title = isTrash ? "回收站" : vault?.name || group?.name || tag?.name || smart?.t || "全部提示词";
  const desc = isTrash ? "删除的内容会在这里保留，可随时恢复" : vault ? vault.desc : group ? `${state.vaults.find((v) => v.id === group.vaultId)?.name ?? ""} · 分组` : tag ? `标签筛选 · ${tag.name}` : smart?.d;

  function toggleSel(id: string) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function trash(ids: string[]) {
    set((s) => ({ ...s, prompts: s.prompts.map((p) => (ids.includes(p.id) ? { ...p, deletedAt: Date.now() } : p)) }));
    setSel([]);
    toast("ok", `已移入回收站（${ids.length} 条），30 天内可恢复`, {
      label: "撤销",
      fn: () => set((s) => ({ ...s, prompts: s.prompts.map((p) => (ids.includes(p.id) ? { ...p, deletedAt: null } : p)) })),
    });
  }

  function restore(ids: string[]) {
    set((s) => ({ ...s, prompts: s.prompts.map((p) => (ids.includes(p.id) ? { ...p, deletedAt: null } : p)) }));
    setSel([]);
    toast("ok", `已恢复 ${ids.length} 条`);
  }

  function purge(ids: string[]) {
    set((s) => ({ ...s, prompts: s.prompts.filter((p) => !ids.includes(p.id)) }));
    setSel([]);
    toast("info", `已彻底删除 ${ids.length} 条`);
  }

  function createHere() {
    const vaultId = vault?.id || state.vaults[0]?.id;
    if (!vaultId) { toast("warn", "请先创建一个仓库"); return; }
    const p = newPrompt(vaultId, "custom");
    if (group) p.groupId = group.id;
    set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
    select(p.id); setFocus(true);
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* 头部 */}
      <div className="flex-none border-b px-6 pb-0 pt-6" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="title-serif truncate text-[21px] font-black">{title}</h1>
              <span className="chip !py-[2px] !text-[10.5px] tabular-nums">{filtered.length}</span>
              {route.smart === "pending-sync" && syncStatus === "online" && <span className="text-[11px]" style={{ color: "var(--ok)" }}>连接中</span>}
            </div>
            {desc && <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-2)" }}>{desc}</p>}
          </div>
          {!isTrash && (
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => { setSelMode((v) => !v); setSel([]); }}>
                <Icon name="check" size={13} /> {selMode ? "退出多选" : "多选"}
              </button>
              <button className="btn btn-primary" onClick={createHere}><Icon name="plus" size={14} /> 新建</button>
            </div>
          )}
        </div>

        {/* 工具栏 */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 pb-3.5">
          <div className="relative min-w-[180px] flex-1 sm:max-w-[280px]">
            <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input className="input !pl-9" data-search-input placeholder="搜索标题、正文、标签、变量…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button className={cx("chip chip-btn", typeF === "all" && "!border-[var(--brass-2)] !bg-[#f6eeda] font-medium text-[var(--ink)]")} onClick={() => setTypeF("all")}>{tt("全部", "All")}</button>
            {allTypes().map((t) => (
              <button key={t.id} className={cx("chip chip-btn", typeF === t.id && "!border-[var(--brass-2)] !bg-[#f6eeda] font-medium text-[var(--ink)]")} onClick={() => setTypeF(t.id)}>
                <Icon name={t.icon} size={11} /> {tl(t)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select className="select !w-auto !py-[6px] !text-[12px]" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="update">按更新</option>
              <option value="create">按创建</option>
              <option value="use">按使用次数</option>
              <option value="title">按标题</option>
            </select>
            <div className="flex overflow-hidden rounded-[9px] border" style={{ borderColor: "var(--line-2)" }}>
              {(["card", "compact"] as const).map((v) => (
                <button key={v} className={cx("px-2.5 py-[6px] text-[11.5px]", view === v ? "bg-[#eee2c6] font-medium" : "")}
                  style={{ color: "var(--ink-2)" }} onClick={() => setView(v)}>
                  {v === "card" ? "卡片" : "紧凑"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="card">
            {q ? (
              <EmptyState icon="search" title="没有找到相关内容" desc={`没有匹配「${q}」的提示词。可以换个关键词，或清除筛选条件。`}>
                <button className="btn" onClick={() => { setQ(""); setTypeF("all"); }}>清除搜索与筛选</button>
                {!isTrash && <button className="btn btn-primary" onClick={() => { createHere(); }}><Icon name="plus" size={13} /> 新建「{q}」相关提示词</button>}
              </EmptyState>
            ) : isTrash ? (
              <EmptyState icon="trash" title="回收站是空的" desc="删除的内容会先放在这里，30 天内都可以恢复。" />
            ) : (
              <EmptyState icon="inbox" title="这里还没有提示词" desc="试试新建一条，或从模板开始。好的提示词值得被认真收起来。">
                <button className="btn btn-primary" onClick={createHere}><Icon name="plus" size={13} /> 新建提示词</button>
              </EmptyState>
            )}
          </div>
        ) : view === "card" ? (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((p, i) => (
              <PromptCard key={p.id} p={p} q={q} idx={i} selMode={selMode} sel={sel.includes(p.id)} onSel={() => toggleSel(p.id)} isTrash={isTrash}
                onRestore={() => restore([p.id])}
                onPurge={() => purge([p.id])} />
            ))}
          </div>
        ) : (
          <div className="card divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
            {filtered.map((p) => (
              <CompactRow key={p.id} p={p} q={q} selMode={selMode} sel={sel.includes(p.id)} onSel={() => toggleSel(p.id)} isTrash={isTrash}
                onRestore={() => restore([p.id])} onPurge={() => purge([p.id])} />
            ))}
          </div>
        )}
      </div>

      {/* 批量操作条 */}
      {selMode && sel.length > 0 && (
        <div className="pop-in flex-none border-t px-6 py-3" style={{ borderColor: "var(--line-2)", background: "linear-gradient(180deg, #f6eeda, #efe5cd)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12.5px] font-medium">已选 {sel.length} 条</span>
            {!isTrash && (
              <>
                <button className="btn !py-[6px] !text-[12px]" onClick={() => setTagOpen(true)}><Icon name="tag" size={12} /> 打标签</button>
                <button className="btn !py-[6px] !text-[12px]" onClick={() => setMoveOpen(true)}><Icon name="move" size={12} /> 移动</button>
                <button className="btn !py-[6px] !text-[12px]" onClick={() => { set((s) => ({ ...s, prompts: s.prompts.map((p) => (sel.includes(p.id) ? { ...p, favorite: true } : p)) })); toast("ok", "已收藏所选"); }}><Icon name="star" size={12} /> 收藏</button>
                <button className="btn !py-[6px] !text-[12px]" onClick={() => helpers.exportPrompts(sel)}><Icon name="download" size={12} /> 导出</button>
                <button className="btn btn-danger !py-[6px] !text-[12px]" onClick={() => trash(sel)}><Icon name="trash" size={12} /> 删除</button>
              </>
            )}
            {isTrash && (
              <>
                <button className="btn !py-[6px] !text-[12px]" onClick={() => restore(sel)}><Icon name="undo" size={12} /> 批量恢复</button>
                <button className="btn btn-danger !py-[6px] !text-[12px]" onClick={() => purge(sel)}><Icon name="trash" size={12} /> 彻底删除</button>
              </>
            )}
            <button className="btn btn-ghost ml-auto !py-[6px] !text-[12px]" onClick={() => setSel(filtered.map((p) => p.id))}>全选</button>
          </div>
        </div>
      )}

      {/* 移动弹层 */}
      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title={`移动 ${sel.length} 条到…`} width={360}>
        <div className="space-y-1.5">
          {state.vaults.map((v) => (
            <button key={v.id} className="nav-item" onClick={() => {
              set((s) => ({ ...s, prompts: s.prompts.map((p) => (sel.includes(p.id) ? { ...p, vaultId: v.id, groupId: undefined } : p)) }));
              toast("ok", `已移动到「${v.name}」`); setMoveOpen(false); setSel([]);
            }}>
              <Icon name={v.icon} size={15} /> {v.name}
            </button>
          ))}
        </div>
      </Modal>

      {/* 打标签弹层 */}
      <Modal open={tagOpen} onClose={() => setTagOpen(false)} title="为所选内容打标签" width={360}>
        <div className="flex flex-wrap gap-2">
          {state.tags.map((t) => (
            <button key={t.id} className="chip chip-btn" onClick={() => {
              set((s) => ({ ...s, prompts: s.prompts.map((p) => (sel.includes(p.id) && !p.tagIds.includes(t.id) ? { ...p, tagIds: [...p.tagIds, t.id] } : p)) }));
              toast("ok", `已为 ${sel.length} 条加上「${t.name}」`); setTagOpen(false);
            }}>
              <span className="dot !h-[6px] !w-[6px]" style={{ background: t.color }} /> {t.name}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ================= 卡片 ================= */
function CardActions({ p, isTrash, onRestore, onPurge }: { p: Prompt; isTrash: boolean; onRestore: () => void; onPurge: () => void }) {
  const { toast, set, setFocus, select } = useStore();
  const [confirmPurge, setConfirmPurge] = useState(false);
  if (isTrash) {
    return (
      <>
        <button className="btn !py-[5px] !text-[11.5px]" onClick={onRestore}><Icon name="undo" size={12} /> 恢复</button>
        <button className="btn btn-danger !py-[5px] !text-[11.5px]" onClick={() => setConfirmPurge(true)}><Icon name="trash" size={12} /> 彻底删除</button>
        <Confirm open={confirmPurge} onClose={() => setConfirmPurge(false)} title="彻底删除" okText="彻底删除"
          desc={`「${p.title}」将被永久删除，包括其版本历史。此操作不可恢复。`} onOk={onPurge} />
      </>
    );
  }
  return (
    <>
      <button className="icon-btn" title="复制最终 Prompt" onClick={async (e) => {
        e.stopPropagation();
        const { copyText } = await import("./lib");
        if (await copyText(composePrompt(p, {}))) toast("ok", "已复制最终 Prompt");
      }}><Icon name="copy" size={13} /></button>
      <button className="icon-btn" title="进入调试" onClick={(e) => { e.stopPropagation(); select(p.id); setFocus(true); }}><Icon name="bolt" size={13} /></button>
      <FavBtn p={p} />
      <PinBtn p={p} />
      <button className="icon-btn hover:!text-[var(--err)]" title="移入回收站" onClick={(e) => {
        e.stopPropagation();
        set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, deletedAt: Date.now() } : x)) }));
        toast("ok", "已移入回收站，可撤销", {
          label: "撤销", fn: () => set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, deletedAt: null } : x)) })),
        });
      }}><Icon name="trash" size={13} /></button>
    </>
  );
}

export function FavBtn({ p }: { p: Prompt }) {
  const { set } = useStore();
  const [pop, setPop] = useState(false);
  return (
    <button className={cx("icon-btn", p.favorite && "!text-[var(--brass)]")} title={p.favorite ? "取消收藏" : "收藏"}
      onClick={(e) => {
        e.stopPropagation();
        if (!p.favorite) { setPop(true); setTimeout(() => setPop(false), 500); }
        set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, favorite: !x.favorite } : x)) }));
      }}>
      <svg width={14} height={14} viewBox="0 0 24 24" className={cx(pop && "star-pop")}
        fill={p.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
      </svg>
    </button>
  );
}

function PinBtn({ p }: { p: Prompt }) {
  const { set } = useStore();
  return (
    <button className={cx("icon-btn", p.pinned && "!text-[var(--seal)]")} title={p.pinned ? "取消置顶" : "置顶"}
      onClick={(e) => { e.stopPropagation(); set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, pinned: !x.pinned } : x)) })); }}>
      <Icon name="pin" size={13} />
    </button>
  );
}

function SyncMark({ p }: { p: Prompt }) {
  const color = p.sync === "synced" ? "var(--ok)" : p.sync === "pending" ? "var(--warn)" : "var(--ink-3)";
  const t = p.sync === "synced" ? "已同步" : p.sync === "pending" ? "待同步" : "仅本机";
  return <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--ink-3)" }} title={t}><span className="dot !h-[5px] !w-[5px]" style={{ background: color }} />{t}</span>;
}

export function PromptCard({ p, q, idx, selMode, sel, onSel, isTrash, onRestore, onPurge }:
  { p: Prompt; q: string; idx: number; selMode: boolean; sel: boolean; onSel: () => void; isTrash: boolean; onRestore: () => void; onPurge: () => void }) {
  const { state, select, selectedId, setFocus } = useStore();
  const vars = useMemo(() => extractVars(p), [p]);
  const tags = p.tagIds.map((id) => state.tags.find((t) => t.id === id)).filter((t): t is Tag => !!t);
  return (
    <Reveal delay={Math.min(idx, 8) * 45}>
      <div
        className={cx("card card-hover group relative cursor-pointer p-4", selectedId === p.id && !isTrash && "outline outline-2 outline-offset-2", sel && "outline outline-2 outline-offset-2")}
        style={{ outlineColor: sel || selectedId === p.id ? "var(--brass-2)" : undefined }}
        onClick={() => { if (selMode) onSel(); else { select(p.id); setFocus(false); } }}>
        {p.pinned && !isTrash && (
          <span className="absolute -top-[5px] right-4 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[#fdf6ea]"
            style={{ background: "linear-gradient(180deg, #c65247, #a63c32)", boxShadow: "0 2px 4px rgba(150,50,40,0.4)" }} title="已置顶">
            <Icon name="pin" size={9} sw={2.4} />
          </span>
        )}
        <div className="mb-2 flex items-center gap-2">
          {selMode && (
            <span className={cx("flex h-4.5 w-4.5 flex-none items-center justify-center rounded border", sel ? "border-[var(--brass)] bg-[var(--brass)] text-white" : "border-[var(--line-2)] bg-white")}
              style={{ width: 17, height: 17 }}>
              {sel && <Icon name="check" size={10} sw={3} />}
            </span>
          )}
          <TypeBadge type={p.type} size="sm" />
          <span className="ml-auto" />
          {!isTrash && <SyncMark p={p} />}
          {isTrash && <span className="text-[10px]" style={{ color: "var(--err)" }}>{timeAgo(p.deletedAt)}删除</span>}
        </div>
        <div className="title-serif mb-1 truncate text-[15px] font-bold">{hl(p.title, q)}</div>
        <p className="mb-3 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          {hl(p.summary || p.body.slice(0, 80) || tb(getTypeDef(p.type)), q)}
        </p>
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((t: any) => (
              <span key={t.id} className="chip !py-[1px] !text-[10px]"><span className="dot !h-[5px] !w-[5px]" style={{ background: t.color }} />{hl(t.name, q)}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-2.5 text-[10.5px] tabular-nums" style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
          <span>{timeAgo(p.updatedAt)} · 用过 {p.useCount} 次</span>
          <span className="flex items-center gap-2.5">
            {vars.length > 0 && <span className="flex items-center gap-1"><Icon name="sparkle" size={10} />{vars.length} 变量</span>}
            {p.versions.length > 0 && <span className="flex items-center gap-1"><Icon name="history" size={10} />{p.versions.length} 版本</span>}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-10 flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex rounded-lg border p-0.5" style={{ borderColor: "var(--line-2)", background: "rgba(252,248,238,0.92)", boxShadow: "var(--shadow-soft)" }}>
            <CardActions p={p} isTrash={isTrash} onRestore={onRestore} onPurge={onPurge} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function CompactRow({ p, q, selMode, sel, onSel, isTrash, onRestore, onPurge }:
  { p: Prompt; q: string; selMode: boolean; sel: boolean; onSel: () => void; isTrash: boolean; onRestore: () => void; onPurge: () => void }) {
  const { select, selectedId, setFocus } = useStore();
  return (
    <div className={cx("group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[rgba(84,64,34,0.045)]", selectedId === p.id && "bg-[rgba(194,160,85,0.1)]")}
      style={{ borderColor: "var(--line)" }}
      onClick={() => { if (selMode) onSel(); else { select(p.id); setFocus(false); } }}>
      {selMode && (
        <span className={cx("flex flex-none items-center justify-center rounded border", sel ? "border-[var(--brass)] bg-[var(--brass)] text-white" : "border-[var(--line-2)] bg-white")} style={{ width: 16, height: 16 }}>
          {sel && <Icon name="check" size={9} sw={3} />}
        </span>
      )}
      {p.pinned && !isTrash && <span className="flex-none" style={{ color: "var(--seal)" }}><Icon name="pin" size={11} /></span>}
      <TypeBadge type={p.type} text={false} size="sm" />
      <span className="min-w-0 flex-1 truncate text-[13px]">{hl(p.title, q)}</span>
      <span className="hidden truncate text-[11px] sm:block" style={{ color: "var(--ink-3)", maxWidth: 180 }}>{p.summary || p.body.slice(0, 30)}</span>
      <span className="flex-none text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{timeAgo(p.updatedAt)}</span>
      <span className="hidden flex-none text-[10.5px] tabular-nums md:block" style={{ color: "var(--ink-3)" }}>{p.useCount} 次</span>
      <div className="flex flex-none gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <CardActions p={p} isTrash={isTrash} onRestore={onRestore} onPurge={onPurge} />
      </div>
    </div>
  );
}

/* ================= 标签管理（设置页用） ================= */
export function TagManager() {
  const { state, set, toast } = useStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("var(--moss)");
  const used = (id: string) => state.prompts.filter((p) => p.tagIds.includes(id)).length;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {state.tags.map((t) => (
          <span key={t.id} className="chip group/tag relative pr-2">
            <span className="dot !h-[6px] !w-[6px]" style={{ background: t.color }} />
            {t.name}
            <span className="tabular-nums opacity-60">{used(t.id)}</span>
            <button className="ml-0.5 opacity-0 transition-opacity group-hover/tag:opacity-100 hover:text-[var(--err)]" title={used(t.id) > 0 ? `有 ${used(t.id)} 条在使用` : "删除标签"}
              onClick={() => {
                if (used(t.id) > 0) { toast("warn", `「${t.name}」仍有 ${used(t.id)} 条在使用，已跳过`); return; }
                set((s) => ({ ...s, tags: s.tags.filter((x) => x.id !== t.id) }));
                toast("info", `已清理未使用标签「${t.name}」`);
              }}>
              <Icon name="close" size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="input !w-[160px]" placeholder="新标签名" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        {["var(--moss)", "var(--slate)", "var(--clay)", "var(--plum)", "var(--sand)", "var(--seal)"].map((c) => (
          <button key={c} className="h-5.5 w-5.5 rounded-full border-2" style={{ background: c, width: 21, height: 21, borderColor: color === c ? "var(--ink)" : "transparent" }}
            onClick={() => setColor(c)} aria-label="颜色" />
        ))}
        <button className="btn !py-[7px] !text-[12px]" onClick={add}><Icon name="plus" size={12} /> 添加</button>
        {state.tags.filter((t) => used(t.id) === 0).length > 0 && (
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>{state.tags.filter((t) => used(t.id) === 0).length} 个未使用标签可清理</span>
        )}
      </div>
    </div>
  );

  function add() {
    if (!name.trim()) return;
    if (state.tags.some((t) => t.name === name.trim())) { toast("warn", "已有同名标签"); return; }
    set((s) => ({ ...s, tags: [...s.tags, { id: uid(), name: name.trim(), color }] }));
    setName("");
    toast("ok", `标签「${name.trim()}」已创建`);
  }
}

export { Toggle };
