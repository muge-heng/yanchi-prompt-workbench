import { useState } from "react";
import { useStore, useHelpers } from "./store";
import { cx, fmtClock, timeAgo, tt } from "./lib";
import { Icon, Reveal, Toggle, EmptyState, SyncDot } from "./ui";
import { SYNC_STATUS_COLOR, syncStatusText } from "./sync";

export default function SyncCenter() {
  const { state, set, toast, route, syncStatus, syncLogs, queue, conflicts, syncApi, selectedId } = useStore();
  const helpers = useHelpers();
  const s = state.settings;
  const [showRaw, setShowRaw] = useState<string | null>(null);
  const upS = (patch: Partial<typeof s>) => set((st) => ({ ...st, settings: { ...st.settings, ...patch } }));

  const queued = queue.map((id) => state.prompts.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[860px] space-y-5 px-7 pb-20 pt-8">
        <Reveal>
          <div className="engrave mb-1 text-[11px] tracking-[0.25em]">SYNC CENTER</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="title-serif text-[26px] font-black">{tt("同步中心", "Sync Center")}</h1>
            <SyncDot status={syncStatus} />
          </div>
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
            {tt(
              "通过局域网在台式机、笔记本、平板与手机之间中转你的提示词。同步是可选能力，不开启也能完整使用。",
              "Relay your prompts between desktop, laptop, tablet and phone over your local network. Sync is optional — everything works fully without it."
            )}
          </p>
        </Reveal>

        {/* 连接状态卡 connection status card */}
        <Reveal delay={60}>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 border-b px-5 py-4" style={{ borderColor: "var(--line)" }}>
              <span className={cx("dot !h-[12px] !w-[12px]", syncStatus === "online" && "breathe")} style={{ background: SYNC_STATUS_COLOR[syncStatus] }} />
              <div className="min-w-0 flex-1">
                <div className="title-serif text-[16px] font-bold">{syncStatusText(syncStatus)}</div>
                <div className="mt-0.5 truncate text-[11.5px]" style={{ color: "var(--ink-2)" }}>
                  {s.wsUrl ? (
                    <>
                      {tt("地址", "Address")} <span className="font-mono">{s.wsUrl}</span> · {tt("频道", "channel")} <span className="font-mono">#{s.ns}</span> · {tt("我是", "I am")}「{s.deviceName}」
                    </>
                  ) : (
                    tt("尚未填写 WebSocket 地址", "No WebSocket address yet")
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {syncStatus === "online" || syncStatus === "reconnecting" || syncStatus === "connecting" ? (
                  <button className="btn" onClick={() => syncApi.disconnect()}><Icon name="close" size={13} /> {tt("断开", "Disconnect")}</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => syncApi.connect()}>
                    <Icon name="wifi" size={14} /> {syncStatus === "error" ? tt("重试连接", "Retry") : tt("连接", "Connect")}
                  </button>
                )}
                <button className="btn" onClick={() => syncApi.sendTest()}><Icon name="send" size={13} /> {tt("测试消息", "Test message")}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 px-5 py-4 text-[12px] sm:grid-cols-2" style={{ color: "var(--ink-2)" }}>
              <div className="flex justify-between gap-4">
                <span>{tt("实时同步", "Real-time sync")}</span>
                <Toggle on={s.autoSync} onChange={(b) => { upS({ autoSync: b }); toast("info", b ? tt("已开启自动实时同步", "Real-time sync is on") : tt("已关闭自动同步，仍可手动推送", "Auto-sync off — you can still push manually")); }} label={tt("实时同步", "Real-time sync")} />
              </div>
              <div className="flex justify-between gap-4">
                <span>{tt("最近一次同步", "Last sync")}</span>
                <span className="tabular-nums">{syncApi.lastSyncAt ? timeAgo(syncApi.lastSyncAt) : "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{tt("同步范围", "Sync scope")}</span>
                <select className="select !w-auto !py-[4px] !text-[11.5px]" value={s.scope} onChange={(e) => upS({ scope: e.target.value as any })}>
                  <option value="all">{tt("全部仓库", "All vaults")}</option>
                  <option value="fav">{tt("仅收藏内容", "Starred only")}</option>
                  <option value="current">{tt("仅当前仓库", "Current vault only")}</option>
                </select>
              </div>
              <div className="flex justify-between gap-4">
                <span>{tt("心跳", "Heartbeat")}</span>
                <span>{syncStatus === "online" ? tt("每 25 秒问候一次", "A ping every 25 s") : tt("未启用", "Off")}</span>
              </div>
            </div>

            {/* 地址配置 address form */}
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_150px]">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("WebSocket 地址（ws:// 或 wss://）", "WebSocket address (ws:// or wss://)")}</label>
                  <input className="input font-mono !text-[12px]" placeholder="ws://192.168.1.20:8765" value={s.wsUrl}
                    onChange={(e) => upS({ wsUrl: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && syncApi.connect()} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("命名空间", "Namespace")}</label>
                  <input className="input font-mono !text-[12px]" value={s.ns} onChange={(e) => upS({ ns: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>{tt("设备名称", "Device name")}</label>
                  <input className="input !text-[12px]" value={s.deviceName} onChange={(e) => upS({ deviceName: e.target.value })} />
                </div>
              </div>
              {syncStatus === "error" && (
                <p className="mt-3 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed" style={{ borderColor: "color-mix(in srgb, var(--err) 30%, var(--line))", color: "var(--err)", background: "color-mix(in srgb, var(--err) 6%, var(--card))" }}>
                  {tt(
                    "暂时无法连接到该地址。请确认 WebSocket 服务已启动、地址以 ws:// 或 wss:// 开头，并且本机与服务在同一局域网中。",
                    "Can't reach that address right now. Make sure the WebSocket service is running, the address starts with ws:// or wss://, and both devices share the same local network."
                  )}
                </p>
              )}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* 冲突中心 conflict center */}
          <Reveal delay={100}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="title-serif flex items-center gap-1.5 text-[14px] font-bold"><Icon name="layers" size={14} className="opacity-60" /> {tt("冲突待处理", "Conflicts")}</span>
                <span className="chip !py-[1px] !text-[10.5px] tabular-nums">{conflicts.length}</span>
              </div>
              {conflicts.length === 0 ? (
                <p className="py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {tt("没有冲突。多端修改同一条内容时会在这里温和地请你选择。", "No conflicts. When the same item is edited on another device, you'll be gently asked to choose here.")}
                </p>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((c) => (
                    <div key={c.local.id} className="rounded-xl border p-3.5" style={{ borderColor: "color-mix(in srgb, var(--warn) 40%, var(--line))", background: "color-mix(in srgb, var(--warn) 5%, var(--card))" }}>
                      <div className="mb-1 text-[13px] font-medium">
                        {tt("「", "“")}{c.local.title}{tt("」在另一台设备也被修改", "” was also modified on another device")}
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-2 text-[10.5px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                        <div className="rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                          {tt("本地", "Local")} · {timeAgo(c.local.updatedAt)}<br />{c.local.body.length} {tt("字", "chars")} · {c.local.useCount} {tt("次使用", "uses")}
                        </div>
                        <div className="rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                          {tt("远端", "Remote")} · {timeAgo(c.remote.updatedAt)}<br />{c.remote.body.length} {tt("字", "chars")}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "local")}>{tt("保留本地", "Keep local")}</button>
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "remote")}>{tt("采用远端", "Take remote")}</button>
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "both")}>{tt("同时保留", "Keep both")}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* 离线队列 offline queue */}
          <Reveal delay={140}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="title-serif flex items-center gap-1.5 text-[14px] font-bold"><Icon name="clock" size={14} className="opacity-60" /> {tt("待同步队列", "Pending queue")}</span>
                {queue.length > 0 && (
                  <span className="flex gap-1.5">
                    <button className="btn !py-[4px] !text-[11px]" onClick={() => syncApi.pushPrompts(queue)}>{tt("立即补发", "Send now")}</button>
                    <button className="btn btn-ghost !py-[4px] !text-[11px]" onClick={() => syncApi.clearQueue()}>{tt("清空", "Clear")}</button>
                  </span>
                )}
              </div>
              {queued.length === 0 ? (
                <p className="py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {tt("队列是空的。", "The queue is empty. ") +
                    (s.autoSync
                      ? tt("开启实时同步后，断线期间的修改会先排在这里。", "With real-time sync on, edits made while disconnected wait here.")
                      : tt("开启实时同步后，未发出的修改会排队等待。", "Turn on real-time sync and unsent edits will line up here."))}
                </p>
              ) : (
                <>
                  <p className="mb-2.5 text-[11.5px]" style={{ color: "var(--warn)" }}>
                    {tt(`有 ${queued.length} 条修改尚未同步，连接恢复后会自动补发。`, `${queued.length} edit${queued.length > 1 ? "s" : ""} waiting to sync — they'll be sent once the connection returns.`)}
                  </p>
                  <div className="space-y-1.5">
                    {queued.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px]" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
                        <span className="dot" style={{ background: "var(--warn)" }} />
                        <span className="min-w-0 flex-1 truncate">{p.title}</span>
                        <span className="text-[10px] tabular-nums" style={{ color: "var(--ink-3)" }}>{timeAgo(p.updatedAt)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-4 border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
                <div className="mb-2 text-[11.5px] font-medium" style={{ color: "var(--ink-2)" }}>{tt("手动同步", "Manual sync")}</div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn !py-[6px] !text-[12px]" onClick={() => {
                    const live = state.prompts.filter((p) => !p.deletedAt && p.sync !== "local");
                    let list = live;
                    if (s.scope === "fav") list = live.filter((p) => p.favorite);
                    if (s.scope === "current") {
                      const vid = route.vaultId || state.vaults[0]?.id;
                      list = live.filter((p) => p.vaultId === vid);
                    }
                    if (list.length === 0) { toast("info", tt("该范围内没有可同步的内容", "Nothing to sync in this scope")); return; }
                    syncApi.pushPrompts(list.map((p) => p.id));
                  }}><Icon name="send" size={12} /> {tt("按范围推送", "Push by scope")}</button>
                  {selectedId && <button className="btn !py-[6px] !text-[12px]" onClick={() => syncApi.pushPrompts([selectedId])}><Icon name="doc" size={12} /> {tt("推送当前条目", "Push current item")}</button>}
                  <button className="btn !py-[6px] !text-[12px]" onClick={() => helpers.exportAll()}><Icon name="download" size={12} /> {tt("生成快照文件", "Export snapshot")}</button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 日志 logs */}
        <Reveal delay={180}>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--line)" }}>
              <span className="title-serif text-[14px] font-bold">{tt("同步日志", "Sync log")}</span>
              <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{tt("未识别的消息会被安静忽略，可展开查看原文", "Unrecognized messages are quietly ignored — expand to view raw text")}</span>
            </div>
            {syncLogs.length === 0 ? (
              <EmptyState icon="wifi" title={tt("还没有日志", "No logs yet")} desc={tt("连接、测试、推送与接收都会以可读的方式记在这里。", "Connections, tests, pushes and receipts are recorded here in plain words.")}>
                <button className="btn btn-primary" onClick={() => syncApi.connect()}><Icon name="wifi" size={13} /> {tt("立即连接", "Connect now")}</button>
              </EmptyState>
            ) : (
              <div className="thin-scroll max-h-[380px] divide-y overflow-y-auto" style={{ borderColor: "var(--line)" }}>
                {syncLogs.map((l) => (
                  <div key={l.id} className="px-5 py-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <span className="w-[86px] flex-none tabular-nums" style={{ color: "var(--ink-3)" }}>{fmtClock(l.at)}</span>
                      <span className="flex h-[18px] w-[34px] flex-none items-center justify-center rounded-md border text-[9.5px] font-bold"
                        style={{
                          color: l.dir === "out" ? "var(--moss)" : l.dir === "in" ? "var(--slate)" : "var(--ink-2)",
                          borderColor: "var(--line-2)", background: "var(--card-2)",
                        }}>
                        {l.dir === "out" ? tt("推送", "Push") : l.dir === "in" ? tt("接收", "Recv") : tt("系统", "Sys")}
                      </span>
                      <span className="min-w-0 flex-1" style={{ color: l.ok ? "var(--ink)" : "var(--err)" }}>{l.text}</span>
                      {l.raw && (
                        <button className="icon-btn !h-6 !w-6" onClick={() => setShowRaw(showRaw === l.id ? null : l.id)} title={tt("查看原始消息", "View raw message")}>
                          <Icon name={showRaw === l.id ? "chevD" : "chevR"} size={11} />
                        </button>
                      )}
                    </div>
                    {showRaw === l.id && l.raw && (
                      <div className="mono-area mt-2 overflow-x-auto whitespace-pre rounded-lg border px-3 py-2 text-[10.5px]" style={{ borderColor: "var(--line)", background: "#fdfaf1", color: "var(--ink-2)" }}>{l.raw}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
