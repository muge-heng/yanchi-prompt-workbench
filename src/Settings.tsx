import { useRef, useState } from "react";
import { useStore, useHelpers } from "./store";
import { cx, allTypes, tl, tb, tt, type AppState, type Prompt } from "./lib";
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
  const changeLang = helpers.changeLang;
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
        toast("err", tt("该文件似乎不是有效的提示词备份文件，请检查文件来源。", "This doesn't look like a valid prompt backup. Please check the file source."));
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
          else { prompts.unshift({ ...p, id: p.id + "-copy-" + Math.random().toString(36).slice(2, 6), title: p.title + tt("（导入副本）", " (imported copy)") }); added++; }
        } else { prompts.unshift(p); added++; }
      });
      (applyImport as any)._summary = { added, replaced, skipped };
      return { ...st, vaults, groups, tags, prompts };
    });
    const sum = (applyImport as any)._summary || {};
    toast("ok", tt(
      `导入完成：新增 ${sum.added || 0} 条${sum.replaced ? `，覆盖 ${sum.replaced} 条` : ""}${sum.skipped ? `，跳过 ${sum.skipped} 条` : ""}`,
      `Import done: ${sum.added || 0} added${sum.replaced ? `, ${sum.replaced} replaced` : ""}${sum.skipped ? `, ${sum.skipped} skipped` : ""}`
    ));
    setImportData(null);
  }

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[760px] space-y-5 px-7 pb-20 pt-8">
        <Reveal>
          <div className="engrave mb-1 text-[11px] tracking-[0.25em]">SETTINGS</div>
          <h1 className="title-serif text-[26px] font-black">{tt("设置", "Settings")}</h1>
        </Reveal>

        <Sec title={tt("基础", "General")} desc={tt("语言与这台设备在同步中显示的名字", "Language and this device's name in sync")} delay={40}>
          <Row label={tt("界面语言", "Interface language")} hint={tt("首次打开时已按系统语言自动选择", "Auto-detected from your system on first launch")}
            right={
              <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--line-2)" }}>
                {([["zh", "中文"], ["en", "English"]] as const).map(([code, name]) => (
                  <button key={code}
                    className="px-3 py-[5px] text-[12px] transition-colors"
                    style={s.lang === code ? { background: "#eee2c6", fontWeight: 700, color: "var(--ink)" } : { color: "var(--ink-2)", background: "var(--card)" }}
                    onClick={() => { changeLang(code); toast("ok", code === "en" ? "Switched to English" : "已切换为中文"); }}>
                    {name}
                  </button>
                ))}
              </div>
            } />
          <Row label={tt("设备名称", "Device name")} hint={tt("例如：书桌上的 Mac、客厅的 iPad", "e.g. the Mac on my desk, the iPad in the living room")}
            right={<input className="input !w-[200px]" value={s.deviceName} onChange={(e) => upS({ deviceName: e.target.value })} />} />
          <Row label={tt("本机存储占用", "Local storage used")} hint={tt(`数据保存在本机浏览器（IndexedDB），约 ${storageKB || "<1"} KB`, `Data lives in this browser (IndexedDB), about ${storageKB || "<1"} KB`)}
            right={<span className="chip"><Icon name="doc" size={11} /> {tt("已保存到本机", "Saved on this device")}</span>} />
        </Sec>

        <Sec title={tt("外观与编辑偏好", "Appearance & editing")} desc={tt("砚池只提供浅色纸感界面，不提供深色模式", "Yanchi ships a light, paper-feel interface only — no dark mode")} delay={80}>
          <Row label={tt("减少动态效果", "Reduce motion")} hint={tt("关闭浮现、上浮等装饰性动画，保留必要反馈", "Turn off decorative animation, keep essential feedback")}
            right={<Toggle on={s.reduceMotion} onChange={(b) => upS({ reduceMotion: b })} label={tt("减少动态效果", "Reduce motion")} />} />
          <Row label={tt("保存提示", "Save indicator")} hint={tt("编辑后在详情右上角显示「已保存到本机」", "Show “Saved on this device” in the panel corner while editing")}
            right={<Toggle on={s.saveFlash} onChange={(b) => upS({ saveFlash: b })} label={tt("保存提示", "Save indicator")} />} />
          <Row label={tt("默认紧凑列表", "Compact list by default")} hint={tt("列表页默认使用紧凑行视图", "List page defaults to the compact row view")}
            right={<Toggle on={s.compactList} onChange={(b) => upS({ compactList: b })} label={tt("紧凑列表", "Compact list")} />} />
        </Sec>

        <Sec title={tt("左栏布局", "Sidebar layout")} desc={tt("按需显示左栏的各个区域，让工作台更像你自己的", "Show or hide each sidebar section to make the workbench feel like yours")} delay={100}>
          {([
            ["smartViews", tt("智能视图", "Smart views"), tt("最近使用、收藏、草稿等快捷入口", "Recently used, favorites, drafts, and other shortcuts")],
            ["vaults", tt("仓库与分组", "Vaults & groups"), tt("左侧的仓库目录与分组树", "The vault directory and group tree")],
            ["tags", tt("标签", "Tags"), tt("横向筛选用的标签云", "The tag cloud for cross-cutting filters")],
            ["typeCenter", tt("类型中心入口", "Type Center entry"), tt("主导航中的类型中心快捷入口", "The Type Center shortcut in the main navigation")],
            ["syncCard", tt("同步状态卡", "Sync status card"), tt("左栏底部的连接状态与待同步提示", "Connection status and pending-sync hint at the bottom")],
          ] as const).map(([key, label, hint]) => (
            <Row key={key} label={label} hint={hint}
              right={<Toggle on={s.sidebar?.[key] ?? true} onChange={(b) => upS({ sidebar: { ...s.sidebar, [key]: b } })} label={label} />} />
          ))}
        </Sec>

        <Sec title={tt("类型与模板", "Types & templates")} desc={tt("每种类型都有自己的字段结构，可在此新建、编辑字段与开关", "Each type has its own fields — create, edit and toggle them here")} delay={120}>
          <div className="mb-4 space-y-2.5">
            {allTypes().map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                <span style={{ color: t.color }}><Icon name={t.icon} size={15} /></span>
                <span className="title-serif text-[13px] font-bold">{tl(t)}</span>
                <span className="hidden min-w-0 flex-1 truncate text-[10.5px] sm:block" style={{ color: "var(--ink-3)" }}>{tb(t)}</span>
                <span className="ml-auto flex-none text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{t.fields.filter((f) => !f.hidden).length} {tt("个字段", "fields")}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => nav({ name: "types" })}>
            <Icon name="settings" size={14} /> {tt("打开类型中心", "Open Type Center")}
          </button>
        </Sec>

        <Sec title={tt("标签管理", "Tag management")} desc={tt("横向组织提示词；未使用的标签可以一键清理", "Organize prompts across vaults; unused tags can be cleaned in one click")} delay={160}>
          <TagManager />
        </Sec>

        <Sec title={tt("外部 AI 模型（可选）", "External AI model (optional)")} desc={tt("配置后可在工作台直接把最终 Prompt 发给模型获取回复。未配置时，本地预览、变量替换与复制完全可用。", "Once configured, the workbench can send the final prompt to a model. Without it, local preview, variables and copy work fully.")} delay={200}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>{tt("API 地址", "API URL")}</label>
              <input className="input font-mono !text-[12px]" placeholder="https://api.example.com/v1" value={s.apiUrl} onChange={(e) => upS({ apiUrl: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>{tt("模型名称", "Model name")}</label>
              <input className="input font-mono !text-[12px]" placeholder="gpt-4o-mini" value={s.apiModel} onChange={(e) => upS({ apiModel: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11.5px]" style={{ color: "var(--ink-2)" }}>API Key</label>
              <div className="flex gap-2">
                <input className="input flex-1 font-mono !text-[12px]" type={showKey ? "text" : "password"} placeholder="sk-…" value={s.apiKey} onChange={(e) => upS({ apiKey: e.target.value })} />
                <button className="btn flex-none" onClick={() => setShowKey((v) => !v)}><Icon name={showKey ? "eye" : "close"} size={13} /> {showKey ? tt("隐藏", "Hide") : tt("显示", "Show")}</button>
              </div>
              <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--ink-3)" }}>{tt("密钥仅保存在本机浏览器中，不会随同步发送。", "The key stays in this browser only — it is never sent through sync.")}</p>
            </div>
          </div>
        </Sec>

        <Sec title={tt("局域网同步", "LAN sync")} desc={tt("通过任意 WebSocket 地址在局域网设备间中转消息", "Relay messages between devices on your network via any WebSocket address")} delay={240}>
          <Row label={tt("WebSocket 地址", "WebSocket address")} hint={tt("支持 ws:// 与 wss://", "Supports ws:// and wss://")}
            right={<input className="input !w-[240px] font-mono !text-[12px]" placeholder="ws://192.168.1.20:8765" value={s.wsUrl} onChange={(e) => upS({ wsUrl: e.target.value })} />} />
          <Row label={tt("消息命名空间", "Message namespace")} hint={tt("只有同一命名空间的消息会被识别，避免串频", "Only messages in the same namespace are recognized, avoiding crosstalk")}
            right={<input className="input !w-[150px] font-mono !text-[12px]" value={s.ns} onChange={(e) => upS({ ns: e.target.value })} />} />
          <Row label={tt("自动实时同步", "Auto real-time sync")} hint={tt("开启后，修改会尝试实时广播；断开时自动排队", "When on, edits are broadcast in real time; queued automatically when disconnected")}
            right={<Toggle on={s.autoSync} onChange={(b) => upS({ autoSync: b })} label={tt("自动实时同步", "Auto real-time sync")} />} />
          <div className="pt-3">
            <button className="btn" onClick={() => nav({ name: "sync" })}><Icon name="sync" size={13} /> {tt("打开同步中心", "Open Sync Center")}</button>
          </div>
        </Sec>

        <Sec title={tt("本地数据", "Local data")} desc={tt("数据优先保存在本机。建议定期导出备份，以防浏览器数据被清理。", "Your data lives on this device first. Export a backup regularly in case the browser data gets cleared.")} delay={280}>
          <div className="flex flex-wrap gap-2.5">
            <button className="btn btn-primary" onClick={() => helpers.exportAll()}><Icon name="download" size={13} /> {tt("导出全量备份", "Export full backup")}</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} /> {tt("导入备份文件", "Import backup")}</button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
            <button className="btn btn-danger" onClick={() => setConfirmClear(true)}><Icon name="trash" size={13} /> {tt("清空全部数据", "Erase all data")}</button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            {tt("当前数据保存在本机浏览器中。若你常用隐私模式或定期清理缓存，建议开启同步或定期导出备份。", "Data is stored in this browser. If you often use private mode or clear the cache, consider enabling sync or exporting backups regularly.")}
          </p>
        </Sec>

        <Sec title={tt("快捷键", "Keyboard shortcuts")} desc={tt("效率工具离不开键盘", "A tool for speed lives on the keyboard")} delay={320}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {([
              ["⌘ / Ctrl K", tt("命令面板（搜操作与提示词）", "Command palette (search actions & prompts)")],
              ["N", tt("新建提示词", "New prompt")],
              ["/", tt("聚焦搜索框", "Focus the search box")],
              ["⌘ / Ctrl \\", tt("专注模式", "Focus mode")],
              ["[ 与 ]", tt("上一条 / 下一条提示词", "Previous / next prompt")],
              ["⌘ / Ctrl ,", tt("打开设置", "Open settings")],
              ["Esc", tt("退出专注 / 关闭弹层", "Exit focus / close dialogs")],
              ["⌘ / Ctrl S", tt("手动触发保存反馈", "Trigger save feedback")],
            ] as [string, string][]).map(([k, d]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b py-1.5 text-[12px] last:border-0" style={{ borderColor: "var(--line)" }}>
                <span style={{ color: "var(--ink-2)" }}>{d}</span><Kbd>{k}</Kbd>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title={tt("关于砚池", "About Yanchi")} delay={360}>
          <div className="flex items-start gap-4">
            <div className="seal-stamp flex h-12 w-12 flex-none items-center justify-center rounded-xl text-[22px] font-black">砚</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              <p className="title-serif mb-1 text-[14px] font-bold text-[var(--ink)]">{tt("砚池 · 私人提示词工作台 v1.0", "Yanchi · Private Prompt Vault & Workbench v1.0")}</p>
              <p>{tt("本地优先的提示词资产仓库：沉淀、整理、调试、复用。数据默认保存在本机浏览器，局域网同步为可选能力。", "A local-first vault for your prompt assets: collect, organize, debug, reuse. Data stays in this browser by default; LAN sync is optional.")}</p>
              <p className="mt-2">{tt("在局域网多端使用时，可在电脑上运行随附的", "For multi-device use on your LAN, run the bundled")} <Kbd>python launcher.py</Kbd> {tt("启动本地服务并自动打开浏览器，页面会提示「本地服务运行中」。", "to start the local service — the browser opens automatically.")}</p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--line-2)" }}>
            <img src="https://image.qwenlm.ai/generated-images/a3678a9b-3b49-46f3-8a15-93b69355e62e/_result.png" alt="砚池 · 案头一景" className="block w-full" loading="lazy" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed sm:grid-cols-2" style={{ color: "var(--ink-2)" }}>
            <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="mb-0.5 flex items-center gap-1.5 font-medium" style={{ color: "var(--ink)" }}><Icon name="shield" size={12} className="opacity-60" /> {tt("开源协议", "License")}</div>
              {tt("砚池以 MIT 协议开源，可自由使用、修改与再分发。© 2026 Yanchi Contributors。", "Yanchi is open source under the MIT License — free to use, modify and redistribute. © 2026 Yanchi Contributors.")}
            </div>
            <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="mb-0.5 flex items-center gap-1.5 font-medium" style={{ color: "var(--ink)" }}><Icon name="pen" size={12} className="opacity-60" /> {tt("字体致谢", "Font credits")}</div>
              {tt("思源宋体 / 思源黑体、JetBrains Mono，均遵循 SIL Open Font License 1.1。", "Noto Serif SC / Noto Sans SC and JetBrains Mono, all under the SIL Open Font License 1.1.")}
            </div>
          </div>
        </Sec>
      </div>

      {/* 导入预览 */}
      <Modal open={!!importData} onClose={() => setImportData(null)} title={tt("导入前预览", "Preview before import")} width={480}>
        {importData && (
          <div>
            <div className="mb-4 grid grid-cols-3 gap-2.5 text-center">
              {[
                { n: importData.prompts.length, l: tt("提示词", "Prompts") },
                { n: importData.vaults.length, l: tt("仓库", "Vaults") },
                { n: importData.tags.length, l: tt("标签", "Tags") },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border py-3" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                  <div className="title-serif text-[20px] font-black tabular-nums" style={{ color: "var(--brass)" }}>{x.n}</div>
                  <div className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{x.l}</div>
                </div>
              ))}
            </div>
            <div className="mb-1 text-[12px] font-medium">{tt("遇到同名（同 ID）内容时", "When an item with the same ID already exists")}</div>
            <div className="space-y-1.5">
              {([
                ["copy", tt("保留副本", "Keep a copy"), tt("新旧都留下，导入的加「副本」后缀", "Keep both; the imported one gets a “copy” suffix")],
                ["overwrite", tt("覆盖本地", "Overwrite local"), tt("用备份文件中的内容替换本地", "Replace local items with the backup content")],
                ["skip", tt("跳过", "Skip"), tt("已存在的保持不动", "Leave existing items untouched")],
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
              <button className="btn" onClick={() => setImportData(null)}>{tt("取消", "Cancel")}</button>
              <button className="btn btn-primary" onClick={applyImport}>{tt("确认导入", "Confirm import")}</button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={confirmClear} onClose={() => setConfirmClear(false)} title={tt("清空全部数据", "Erase all data")} okText={tt("全部清空", "Erase everything")}
        desc={<>{tt(`将删除所有仓库、分组、标签与 ${state.prompts.length} 条提示词（含回收站）。`, `All vaults, groups, tags and ${state.prompts.length} prompts (including Trash) will be deleted.`)}<br />{tt("建议先导出全量备份。此操作不可恢复。", "Export a full backup first. This cannot be undone.")}</>}
        onOk={() => {
          const empty: AppState = { ...state, vaults: [], groups: [], tags: [], prompts: [] };
          set(() => empty);
          toast("info", tt("已清空。随时可以从示例重新开始", "Cleared. You can start over from the samples anytime"));
          nav({ name: "home" });
        }} />
    </div>
  );
}
