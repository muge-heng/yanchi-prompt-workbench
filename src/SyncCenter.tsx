import { useState } from "react";
import { useStore, useHelpers } from "./store";
import { cx, fmtClock, timeAgo } from "./lib";
import { Icon, Reveal, Toggle, EmptyState, SyncDot } from "./ui";
import { SYNC_STATUS_COLOR, SYNC_STATUS_TEXT } from "./sync";

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
            <h1 className="title-serif text-[26px] font-black">同步中心</h1>
            <SyncDot status={syncStatus} />
          </div>
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
            通过局域网在台式机、笔记本、平板与手机之间中转你的提示词。同步是可选能力，不开启也能完整使用。
          </p>
        </Reveal>

        {/* 连接状态卡 */}
        <Reveal delay={60}>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 border-b px-5 py-4" style={{ borderColor: "var(--line)" }}>
              <span className={cx("dot !h-[12px] !w-[12px]", syncStatus === "online" && "breathe")} style={{ background: SYNC_STATUS_COLOR[syncStatus] }} />
              <div className="min-w-0 flex-1">
                <div className="title-serif text-[16px] font-bold">{SYNC_STATUS_TEXT[syncStatus]}</div>
                <div className="mt-0.5 truncate text-[11.5px]" style={{ color: "var(--ink-2)" }}>
                  {s.wsUrl ? <>地址 <span className="font-mono">{s.wsUrl}</span> · 频道 <span className="font-mono">#{s.ns}</span> · 我是「{s.deviceName}」</> : "尚未填写 WebSocket 地址"}
                </div>
              </div>
              <div className="flex gap-2">
                {syncStatus === "online" || syncStatus === "reconnecting" || syncStatus === "connecting" ? (
                  <button className="btn" onClick={() => syncApi.disconnect()}><Icon name="close" size={13} /> 断开</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => syncApi.connect()}><Icon name="wifi" size={14} /> {syncStatus === "error" ? "重试连接" : "连接"}</button>
                )}
                <button className="btn" onClick={() => syncApi.sendTest()}><Icon name="send" size={13} /> 测试消息</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 px-5 py-4 text-[12px] sm:grid-cols-2" style={{ color: "var(--ink-2)" }}>
              <div className="flex justify-between gap-4"><span>实时同步</span><Toggle on={s.autoSync} onChange={(b) => { upS({ autoSync: b }); toast("info", b ? "已开启自动实时同步" : "已关闭自动同步，仍可手动推送"); }} label="实时同步" /></div>
              <div className="flex justify-between gap-4"><span>最近一次同步</span><span className="tabular-nums">{syncApi.lastSyncAt ? timeAgo(syncApi.lastSyncAt) : "—"}</span></div>
              <div className="flex items-center justify-between gap-4">
                <span>同步范围</span>
                <select className="select !w-auto !py-[4px] !text-[11.5px]" value={s.scope} onChange={(e) => upS({ scope: e.target.value as any })}>
                  <option value="all">全部仓库</option>
                  <option value="fav">仅收藏内容</option>
                  <option value="current">仅当前仓库</option>
                </select>
              </div>
              <div className="flex justify-between gap-4"><span>心跳</span><span>{syncStatus === "online" ? "每 25 秒问候一次" : "未启用"}</span></div>
            </div>

            {/* 地址配置 */}
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--line)", background: "var(--card-2)" }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_150px]">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>WebSocket 地址（ws:// 或 wss://）</label>
                  <input className="input font-mono !text-[12px]" placeholder="ws://192.168.1.20:8765" value={s.wsUrl}
                    onChange={(e) => upS({ wsUrl: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && syncApi.connect()} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>命名空间</label>
                  <input className="input font-mono !text-[12px]" value={s.ns} onChange={(e) => upS({ ns: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: "var(--ink-2)" }}>设备名称</label>
                  <input className="input !text-[12px]" value={s.deviceName} onChange={(e) => upS({ deviceName: e.target.value })} />
                </div>
              </div>
              {syncStatus === "error" && (
                <p className="mt-3 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed" style={{ borderColor: "color-mix(in srgb, var(--err) 30%, var(--line))", color: "var(--err)", background: "color-mix(in srgb, var(--err) 6%, var(--card))" }}>
                  暂时无法连接到该地址。请确认 WebSocket 服务已启动、地址以 ws:// 或 wss:// 开头，并且本机与服务在同一局域网中。
                </p>
              )}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* 冲突中心 */}
          <Reveal delay={100}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="title-serif flex items-center gap-1.5 text-[14px] font-bold"><Icon name="layers" size={14} className="opacity-60" /> 冲突待处理</span>
                <span className="chip !py-[1px] !text-[10.5px] tabular-nums">{conflicts.length}</span>
              </div>
              {conflicts.length === 0 ? (
                <p className="py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>没有冲突。多端修改同一条内容时会在这里温和地请你选择。</p>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((c) => (
                    <div key={c.local.id} className="rounded-xl border p-3.5" style={{ borderColor: "color-mix(in srgb, var(--warn) 40%, var(--line))", background: "color-mix(in srgb, var(--warn) 5%, var(--card))" }}>
                      <div className="mb-1 text-[13px] font-medium">「{c.local.title}」在另一台设备也被修改</div>
                      <div className="mb-3 grid grid-cols-2 gap-2 text-[10.5px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                        <div className="rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                          本地 · {timeAgo(c.local.updatedAt)}<br />{c.local.body.length} 字 · {c.local.useCount} 次使用
                        </div>
                        <div className="rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
                          远端 · {timeAgo(c.remote.updatedAt)}<br />{c.remote.body.length} 字
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "local")}>保留本地</button>
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "remote")}>采用远端</button>
                        <button className="btn !py-[5px] !text-[11.5px]" onClick={() => syncApi.resolveConflict(c.local.id, "both")}>同时保留</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* 离线队列 */}
          <Reveal delay={140}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="title-serif flex items-center gap-1.5 text-[14px] font-bold"><Icon name="clock" size={14} className="opacity-60" /> 待同步队列</span>
                {queue.length > 0 && (
                  <span className="flex gap-1.5">
                    <button className="btn !py-[4px] !text-[11px]" onClick={() => syncApi.pushPrompts(queue)}>立即补发</button>
                    <button className="btn btn-ghost !py-[4px] !text-[11px]" onClick={() => syncApi.clearQueue()}>清空</button>
                  </span>
                )}
              </div>
              {queued.length === 0 ? (
                <p className="py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
                  队列是空的。{s.autoSync ? "开启实时同步后，断线期间的修改会先排在这里。" : "开启实时同步后，未发出的修改会排队等待。"}
                </p>
              ) : (
                <>
                  <p className="mb-2.5 text-[11.5px]" style={{ color: "var(--warn)" }}>有 {queued.length} 条修改尚未同步，连接恢复后会自动补发。</p>
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
                <div className="mb-2 text-[11.5px] font-medium" style={{ color: "var(--ink-2)" }}>手动同步</div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn !py-[6px] !text-[12px]" onClick={() => {
                    const live = state.prompts.filter((p) => !p.deletedAt && p.sync !== "local");
                    let list = live;
                    if (s.scope === "fav") list = live.filter((p) => p.favorite);
                    if (s.scope === "current") {
                      const vid = route.vaultId || state.vaults[0]?.id;
                      list = live.filter((p) => p.vaultId === vid);
                    }
                    if (list.length === 0) { toast("info", "该范围内没有可同步的内容"); return; }
                    syncApi.pushPrompts(list.map((p) => p.id));
                  }}><Icon name="send" size={12} /> 按范围推送</button>
                  {selectedId && <button className="btn !py-[6px] !text-[12px]" onClick={() => syncApi.pushPrompts([selectedId])}><Icon name="doc" size={12} /> 推送当前条目</button>}
                  <button className="btn !py-[6px] !text-[12px]" onClick={() => helpers.exportAll()}><Icon name="download" size={12} /> 生成快照文件</button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 日志 */}
        <Reveal delay={180}>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--line)" }}>
              <span className="title-serif text-[14px] font-bold">同步日志</span>
              <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>未识别的消息会被安静忽略，可展开查看原文</span>
            </div>
            {syncLogs.length === 0 ? (
              <EmptyState icon="wifi" title="还没有日志" desc="连接、测试、推送与接收都会以可读的方式记在这里。">
                <button className="btn btn-primary" onClick={() => syncApi.connect()}><Icon name="wifi" size={13} /> 立即连接</button>
              </EmptyState>
            ) : (
              <div className="thin-scroll max-h-[380px] divide-y overflow-y-auto" style={{ borderColor: "var(--line)" }}>
                {syncLogs.map((l) => (
                  <div key={l.id} className="px-5 py-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <span className="w-[86px] flex-none tabular-nums" style={{ color: "var(--ink-3)" }}>{fmtClock(l.at)}</span>
                      <span className={cx("flex h-[18px] w-[34px] flex-none items-center justify-center rounded-md border text-[9.5px] font-bold")}
                        style={{
                          color: l.dir === "out" ? "var(--moss)" : l.dir === "in" ? "var(--slate)" : "var(--ink-2)",
                          borderColor: "var(--line-2)", background: "var(--card-2)",
                        }}>
                        {l.dir === "out" ? "推送" : l.dir === "in" ? "接收" : "系统"}
                      </span>
                      <span className="min-w-0 flex-1" style={{ color: l.ok ? "var(--ink)" : "var(--err)" }}>{l.text}</span>
                      {l.raw && (
                        <button className="icon-btn !h-6 !w-6" onClick={() => setShowRaw(showRaw === l.id ? null : l.id)} title="查看原始消息">
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
