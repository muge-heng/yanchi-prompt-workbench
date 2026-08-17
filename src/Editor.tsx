import { useEffect, useRef, useState } from "react";
import { useStore, useHelpers, versionOf, type SmartView } from "./store";
import { cx, fmtDate, uid, TYPE_META, TYPE_ORDER, type Prompt, type PromptType, type ChatMsg, type Shot, type Role } from "./lib";
import { Icon, TypeBadge, Confirm, Toggle } from "./ui";
import Workbench from "./Workbench";

type Tab = "edit" | "bench" | "versions";

export default function Editor({ p }: { p: Prompt }) {
  const { state, set, patchPrompt, toast, select, focus, setFocus } = useStore();
  const helpers = useHelpers();
  const [tab, setTab] = useState<Tab>("edit");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [tagInput, setTagInput] = useState(false);
  const [tagName, setTagName] = useState("");
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [verLabel, setVerLabel] = useState("");
  const saveT = useRef<any>(null);
  const firstId = useRef(p.id);

  useEffect(() => { if (firstId.current !== p.id) { firstId.current = p.id; setTab("edit"); } }, [p.id]);

  function up(patch: Partial<Prompt>) {
    patchPrompt(p.id, patch);
    setSaved("saving");
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => setSaved("saved"), 650);
  }

  const meta = TYPE_META[p.type];
  const vault = state.vaults.find((v) => v.id === p.vaultId);
  const groups = state.groups.filter((g) => g.vaultId === p.vaultId);
  const bodyLabel = p.type === "agent" ? "System Prompt · 主体指令" : p.type === "chat" ? "补充说明（可选）" : p.type === "image" ? "补充描述（拼接到画面之后）" : p.type === "video" ? "补充描述（可选）" : "正文 · Prompt 内容";

  const setField = (key: string, val: any) => up({ fields: { ...p.fields, [key]: val } });

  return (
    <div className="slide-in flex h-full min-w-0 flex-col" style={{ background: "var(--card)" }}>
      {/* 头部 */}
      <div className="flex-none border-b px-5 pb-0 pt-4" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2">
          <button className="icon-btn lg:hidden" onClick={() => select(null)} title="返回列表"><Icon name="chevL" size={16} /></button>
          <TypeBadge type={p.type} />
          <div className="ml-auto flex items-center gap-2">
            <span className={cx("flex items-center gap-1.5 text-[11px] transition-opacity duration-500", (saved === "idle" || !state.settings.saveFlash) && "opacity-0")}
              style={{ color: saved === "saved" ? "var(--ok)" : "var(--ink-3)" }}>
              {saved === "saving" ? <><Icon name="clock" size={11} /> 正在保存…</> : <><Icon name="check" size={11} className="check-draw" /> 已保存到本机</>}
            </span>
            <button className={cx("icon-btn", focus && "!bg-[#f0e6cd] !text-[var(--ink)]")} title="专注模式（⌘\）" onClick={() => setFocus(!focus)}><Icon name="eye" size={15} /></button>
            <button className="icon-btn" title="导出这条" onClick={() => helpers.exportPrompts([p.id])}><Icon name="download" size={14} /></button>
            <button className="icon-btn hover:!text-[var(--err)]" title="移入回收站" onClick={() => setConfirmTrash(true)}><Icon name="trash" size={14} /></button>
          </div>
        </div>
        <input
          className="title-serif mt-2 w-full border-none bg-transparent text-[21px] font-black outline-none placeholder:opacity-40"
          style={{ color: "var(--ink)" }}
          value={p.title} placeholder="为它起个名字"
          onChange={(e) => up({ title: e.target.value })}
        />
        <input
          className="mt-1 w-full border-none bg-transparent text-[12px] outline-none placeholder:opacity-50"
          style={{ color: "var(--ink-2)" }}
          value={p.summary} placeholder="一句话简介：它解决什么问题？"
          onChange={(e) => up({ summary: e.target.value })}
        />

        {/* 元信息行 */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <label className="flex items-center gap-1.5" style={{ color: "var(--ink-2)" }}>
            <Icon name="grid" size={12} className="opacity-60" />
            <select className="select !w-auto !border-0 !bg-transparent !p-0 !text-[12px] !shadow-none" value={p.vaultId}
              onChange={(e) => up({ vaultId: e.target.value, groupId: undefined })}>
              {state.vaults.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <span style={{ color: "var(--line-2)" }}>›</span>
          <select className="select !w-auto !border-0 !bg-transparent !p-0 !text-[12px] !shadow-none" style={{ color: p.groupId ? "var(--ink)" : "var(--ink-3)" }}
            value={p.groupId || ""} onChange={(e) => up({ groupId: e.target.value || undefined })}>
            <option value="">未分组</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {p.tagIds.map((tid) => {
              const t = state.tags.find((x) => x.id === tid);
              return t ? (
                <button key={tid} className="chip chip-btn !py-[1.5px] group/tg" title="点击移除"
                  onClick={() => up({ tagIds: p.tagIds.filter((x) => x !== tid) })}>
                  <span className="dot !h-[5px] !w-[5px]" style={{ background: t.color }} />{t.name}
                  <Icon name="close" size={8} className="opacity-0 group-hover/tg:opacity-70" />
                </button>
              ) : null;
            })}
            {tagInput ? (
              <input className="input !w-[90px] !py-[2px] !text-[11px]" autoFocus placeholder="回车添加" value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onBlur={() => { addTag(); setTagInput(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { addTag(); setTagInput(false); } if (e.key === "Escape") setTagInput(false); }} />
            ) : (
              <button className="chip chip-btn !py-[1.5px] !text-[10.5px]" onClick={() => setTagInput(true)}><Icon name="plus" size={9} /> 标签</button>
            )}
          </div>
        </div>

        {/* 类型切换 */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>类型</span>
          {TYPE_ORDER.map((t) => (
            <button key={t} className={cx("chip chip-btn !py-[2px]", p.type === t && "font-bold")}
              style={p.type === t ? { borderColor: TYPE_META[t].color, color: TYPE_META[t].color, background: "color-mix(in srgb, " + TYPE_META[t].color + " 10%, var(--card))" } : undefined}
              onClick={() => { if (t !== p.type) { up({ type: t }); toast("info", `已切换为 ${TYPE_META[t].label} 类型，字段结构随之变化`); } }}>
              <Icon name={TYPE_META[t].icon} size={11} /> {TYPE_META[t].label}
            </button>
          ))}
          <button className="chip chip-btn ml-auto !py-[2px] !text-[10.5px]" title="另存为副本" onClick={() => duplicate()}>
            <Icon name="copy" size={10} /> 另存为副本
          </button>
        </div>

        {/* 页签 */}
        <div className="mt-3 flex items-end gap-1 px-1">
          {([["edit", "编辑", "pen"], ["bench", "工作台", "bolt"], ["versions", `历史 ${p.versions.length || ""}`, "history"]] as [Tab, string, string][]).map(([k, label, ic]) => (
            <button key={k} className={cx("folder-tab flex items-center gap-1.5", tab === k && "on")} onClick={() => setTab(k)}>
              <Icon name={ic} size={12.5} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容 */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto border-t" style={{ borderColor: "var(--line)" }}>
        {tab === "bench" ? (
          <Workbench p={p} />
        ) : tab === "versions" ? (
          <div className="p-5">
            <div className="card mb-4 p-4">
              <div className="mb-2 text-[12.5px] font-medium">把当前状态存为一个版本</div>
              <div className="flex gap-2">
                <input className="input" placeholder="版本备注，如：v3 · 加入工具规则" value={verLabel} onChange={(e) => setVerLabel(e.target.value)} />
                <button className="btn btn-primary flex-none" onClick={() => {
                  const v = versionOf(p, verLabel.trim() || undefined);
                  up({ versions: [v, ...p.versions] });
                  setVerLabel("");
                  toast("ok", `已存为「${v.label}」`);
                }}><Icon name="history" size={13} /> 存档</button>
              </div>
            </div>
            {p.versions.length === 0 ? (
              <div className="py-10 text-center text-[12.5px]" style={{ color: "var(--ink-3)" }}>
                还没有版本。调试顺手时存一个版本，日后可以安心回滚。
              </div>
            ) : (
              <div className="space-y-2.5">
                {p.versions.map((v, i) => (
                  <div key={v.id} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border text-[11px] font-bold tabular-nums"
                        style={{ borderColor: "var(--line-2)", background: "var(--card-2)", color: "var(--brass)" }}>{p.versions.length - i}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{v.label}</div>
                        <div className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{fmtDate(v.at)} · 正文 {v.body.length} 字 · 字段 {Object.values(v.fields).filter((x) => x && (typeof x === "string" ? x.trim() : Array.isArray(x) ? x.length : false)).length} 项</div>
                      </div>
                      <button className="btn !py-[5px] !text-[11.5px]" onClick={() => {
                        up({ body: v.body, fields: JSON.parse(JSON.stringify(v.fields)), negative: v.negative });
                        toast("ok", `已回滚到「${v.label}」，当前内容已被替换`);
                      }}><Icon name="undo" size={12} /> 回滚</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-5">
            {/* 正文 */}
            <FieldCard title={bodyLabel} icon="doc" defaultOpen>
              <textarea className="textarea mono-area min-h-[150px]" value={p.body} placeholder={p.type === "custom" ? "直接写你的 Prompt，支持 {{变量}} 占位…" : "主体内容…"}
                onChange={(e) => up({ body: e.target.value })} />
            </FieldCard>

            {/* 类型字段 */}
            {meta.fields.map((f) => (
              <FieldCard key={f.key} title={f.label} icon={f.kind === "chat" ? "chat" : f.kind === "shots" ? "video" : "pen"}
                hint={f.hint} defaultOpen={["role", "subject", "goal", "system", "firstFrame", "theme"].includes(f.key)}>
                {f.kind === "text" && (
                  <div>
                    <input className="input" value={p.fields[f.key] || ""} placeholder={f.hint || ""} onChange={(e) => setField(f.key, e.target.value)} />
                    {f.quick && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.quick.map((qk) => (
                          <button key={qk} className="chip chip-btn !py-[1.5px] !text-[10.5px]"
                            onClick={() => {
                              const cur = (p.fields[f.key] || "").toString();
                              setField(f.key, cur ? (cur.includes(qk) ? cur : cur + "，" + qk) : qk);
                            }}>
                            <Icon name="plus" size={9} /> {qk}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {f.kind === "area" && (
                  <textarea className="textarea" value={p.fields[f.key] || ""} placeholder={f.hint || ""} onChange={(e) => setField(f.key, e.target.value)} />
                )}
                {f.kind === "chat" && <ChatEditor msgs={p.fields[f.key] || []} onChange={(v) => setField(f.key, v)} />}
                {f.kind === "shots" && <ShotsEditor shots={p.fields[f.key] || []} onChange={(v) => setField(f.key, v)} />}
              </FieldCard>
            ))}

            {/* Negative */}
            {p.type === "image" && (
              <FieldCard title="Negative Prompt" icon="close" hint="不希望出现的元素" defaultOpen>
                <textarea className="textarea" value={p.negative} placeholder="低质量，变形，多余手指…" onChange={(e) => up({ negative: e.target.value })} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["低质量", "变形", "多余手指", "水印", "过曝", "塑料感", "杂乱背景"].map((qk) => (
                    <button key={qk} className="chip chip-btn !py-[1.5px] !text-[10.5px]" onClick={() => {
                      up({ negative: p.negative ? (p.negative.includes(qk) ? p.negative : p.negative + "，" + qk) : qk });
                    }}><Icon name="plus" size={9} /> {qk}</button>
                  ))}
                </div>
              </FieldCard>
            )}

            {/* 参数 */}
            <FieldCard title="参数" icon="settings" defaultOpen={p.type !== "custom"}>
              <div className="grid grid-cols-2 gap-3">
                {meta.params.map((pm) => (
                  <div key={pm.key}>
                    <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{pm.label}</label>
                    <input className="input !py-[6px] !text-[12px]" placeholder={pm.ph || ""} value={p.params[pm.key] || ""}
                      onChange={(e) => up({ params: { ...p.params, [pm.key]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </FieldCard>

            {/* 同步与状态 */}
            <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-4 text-[12px]" style={{ color: "var(--ink-2)" }}>
              <label className="flex items-center gap-2">
                <Toggle on={p.sync !== "local"} onChange={(b) => { up({ sync: b ? "pending" : "local" }); toast("info", b ? "已加入同步范围" : "已移出同步范围，仅保存在本机"); }} label="同步" />
                纳入局域网同步范围
              </label>
              <span className="tabular-nums">创建 {fmtDate(p.createdAt)}</span>
              <span className="tabular-nums">更新 {fmtDate(p.updatedAt)}</span>
              <span className="tabular-nums">最近调试 {p.lastDebugAt ? fmtDate(p.lastDebugAt) : "—"}</span>
              <span className="tabular-nums">用过 {p.useCount} 次</span>
            </div>
          </div>
        )}
      </div>

      <Confirm open={confirmTrash} onClose={() => setConfirmTrash(false)} title="移入回收站" okText="移入回收站" danger={false}
        desc={`「${p.title}」将移入回收站，30 天内可随时恢复。`}
        onOk={() => {
          set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, deletedAt: Date.now() } : x)) }));
          select(null); setFocus(false);
          toast("ok", "已移入回收站", {
            label: "撤销", fn: () => set((s) => ({ ...s, prompts: s.prompts.map((x) => (x.id === p.id ? { ...x, deletedAt: null } : x)) })),
          });
        }} />
    </div>
  );

  function addTag() {
    const n = tagName.trim();
    if (!n) return;
    const exist = state.tags.find((t) => t.name === n);
    if (exist) {
      if (!p.tagIds.includes(exist.id)) up({ tagIds: [...p.tagIds, exist.id] });
    } else {
      const t = { id: uid(), name: n, color: "var(--moss)" };
      set((s) => ({ ...s, tags: [...s.tags, t] }));
      up({ tagIds: [...p.tagIds, t.id] });
      toast("ok", `已创建标签「${n}」`);
    }
    setTagName("");
  }

  function duplicate() {
    const copy: Prompt = {
      ...JSON.parse(JSON.stringify(p)), id: uid(), title: p.title + "（副本）",
      createdAt: Date.now(), updatedAt: Date.now(), useCount: 0, runs: [], sync: "local", favorite: false,
    };
    set((s) => ({ ...s, prompts: [copy, ...s.prompts] }));
    toast("ok", "已另存为副本");
  }
}

/* ---------- 字段卡片（可折叠） ---------- */
export function FieldCard({ title, icon, hint, defaultOpen = false, children }:
  { title: string; icon?: string; hint?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-center gap-2.5 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)}>
        {icon && <span className="flex-none opacity-55"><Icon name={icon} size={14} /></span>}
        <span className="title-serif text-[13.5px] font-bold">{title}</span>
        {hint && <span className="truncate text-[11px]" style={{ color: "var(--ink-3)" }}>{hint}</span>}
        <span className={cx("ml-auto flex-none transition-transform duration-300", open && "rotate-180")} style={{ color: "var(--ink-3)" }}>
          <Icon name="chevD" size={13} />
        </span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t px-4 py-3.5" style={{ borderColor: "var(--line)" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 对话消息编辑器 ---------- */
export function ChatEditor({ msgs, onChange }: { msgs: ChatMsg[]; onChange: (v: ChatMsg[]) => void }) {
  const roles: Role[] = ["user", "assistant", "system"];
  const roleText: Record<Role, string> = { user: "用户", assistant: "助手", system: "系统" };
  const roleColor: Record<Role, string> = { user: "var(--slate)", assistant: "var(--moss)", system: "var(--sand)" };
  return (
    <div className="space-y-2.5">
      {msgs.map((m, i) => (
        <div key={m.id} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)", background: m.role === "assistant" ? "color-mix(in srgb, var(--moss) 5%, var(--card))" : m.role === "system" ? "color-mix(in srgb, var(--sand) 6%, var(--card))" : "var(--card-2)" }}>
          <div className="mb-1.5 flex items-center gap-1">
            <div className="flex overflow-hidden rounded-md border" style={{ borderColor: "var(--line-2)" }}>
              {roles.map((r) => (
                <button key={r} className="px-2 py-[2.5px] text-[10.5px] transition-colors"
                  style={m.role === r ? { background: roleColor[r], color: "#fdf9ef" } : { color: "var(--ink-2)" }}
                  onClick={() => onChange(msgs.map((x) => (x.id === m.id ? { ...x, role: r } : x)))}>
                  {roleText[r]}
                </button>
              ))}
            </div>
            <span className="ml-auto flex gap-0.5">
              <button className="icon-btn !h-6 !w-6" disabled={i === 0} onClick={() => onChange(move(msgs, i, -1))} title="上移"><Icon name="chevD" size={11} className="rotate-180" /></button>
              <button className="icon-btn !h-6 !w-6" disabled={i === msgs.length - 1} onClick={() => onChange(move(msgs, i, 1))} title="下移"><Icon name="chevD" size={11} /></button>
              <button className="icon-btn !h-6 !w-6 hover:!text-[var(--err)]" onClick={() => onChange(msgs.filter((x) => x.id !== m.id))} title="删除"><Icon name="close" size={11} /></button>
            </span>
          </div>
          <textarea className="textarea !min-h-[52px] !border-0 !bg-transparent !p-1 !shadow-none" value={m.content} placeholder="消息内容，支持 {{变量}}"
            onChange={(e) => onChange(msgs.map((x) => (x.id === m.id ? { ...x, content: e.target.value } : x)))} />
        </div>
      ))}
      <button className="btn w-full !py-[7px] !text-[12px]" onClick={() => onChange([...msgs, { id: uid(), role: msgs.length % 2 === 0 ? "user" : "assistant", content: "" }])}>
        <Icon name="plus" size={12} /> 添加一条消息
      </button>
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

/* ---------- 分镜编辑器 ---------- */
function ShotsEditor({ shots, onChange }: { shots: Shot[]; onChange: (v: Shot[]) => void }) {
  return (
    <div className="space-y-2.5">
      {shots.map((s, i) => (
        <div key={s.id} className="rounded-xl border p-2.5" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="title-serif flex h-6 w-6 flex-none items-center justify-center rounded-md text-[11px] font-black text-[#fdf6ea]" style={{ background: "var(--plum)" }}>{i + 1}</span>
            <input className="input !w-[110px] !py-[4px] !text-[11.5px]" placeholder="镜头名" value={s.label} onChange={(e) => onChange(shots.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} />
            <input className="input !w-[70px] !py-[4px] !text-[11.5px]" placeholder="时长" value={s.secs} onChange={(e) => onChange(shots.map((x) => (x.id === s.id ? { ...x, secs: e.target.value } : x)))} />
            <span className="ml-auto flex gap-0.5">
              <button className="icon-btn !h-6 !w-6" disabled={i === 0} onClick={() => onChange(move(shots, i, -1))} title="上移"><Icon name="chevD" size={11} className="rotate-180" /></button>
              <button className="icon-btn !h-6 !w-6" disabled={i === shots.length - 1} onClick={() => onChange(move(shots, i, 1))} title="下移"><Icon name="chevD" size={11} /></button>
              <button className="icon-btn !h-6 !w-6 hover:!text-[var(--err)]" onClick={() => onChange(shots.filter((x) => x.id !== s.id))} title="删除"><Icon name="close" size={11} /></button>
            </span>
          </div>
          <textarea className="textarea !min-h-[44px] !border-0 !bg-transparent !p-1 !shadow-none" placeholder="这个镜头的画面与动作…" value={s.content}
            onChange={(e) => onChange(shots.map((x) => (x.id === s.id ? { ...x, content: e.target.value } : x)))} />
        </div>
      ))}
      <button className="btn w-full !py-[7px] !text-[12px]" onClick={() => onChange([...shots, { id: uid(), label: "", content: "", secs: "3s" }])}>
        <Icon name="plus" size={12} /> 添加分镜
      </button>
    </div>
  );
}

export type { SmartView };
