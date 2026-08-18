import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, versionOf, runOf } from "./store";
import { cx, uid, tt, extractVars, composePrompt, imageFormats, videoFormats, paramSummary, fmtClock, type Prompt } from "./lib";
import { Icon, CopyBtn } from "./ui";

export default function Workbench({ p }: { p: Prompt }) {
  const { patchPrompt, toast, syncApi, syncStatus, state } = useStore();
  const vars = useMemo(() => extractVars(p), [p]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [presetName, setPresetName] = useState("");
  const [fmtIdx, setFmtIdx] = useState(0);
  const [extLoading, setExtLoading] = useState(false);
  const [extResult, setExtResult] = useState("");
  const [openRun, setOpenRun] = useState<string | null>(null);
  const firstId = useRef(p.id);

  useEffect(() => {
    if (firstId.current !== p.id || Object.keys(values).length === 0) {
      firstId.current = p.id;
      setValues(p.presets[0]?.values || {});
      setFmtIdx(0);
      setExtResult("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  const final = useMemo(() => composePrompt(p, values), [p, values]);
  const fmts = useMemo(() => {
    if (p.type === "image") return imageFormats(p, values);
    if (p.type === "video") return videoFormats(p, values);
    return [{ name: tt("最终 Prompt", "Final prompt"), text: final }];
  }, [p, values, final]);

  const unfilled = vars.filter((v) => !values[v]);

  function recordRun(copied = false, sent = false) {
    const run = runOf(final, values, "");
    run.copied = copied; run.sent = sent;
    patchPrompt(p.id, {
      runs: [run, ...p.runs].slice(0, 30),
      useCount: p.useCount + 1,
      lastUsedAt: Date.now(),
      lastDebugAt: Date.now(),
    });
    return run;
  }

  function trialRun() {
    recordRun();
    toast("ok", tt("已试运行并记入调试历史", "Trial run logged to debug history"));
  }

  async function callExternal() {
    const s = state.settings;
    setExtLoading(true); setExtResult("");
    try {
      const url = s.apiUrl.includes("chat/completions") ? s.apiUrl : s.apiUrl.replace(/\/$/, "") + "/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey}` },
        body: JSON.stringify({ model: s.apiModel || undefined, messages: [{ role: "user", content: final }] }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || JSON.stringify(data).slice(0, 400);
      setExtResult(text);
      toast("ok", tt("外部模型已返回结果", "External model returned a result"));
    } catch (e: any) {
      setExtResult("");
      toast("err", `${tt("外部模型调用失败", "External model call failed")}: ${e?.message || tt("网络或服务不可达", "network or service unreachable")}`);
    } finally {
      setExtLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[218px_1fr]">
        {/* 变量面板 */}
        <div className="space-y-3">
          <div className="card p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="title-serif text-[12.5px] font-bold">{tt("变量", "Variables")}</span>
              <span className="text-[10.5px] tabular-nums" style={{ color: unfilled.length ? "var(--warn)" : "var(--ok)" }}>
                {vars.length === 0 ? tt("无变量", "No variables") : unfilled.length ? `${unfilled.length} ${tt("个未填", "unfilled")}` : tt("已全部填写", "All filled")}
              </span>
            </div>
            {vars.length === 0 ? (
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
                {tt("在正文中写 {{变量名}} 即可自动识别，例如 {{产品名}}、{{风格}}。", "Write {{name}} in the body and it is auto-detected, e.g. {{product}}, {{style}}.")}
              </p>
            ) : (
              <div className="space-y-2.5">
                {vars.map((v) => (
                  <div key={v}>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-medium" style={{ color: values[v] ? "var(--ok)" : "var(--ink-2)" }}>
                      <span className="font-mono text-[10px]" style={{ color: "var(--brass)" }}>{"{{"}</span>{v}<span className="font-mono text-[10px]" style={{ color: "var(--brass)" }}>{"}}"}</span>
                      {values[v] && <Icon name="check" size={9} />}
                    </label>
                    <input className="input !py-[6px] !text-[12px]" placeholder={`${tt("填写", "Fill")} ${v}`} value={values[v] || ""}
                      onChange={(e) => setValues((o) => ({ ...o, [v]: e.target.value }))} />
                  </div>
                ))}
                <button className="btn btn-ghost w-full !py-[5px] !text-[11px]" onClick={() => setValues({})}>{tt("清空填写", "Clear values")}</button>
              </div>
            )}
          </div>

          {/* 预设 */}
          <div className="card p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Icon name="layers" size={13} className="opacity-60" />
              <span className="title-serif text-[12.5px] font-bold">{tt("变量预设", "Variable presets")}</span>
            </div>
            {p.presets.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {p.presets.map((ps) => (
                  <button key={ps.id} className="chip chip-btn !py-[2px] !text-[10.5px] group/ps" onClick={() => { setValues({ ...ps.values }); toast("info", `${tt("已套用预设", "Applied preset")}「${ps.name}」`); }}>
                    {ps.name}
                    <span className="opacity-0 group-hover/ps:opacity-70" onClick={(e) => {
                      e.stopPropagation();
                      patchPrompt(p.id, { presets: p.presets.filter((x) => x.id !== ps.id) });
                    }}><Icon name="close" size={8} /></span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input className="input !py-[5px] !text-[11.5px]" placeholder={tt("预设名，如「美妆向」", "Preset name, e.g. “beauty tone”")} value={presetName} onChange={(e) => setPresetName(e.target.value)} />
              <button className="btn flex-none !px-2.5 !py-[5px]" title={tt("把当前填写存为预设", "Save current values as a preset")} onClick={() => {
                if (!presetName.trim()) { toast("warn", tt("先给预设起个名字", "Give the preset a name first")); return; }
                if (Object.values(values).every((x) => !x)) { toast("warn", tt("先填写至少一个变量", "Fill in at least one variable first")); return; }
                patchPrompt(p.id, { presets: [...p.presets, { id: uid(), name: presetName.trim(), values: { ...values } }] });
                setPresetName("");
                toast("ok", tt("预设已保存", "Preset saved"));
              }}><Icon name="plus" size={12} /></button>
            </div>
          </div>
        </div>

        {/* 预览面板 */}
        <div className="min-w-0 space-y-3">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b px-3.5 py-2.5" style={{ borderColor: "var(--line)" }}>
              <span className="title-serif text-[12.5px] font-bold">{tt("实时预览", "Live preview")}</span>
              {fmts.length > 1 && (
                <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--line-2)" }}>
                  {fmts.map((f, i) => (
                    <button key={f.name} className="px-2.5 py-[4px] text-[11px] transition-colors"
                      style={fmtIdx === i ? { background: "#eee2c6", fontWeight: 600 } : { color: "var(--ink-2)" }}
                      onClick={() => setFmtIdx(i)}>{f.name}</button>
                  ))}
                </div>
              )}
              <span className="ml-auto text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                {fmts[fmtIdx].text.length} {tt("字符", "chars")}{paramSummary(p) && ` · ${paramSummary(p)}`}
              </span>
            </div>
            <div className="mono-area max-h-[300px] min-h-[140px] overflow-auto whitespace-pre-wrap px-4 py-3.5 text-[12px] leading-[1.85]"
              style={{ color: "var(--ink)", background: "linear-gradient(180deg, #fdfaf1, #faf5e7)" }}>
              {fmts[fmtIdx].text || <span style={{ color: "var(--ink-3)" }}>{tt("（空）——先填写正文或字段", "(empty) — fill in the body or fields first")}</span>}
            </div>
            {p.type === "image" && p.negative.trim() && (
              <div className="border-t px-4 py-2.5 text-[11.5px]" style={{ borderColor: "var(--line)", color: "var(--err)" }}>
                <span className="font-medium">Negative：</span>{p.negative}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t px-3.5 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <CopyBtn size="sm" label={`${tt("复制", "Copy")} ${fmts.length > 1 ? fmts[fmtIdx].name : tt("最终 Prompt", "final prompt")}`} text={fmts[fmtIdx].text}
                onCopied={() => { patchPrompt(p.id, { useCount: p.useCount + 1, lastUsedAt: Date.now(), runs: p.runs.map((r, i) => (i === 0 ? { ...r, copied: true } : r)) }); }} />
              <button className="btn !py-[6px] !text-[12px]" onClick={trialRun}><Icon name="bolt" size={12} /> {tt("试运行", "Trial run")}</button>
              <button className="btn !py-[6px] !text-[12px]" onClick={() => {
                const v = versionOf(p, `v${p.versions.length + 1} · ${tt("工作台存档", "workbench save")}`);
                patchPrompt(p.id, { versions: [v, ...p.versions] });
                toast("ok", tt(`已存为「${v.label}」`, `Saved as “${v.label}”`));
              }}><Icon name="history" size={12} /> {tt("存版本", "Save version")}</button>
              <button className="btn !py-[6px] !text-[12px]" onClick={() => {
                syncApi.pushPrompts([p.id]);
                patchPrompt(p.id, { runs: p.runs.map((r, i) => (i === 0 ? { ...r, sent: true } : r)) });
              }}>
                <Icon name="send" size={12} /> {syncStatus === "online" ? tt("发送到设备", "Send to devices") : tt("加入同步队列", "Queue for sync")}
              </button>
            </div>
          </div>

          {/* 外部模型（可选） */}
          {(state.settings.apiUrl || state.settings.apiKey) && (
            <div className="card p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Icon name="link" size={13} className="opacity-60" />
                <span className="title-serif text-[12.5px] font-bold">{tt("外部模型调试", "External model")}</span>
                <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{state.settings.apiModel || tt("默认模型", "default model")} · {tt("密钥仅存本机", "key stays local")}</span>
                <button className="btn btn-primary ml-auto !py-[5px] !text-[11.5px]" disabled={extLoading || !final} onClick={callExternal}>
                  {extLoading ? <><Icon name="sync" size={11} className="spin" /> {tt("调用中…", "Calling…")}</> : <><Icon name="bolt" size={11} /> {tt("发送并获取回复", "Send & get reply")}</>}
                </button>
              </div>
              {extResult && (
                <div className="mono-area mt-3 max-h-[200px] overflow-auto whitespace-pre-wrap rounded-lg border px-3 py-2.5 text-[11.5px]"
                  style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                  {extResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 调试历史 */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="title-serif flex items-center gap-1.5 text-[12.5px] font-bold"><Icon name="history" size={13} className="opacity-60" /> {tt("调试历史", "Debug history")}</span>
          <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{tt("回溯「我当时是怎么调的」", "Trace back “how did I tune this”")}</span>
        </div>
        {p.runs.length === 0 ? (
          <p className="py-4 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
            {tt("还没有记录。点一次「试运行」，这次的变量与结果就会留在这里。", "No records yet. Hit “Trial run” once and this run's variables and result will stay here.")}
          </p>
        ) : (
          <div className="space-y-2">
            {p.runs.map((r) => (
              <div key={r.id} className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--ink-2)" }}>
                  <span className="tabular-nums font-medium" style={{ color: "var(--ink)" }}>{fmtClock(r.at)}</span>
                  {Object.entries(r.values).slice(0, 4).map(([k, v]) => (
                    <span key={k} className="chip !py-[1px] !text-[10px]">{k}＝{v.length > 8 ? v.slice(0, 8) + "…" : v}</span>
                  ))}
                  <span className="ml-auto flex items-center gap-2">
                    {r.copied && <span className="flex items-center gap-1" style={{ color: "var(--ok)" }}><Icon name="copy" size={10} /> {tt("已复制", "copied")}</span>}
                    {r.sent && <span className="flex items-center gap-1" style={{ color: "var(--slate)" }}><Icon name="send" size={10} /> {tt("已发送", "sent")}</span>}
                    <CopyBtn size="sm" label="" text={r.final} className="!px-2" />
                    <button className="icon-btn !h-6 !w-6" onClick={() => setOpenRun(openRun === r.id ? null : r.id)} title={tt("展开结果", "Expand result")}>
                      <Icon name={openRun === r.id ? "chevD" : "chevR"} size={11} />
                    </button>
                  </span>
                </div>
                {r.note && <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--ink-2)" }}>{tt("备注：", "Note: ")}{r.note}</div>}
                {openRun === r.id && (
                  <div className="mono-area mt-2 max-h-[160px] overflow-auto whitespace-pre-wrap rounded-lg border px-3 py-2 text-[11px]"
                    style={{ borderColor: "var(--line)", background: "#fdfaf1" }}>
                    {r.final}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
