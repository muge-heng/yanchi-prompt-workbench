/* ============================================================
 * 类型管理器 · 创建/编辑提示词类型（字段增删、开关、图标与图案选择）
 * Type Manager · create/edit prompt types (add/remove/toggle fields,
 * pick field icons and type icons/colors)
 * ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useStore, useHelpers } from "./store";
import { cx, uid, tt, tl, DEFAULT_TYPES, TAG_COLORS, type TypeDef, type FieldDef, type FieldKind } from "./lib";
import { Icon, Confirm, Toggle, Reveal, EmptyState } from "./ui";

/* 可选图标 choices for icon pickers */
const ICON_CHOICES = ["doc", "agent", "chat", "image", "video", "pen", "star", "spark", "bolt", "target", "mic", "ruler", "palette", "sun", "camera", "tool", "rules", "globe", "book", "link", "grid", "layers", "tag", "folder", "clock", "history", "play", "edit"];

const KIND_LABEL: Record<FieldKind, [string, string]> = {
  text: ["单行文本", "Single-line text"],
  area: ["多行文本", "Multi-line text"],
  chat: ["对话消息", "Chat messages"],
  shots: ["分镜列表", "Shot list"],
};

function clone(t: TypeDef): TypeDef {
  return JSON.parse(JSON.stringify(t));
}

export default function TypeManager() {
  const { state, toast } = useStore();
  const { saveType, deleteType, resetType, moveType } = useHelpers();
  const types = state.types;

  const [selId, setSelId] = useState<string | null>(types[0]?.id ?? null);
  const [draft, setDraft] = useState<TypeDef | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [iconFor, setIconFor] = useState<string | null>(null); // 正在选图标的目标：type 或 field:key

  /* 选中类型变化时重载草稿。Reload the draft when the selection changes. */
  useEffect(() => {
    const t = types.find((x) => x.id === selId);
    setDraft(t ? clone(t) : null);
    setDirty(false);
    setIconFor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId, types.length]);

  const usedCount = useMemo(
    () => (selId ? state.prompts.filter((p) => p.type === selId && !p.deletedAt).length : 0),
    [selId, state.prompts]
  );

  function patch(p: Partial<TypeDef>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
  }
  function patchField(key: string, p: Partial<FieldDef>) {
    setDraft((d) => (d ? { ...d, fields: d.fields.map((f) => (f.key === key ? { ...f, ...p } : f)) } : d));
    setDirty(true);
  }
  function removeField(key: string) {
    setDraft((d) => (d ? { ...d, fields: d.fields.filter((f) => f.key !== key) } : d));
    setDirty(true);
  }
  function moveField(key: string, dir: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const arr = [...d.fields];
      const i = arr.findIndex((f) => f.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, fields: arr };
    });
    setDirty(true);
  }
  function addField() {
    const key = "field" + uid().slice(0, 4);
    const f: FieldDef = { key, label: tt("新字段", "New field"), labelEn: "New field", kind: "area", icon: "doc" };
    setDraft((d) => (d ? { ...d, fields: [...d.fields, f] } : d));
    setDirty(true);
  }

  function createType() {
    const t: TypeDef = {
      id: "t" + uid().slice(0, 6),
      label: tt("新类型", "New type"), labelEn: "New type",
      icon: "spark", color: TAG_COLORS[types.length % TAG_COLORS.length],
      blurb: tt("自定义类型", "Custom type"), blurbEn: "Custom type",
      mode: "generic", fields: [], params: [],
    };
    saveType(t);
    setSelId(t.id);
    toast("ok", tt("已创建新类型，开始为它添加字段吧", "New type created — start adding fields"));
  }

  function save() {
    if (!draft) return;
    saveType(draft);
    setDirty(false);
    toast("ok", tt("类型已保存", "Type saved"));
  }

  const isBuiltin = !!draft?.builtin;

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[980px] px-7 pb-24 pt-8">
        <Reveal>
          <div className="engrave mb-1 text-[11px] tracking-[0.25em]">TYPE STUDIO</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="title-serif text-[26px] font-black">{tt("类型管理", "Type Studio")}</h1>
              <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
                {tt("预设类型不合手？在这里增删字段、切换开关、挑选图标，或从零创建自己的类型。", "Preset types not quite right? Add or remove fields, flip switches, pick icons, or build a type from scratch.")}
              </p>
            </div>
            <button className="btn btn-primary" onClick={createType}><Icon name="plus" size={14} /> {tt("新建类型", "New type")}</button>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[250px_1fr]">
          {/* 左侧类型列表 left list */}
          <Reveal delay={60}>
            <div className="space-y-1.5">
              {types.map((t, i) => (
                <button key={t.id} onClick={() => setSelId(t.id)}
                  className={cx("group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all", selId === t.id ? "translate-x-[2px]" : "hover:translate-x-[2px]")}
                  style={{
                    borderColor: selId === t.id ? "color-mix(in srgb, " + t.color + " 55%, var(--line))" : "var(--line)",
                    background: selId === t.id ? "var(--card)" : "color-mix(in srgb, var(--card) 60%, transparent)",
                    boxShadow: selId === t.id ? "var(--shadow-s)" : undefined,
                  }}>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg" style={{ color: t.color, background: "color-mix(in srgb, " + t.color + " 12%, var(--card))", boxShadow: "var(--inset)" }}>
                    <Icon name={t.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{tl(t)}</span>
                    <span className="block text-[10px]" style={{ color: "var(--ink-3)" }}>
                      {t.builtin ? tt("内置", "Built-in") : tt("自定义", "Custom")} · {t.fields.length} {tt("字段", "fields")}
                    </span>
                  </span>
                  <span className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="icon-btn !h-5 !w-5" onClick={(e) => { e.stopPropagation(); moveType(t.id, -1); }} disabled={i === 0} aria-label={tt("上移", "Move up")}><Icon name="expand" size={9} className="rotate-180" /></button>
                    <button className="icon-btn !h-5 !w-5" onClick={(e) => { e.stopPropagation(); moveType(t.id, 1); }} disabled={i === types.length - 1} aria-label={tt("下移", "Move down")}><Icon name="expand" size={9} /></button>
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          {/* 右侧编辑器 right editor */}
          {!draft ? (
            <div className="card"><EmptyState icon="type" title={tt("选择或创建一个类型", "Select or create a type")} desc={tt("类型决定一条提示词由哪些字段组成。", "A type decides which fields a prompt is made of.")} /></div>
          ) : (
            <Reveal delay={100} key={draft.id}>
              <div className="card space-y-5 p-5">
                {/* 基础信息 identity */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="title-serif text-[14px] font-bold">{tt("基础信息", "Identity")}</span>
                    {isBuiltin && <span className="chip !text-[10px]">{tt("内置类型 · 可调整字段，可一键还原", "Built-in · fields adjustable, one-click restore")}</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("名称（中文）", "Name (Chinese)")}</label>
                      <input className="input" value={draft.label} onChange={(e) => patch({ label: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("名称（英文）", "Name (English)")}</label>
                      <input className="input" value={draft.labelEn ?? ""} onChange={(e) => patch({ labelEn: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("简介（中文 / 英文）", "Blurb (Chinese / English)")}</label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input className="input" value={draft.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
                        <input className="input" value={draft.blurbEn ?? ""} onChange={(e) => patch({ blurbEn: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-5">
                    {/* 类型图标 type icon */}
                    <div>
                      <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("图案", "Icon")}</label>
                      <div className="relative">
                        <button className="flex h-11 w-11 items-center justify-center rounded-xl border transition-transform hover:scale-105"
                          style={{ color: draft.color, borderColor: "var(--line-2)", background: "color-mix(in srgb, " + draft.color + " 10%, var(--card))", boxShadow: "var(--shadow-s)" }}
                          onClick={() => setIconFor(iconFor === "type" ? null : "type")} aria-label={tt("选择图案", "Choose icon")}>
                          <Icon name={draft.icon} size={20} />
                        </button>
                        {iconFor === "type" && <IconGrid onPick={(n) => { patch({ icon: n }); setIconFor(null); }} />}
                      </div>
                    </div>
                    {/* 颜色 color */}
                    <div>
                      <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("点缀色", "Accent")}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {TAG_COLORS.map((c) => (
                          <button key={c} onClick={() => patch({ color: c })} aria-label={c}
                            className={cx("h-6 w-6 rounded-full border transition-transform hover:scale-110", draft.color === c && "ring-2 ring-offset-1")}
                            style={{ background: c, borderColor: "var(--card)", boxShadow: "var(--shadow-s)" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 字段 fields */}
                <div className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="title-serif text-[14px] font-bold">{tt("字段结构", "Field structure")}</span>
                    <button className="btn !py-[5px] !text-[11.5px]" onClick={addField}><Icon name="plus" size={12} /> {tt("添加字段", "Add field")}</button>
                  </div>
                  {draft.fields.length === 0 ? (
                    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-[12px]" style={{ borderColor: "var(--line-2)", color: "var(--ink-3)" }}>
                      {tt("还没有字段。添加几个，或选择「对话消息」「分镜列表」这样的结构化字段。", "No fields yet. Add a few, or use structured kinds like “Chat messages” or “Shot list”.")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {draft.fields.map((f, i) => (
                        <div key={f.key} className={cx("rounded-xl border p-2.5 transition-opacity", f.hidden && "opacity-55")}
                          style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* 开关 toggle */}
                            <Toggle on={!f.hidden} onChange={(b) => patchField(f.key, { hidden: !b })} label={tt("启用字段", "Enable field")} />
                            {/* 图标 icon */}
                            <div className="relative">
                              <button className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: "var(--line-2)", background: "var(--card)", color: "var(--ink-2)" }}
                                onClick={() => setIconFor(iconFor === f.key ? null : f.key)} aria-label={tt("字段图标", "Field icon")}>
                                <Icon name={f.icon || "doc"} size={14} />
                              </button>
                              {iconFor === f.key && <IconGrid onPick={(n) => { patchField(f.key, { icon: n }); setIconFor(null); }} />}
                            </div>
                            {/* 标签 labels */}
                            <input className="input !w-[120px] !py-[5px] !text-[12px]" value={f.label} onChange={(e) => patchField(f.key, { label: e.target.value })} placeholder={tt("中文名", "Chinese")} />
                            <input className="input !w-[120px] !py-[5px] !text-[12px]" value={f.labelEn ?? ""} onChange={(e) => patchField(f.key, { labelEn: e.target.value })} placeholder="English" />
                            {/* 类型 kind */}
                            <select className="select !w-auto !py-[5px] !text-[11.5px]" value={f.kind} onChange={(e) => patchField(f.key, { kind: e.target.value as FieldKind })}>
                              {(Object.keys(KIND_LABEL) as FieldKind[]).map((k) => (
                                <option key={k} value={k}>{tt(KIND_LABEL[k][0], KIND_LABEL[k][1])}</option>
                              ))}
                            </select>
                            <span className="ml-auto flex items-center gap-0.5">
                              <button className="icon-btn !h-6 !w-6" disabled={i === 0} onClick={() => moveField(f.key, -1)} aria-label={tt("上移", "Move up")}><Icon name="expand" size={10} className="rotate-180" /></button>
                              <button className="icon-btn !h-6 !w-6" disabled={i === draft.fields.length - 1} onClick={() => moveField(f.key, 1)} aria-label={tt("下移", "Move down")}><Icon name="expand" size={10} /></button>
                              <button className="icon-btn !h-6 !w-6" style={{ color: "var(--err)" }} onClick={() => removeField(f.key)} aria-label={tt("删除字段", "Remove field")}><Icon name="trash" size={12} /></button>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 底部操作 footer actions */}
                <div className="flex flex-wrap items-center gap-2.5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                  <button className="btn btn-primary" onClick={save} disabled={!dirty}><Icon name="check" size={13} /> {dirty ? tt("保存类型", "Save type") : tt("已保存", "Saved")}</button>
                  {isBuiltin && (
                    <button className="btn" onClick={() => { resetType(draft.id); setSelId(draft.id); toast("info", tt("已还原为默认结构", "Restored to default structure")); }}>
                      <Icon name="undo" size={13} /> {tt("还原默认", "Restore default")}
                    </button>
                  )}
                  <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                    {usedCount > 0 ? tt(`有 ${usedCount} 条提示词正在使用此类型`, `${usedCount} prompts use this type`) : tt("暂无提示词使用此类型", "No prompts use this type yet")}
                  </span>
                  <button className="btn btn-danger" onClick={() => setConfirmDel(true)}><Icon name="trash" size={13} /> {tt("删除类型", "Delete type")}</button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>

      <Confirm open={confirmDel} onClose={() => setConfirmDel(false)} title={tt("删除这个类型？", "Delete this type?")}
        desc={draft ? (usedCount > 0
          ? tt(`「${tl(draft)}」下还有 ${usedCount} 条提示词。删除后它们会回落到通用自定义类型，内容不会丢失。`, `“${tl(draft)}” still has ${usedCount} prompts. After deletion they fall back to the generic Custom type — no content is lost.`)
          : tt("删除后无法恢复，确定继续吗？", "This cannot be undone. Continue?")) : ""}
        okText={tt("删除", "Delete")} onOk={() => {
          if (!draft) return;
          deleteType(draft.id);
          setSelId(types.find((t) => t.id !== draft.id)?.id ?? null);
          toast("ok", tt("类型已删除", "Type deleted"));
        }} />
    </div>
  );
}

/* 图标选择小格 icon picker grid */
function IconGrid({ onPick }: { onPick: (name: string) => void }) {
  return (
    <div className="pop-in absolute left-0 top-full z-30 mt-1.5 grid w-[228px] grid-cols-7 gap-1 rounded-xl border p-2"
      style={{ borderColor: "var(--line-2)", background: "var(--card)", boxShadow: "var(--shadow-lift)" }}>
      {ICON_CHOICES.map((n) => (
        <button key={n} className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--card-2)]"
          style={{ color: "var(--ink-2)" }} onClick={() => onPick(n)} aria-label={n}>
          <Icon name={n} size={15} />
        </button>
      ))}
    </div>
  );
}
