import { useRef, useState } from "react";
import { useStore, useHelpers } from "./store";
import { cx, TYPE_META, TYPE_ORDER, type AppState, type Prompt } from "./lib";
import { Icon, Modal, Confirm, Reveal, Toggle, Kbd } from "./ui";
import { TagManager } from "./lists";

function Sec({ title, desc, children, delay = 0 }: { title: string; desc?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <section className="card p-5">
        <div className="mb-4">
          <h2 className="title-serif text-[15.5px] font-bold">{title}</h2>
          {desc && <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink-2)" }}>{desc}</p>}
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function Row({ label, hint, right }: { label: string; hint?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }}>
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>{hint}</div>}
      </div>
      <div className="flex-none">{right}</div>
    </div>
  );
}

export default function Settings() {
  const { state, set, toast, storageKB, nav } = useStore();
  const helpers = useHelpers();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [showKey, setShowKey] = useState(false);
  const [importData, setImportData] = useState<{ vaults: any[]; groups: any[]; tags: any[]; prompts: Prompt[] } | null>(null);
  const [strategy, setStrategy] = useState<"overwrite" | "skip" | "copy">("copy");
  const [confirmClear, setConfirmClear] = useState(false);

  const upS = (patch: Partial<typeof s>) => set((st) => ({ ...st, settings: { ...st.settings, ...patch } }));

  function onImportFile(f: File) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (!d || !Array.isArray(d.prompts)) throw new Error("bad");
        setImportData({ vaults: d.vaults || [], groups: d.groups || [], tags: d.tags || [], prompts: d.prompts });
      } catch {
        toast("err", "该文件似乎不是有效的提示词备份文件，请检查文件来源。");
      }
    };
    r.readAsText(f);
  }

  function applyImport() {
    if (!importData) return;
    set((st) => {
      const vaults = [...st.vaults];
      importData.vaults.forEach((v: any) => { if (!vaults.some((x) => x.id === v.id)) vaults.push(v); });
      const groups = [...st.groups];
      importData.groups.forEach((g: any) => { if (!groups.some((x) => x.id === g.id)) groups.push(g); });
      const tags = [...st.tags];
      importData.tags.forEach((t: any) => { if (!tags.some((x) => x.id === t.id || x.name === t.name)) tags.push(t); });
      let added = 0, replaced = 0, skipped = 0;
      const prompts = [...st.prompts];
      importData.prompts.forEach((p: Prompt) => {
        const i = prompts.findIndex((x) => x.id === p.id);
        if (i >= 0) {
          if (strategy === "overwrite") { prompts[i] = p; replaced++; }
          else if (strategy === "skip") skipped++;
          else { prompts.unshift({ ...p, id: p.id + "-copy-" + Math.random().toString(36).slice(2, 6), title: p.title + "（导入副本）" }); added++; }
        } else { prompts.unshift(p); added++; }
      });
      (applyImport as any)._summary = { added, replaced, skipped };
      return { ...st, vaults, groups, tags, prompts };
    });
    const sum = (applyImport as any)._summary || {};
    toast("ok", `导入完成：新增 ${sum.added || 0} 条${sum.replaced ? `，覆盖 ${sum.replaced} 条` : ""}${sum.skipped ? `，跳过 ${sum.skipped} 条` : ""}`);
    setImportData(null);
  }

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[760px] space-y-5 px-7 pb-20 pt-8">
        <Reveal>
          <div className="engrave mb-1 text-[11px] tracking-[0.25em]">SETTINGS</div>
          <h1 className="title-serif text-[26px] font-black">设置</h1>
        </Reveal>

        <Sec title="基础" desc="这台设备在局域网同步中显示的名字" delay={40}>
          <Row label="设备名称" hint="例如：书桌上的 Mac、客厅的 iPad"
            right={<input className="input !w-[200px]" value={s.deviceName} onChange={(e) => upS({ deviceName: e.target.value })} />} />
          <Row label="本机存储占用" hint={`数据保存在本机浏览器（IndexedDB），约 ${storageKB || "<1"} KB`}
            right={<span className="chip"><Icon name="doc" size={11} /> 已保存到本机</span>} />
        </Sec>

        <Sec title="外观与编辑偏好" desc="砚池只提供浅色纸感界面，不提供深色模式" delay={80}>
          <Row label="减少动态效果" hint="关闭浮现、上浮等装饰性动画，保留必要反馈"
            right={<Toggle on={s.reduceMotion} onChange={(b) => upS({ reduceMotion: b })} label="减少动态效果" />} />
          <Row label="保存提示" hint="编辑后在详情右上角显示「已保存到本机」"
            right={<Toggle on={s.saveFlash} onChange={(b) => upS({ saveFlash: b })} label="保存提示" />} />
          <Row label="默认紧凑列表" hint="列表页默认使用紧凑行视图"
            right={<Toggle on={s.compactList} onChange={(b) => upS({ compactList: b })} label="紧凑列表" />} />
        </Sec>

        <Sec title="类型与模板" desc="每种类型都有自己的字段结构，切换类型时字段随之变化" delay={120}>
          <div className="space-y-3">
            {TYPE_ORDER.map((t) => (
              <div key={t} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                <div className="mb-2 flex items-center gap-2">
                  <span style={{ color: TYPE_META[t].color }}><Icon name={TYPE_META[t].icon} size={15} /></span>
                  <span className="title-serif text-[13px] font-bold">{TYPE_META[t].label}</span>
                  <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{TYPE_META[t].blurb}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(TYPE_META[t].fields.length ? TYPE_META[t].fields : [{ label: "正文" } as any]).map((f: any) => (
                    <span key={f.label} className="chip !py-[1px] !text-[10.5px]">{f.label}</span>
                  ))}
                  {TYPE_META[t].params.map((pm) => <span key={pm.key} className="chip !py-[1px] !text-[10.5px] opacity-70">{pm.label}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="标签管理" desc="横向组织提示词；未使用的标签可以一键清理" delay={160}>
          <TagManager />
        </Sec>

        <Sec title="外部 AI 模型（可选）" desc="配置后可在工作台直接把最终 Prompt 发给模型获取回复。未配置时，本地预览、变量替换与复制完全可用。" delay={200}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>API 地址</label>
              <input className="input font-mono !text-[12px]" placeholder="https://api.example.com/v1" value={s.apiUrl} onChange={(e) => upS({ apiUrl: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>模型名称</label>
              <input className="input font-mono !text-[12px]" placeholder="gpt-4o-mini" value={s.apiModel} onChange={(e) => upS({ apiModel: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>API Key</label>
              <div className="flex gap-2">
                <input className="input flex-1 font-mono !text-[12px]" type={showKey ? "text" : "password"} placeholder="sk-…" value={s.apiKey} onChange={(e) => upS({ apiKey: e.target.value })} />
                <button className="btn flex-none" onClick={() => setShowKey((v) => !v)}><Icon name={showKey ? "eye" : "close"} size={13} /> {showKey ? "隐藏" : "显示"}</button>
              </div>
              <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--ink-3)" }}>密钥仅保存在本机浏览器中，不会随同步发送。</p>
            </div>
          </div>
        </Sec>

        <Sec title="局域网同步" desc="通过任意 WebSocket 地址在局域网设备间中转消息" delay={240}>
          <Row label="WebSocket 地址" hint="支持 ws:// 与 wss://"
            right={<input className="input !w-[240px] font-mono !text-[12px]" placeholder="ws://192.168.1.20:8765" value={s.wsUrl} onChange={(e) => upS({ wsUrl: e.target.value })} />} />
          <Row label="消息命名空间" hint="只有同一命名空间的消息会被识别，避免串频"
            right={<input className="input !w-[150px] font-mono !text-[12px]" value={s.ns} onChange={(e) => upS({ ns: e.target.value })} />} />
          <Row label="自动实时同步" hint="开启后，修改会尝试实时广播；断开时自动排队"
            right={<Toggle on={s.autoSync} onChange={(b) => upS({ autoSync: b })} label="自动实时同步" />} />
          <div className="pt-3">
            <button className="btn" onClick={() => nav({ name: "sync" })}><Icon name="sync" size={13} /> 打开同步中心</button>
          </div>
        </Sec>

        <Sec title="本地数据" desc="数据优先保存在本机。建议定期导出备份，以防浏览器数据被清理。" delay={280}>
          <div className="flex flex-wrap gap-2.5">
            <button className="btn btn-primary" onClick={() => helpers.exportAll()}><Icon name="download" size={13} /> 导出全量备份</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} /> 导入备份文件</button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
            <button className="btn btn-danger" onClick={() => setConfirmClear(true)}><Icon name="trash" size={13} /> 清空全部数据</button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            当前数据保存在本机浏览器中。若你常用隐私模式或定期清理缓存，建议开启同步或定期导出备份。
          </p>
        </Sec>

        <Sec title="快捷键" desc="效率工具离不开键盘" delay={320}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {([
              ["⌘ / Ctrl K", "命令面板（搜操作与提示词）"],
              ["N", "新建提示词"],
              ["/", "聚焦搜索框"],
              ["⌘ / Ctrl \\", "专注模式"],
              ["[ 与 ]", "上一条 / 下一条提示词"],
              ["⌘ / Ctrl ,", "打开设置"],
              ["Esc", "退出专注 / 关闭弹层"],
              ["⌘ / Ctrl S", "手动触发保存反馈"],
            ] as [string, string][]).map(([k, d]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b py-1.5 text-[12px] last:border-0" style={{ borderColor: "var(--line)" }}>
                <span style={{ color: "var(--ink-2)" }}>{d}</span><Kbd>{k}</Kbd>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="关于砚池" delay={360}>
          <div className="flex items-start gap-4">
            <div className="seal-stamp flex h-12 w-12 flex-none items-center justify-center rounded-xl text-[22px] font-black">砚</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              <p className="title-serif mb-1 text-[14px] font-bold text-[var(--ink)]">砚池 · 私人提示词工作台 v1.0</p>
              <p>本地优先的提示词资产仓库：沉淀、整理、调试、复用。数据默认保存在本机浏览器，局域网同步为可选能力。</p>
              <p className="mt-2">在局域网多端使用时，可在电脑上运行随附的 <Kbd>python launcher.py</Kbd> 启动本地服务并自动打开浏览器，页面会提示「本地服务运行中」。</p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--line-2)" }}>
            <img src="https://image.qwenlm.ai/generated-images/a3678a9b-3b49-46f3-8a15-93b69355e62e/_result.png" alt="砚池 · 案头一景" className="block w-full" loading="lazy" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed sm:grid-cols-2" style={{ color: "var(--ink-2)" }}>
            <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="mb-0.5 flex items-center gap-1.5 font-medium" style={{ color: "var(--ink)" }}><Icon name="shield" size={12} className="opacity-60" /> 开源协议</div>
              砚池以 MIT 协议开源，可自由使用、修改与再分发。© 2026 Yanchi Contributors。
            </div>
            <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="mb-0.5 flex items-center gap-1.5 font-medium" style={{ color: "var(--ink)" }}><Icon name="pen" size={12} className="opacity-60" /> 字体致谢</div>
              思源宋体 / 思源黑体、JetBrains Mono，均遵循 SIL Open Font License 1.1。
            </div>
          </div>
        </Sec>
      </div>

      {/* 导入预览 */}
      <Modal open={!!importData} onClose={() => setImportData(null)} title="导入前预览" width={480}>
        {importData && (
          <div>
            <div className="mb-4 grid grid-cols-3 gap-2.5 text-center">
              {[
                { n: importData.prompts.length, l: "提示词" },
                { n: importData.vaults.length, l: "仓库" },
                { n: importData.tags.length, l: "标签" },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                  <div className="title-serif text-[20px] font-black tabular-nums" style={{ color: "var(--brass)" }}>{x.n}</div>
                  <div className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{x.l}</div>
                </div>
              ))}
            </div>
            <div className="mb-1 text-[12px] font-medium">遇到同名（同 ID）内容时</div>
            <div className="space-y-1.5">
              {([
                ["copy", "保留副本", "新旧都留下，导入的加「副本」后缀"],
                ["overwrite", "覆盖本地", "用备份文件中的内容替换本地"],
                ["skip", "跳过", "已存在的保持不动"],
              ] as [typeof strategy, string, string][]).map(([k, t, d]) => (
                <label key={k} className={cx("flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-2.5", strategy === k && "border-[var(--brass-2)] bg-[#f8f1de]")}
                  style={{ borderColor: strategy === k ? "var(--brass-2)" : "var(--line)" }}>
                  <input type="radio" className="mt-1 accent-[#a3803a]" checked={strategy === k} onChange={() => setStrategy(k)} />
                  <span>
                    <span className="block text-[12.5px] font-medium">{t}</span>
                    <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>{d}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2.5">
              <button className="btn" onClick={() => setImportData(null)}>取消</button>
              <button className="btn btn-primary" onClick={applyImport}>确认导入</button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={confirmClear} onClose={() => setConfirmClear(false)} title="清空全部数据" okText="全部清空"
        desc={<>将删除所有仓库、分组、标签与 {state.prompts.length} 条提示词（含回收站）。<br />建议先导出全量备份。此操作不可恢复。</>}
        onOk={() => {
          const empty: AppState = { ...state, vaults: [], groups: [], tags: [], prompts: [] };
          set(() => empty);
          toast("info", "已清空。随时可以从示例重新开始");
          nav({ name: "home" });
        }} />
    </div>
  );
}
