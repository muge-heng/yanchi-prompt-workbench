import { useMemo, useState } from "react";
import { useStore, newPrompt as np } from "./store";
import { cx, timeAgo, TYPE_META, TYPE_ORDER, composePrompt, copyText } from "./lib";
import { Icon, Reveal, SectionTitle, TypeBadge, EmptyState, SyncDot } from "./ui";
import { seedState } from "./seed";

const ROT = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg"];

export default function Home() {
  const { state, set, select, nav, syncStatus, queue, toast, setFocus } = useStore();
  const [tipHidden, setTipHidden] = useState(() => localStorage.getItem("yanchi.tip") === "1");

  const live = useMemo(() => state.prompts.filter((p) => !p.deletedAt), [state.prompts]);
  const recentEdit = useMemo(() => [...live].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [live]);
  const recentUsed = useMemo(() => [...live].filter((p) => p.lastUsedAt).sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0)).slice(0, 6), [live]);
  const pendingTest = useMemo(() => live.filter((p) => p.tagIds.some((t) => state.tags.find((x) => x.id === t)?.name === "待测试")).slice(0, 5), [live, state.tags]);
  const favs = useMemo(() => live.filter((p) => p.favorite).slice(0, 6), [live]);

  const hour = new Date().getHours();
  const greet = hour < 5 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const totalUse = live.reduce((s, p) => s + p.useCount, 0);

  const hideTip = () => { localStorage.setItem("yanchi.tip", "1"); setTipHidden(true); };

  const openPrompt = (id: string) => { select(id); setFocus(true); };

  if (state.vaults.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="card w-full max-w-[520px] p-8 text-center">
          <div className="seal-stamp mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] font-black">砚</div>
          <h1 className="title-serif mb-2 text-[22px] font-black">创建你的第一个提示词仓库</h1>
          <p className="mx-auto mb-6 max-w-[380px] text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            砚池把散落在聊天记录、文档与收藏夹里的提示词收拢成可打磨的资产。数据默认保存在本机浏览器，不上传任何云端。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="btn btn-primary" onClick={() => loadSample()}>
              <Icon name="sparkle" size={14} /> 一键载入示例工作台
            </button>
            <button className="btn" onClick={() => nav({ name: "vaults" })}>
              <Icon name="plus" size={14} /> 从空白仓库开始
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span className="flex items-center gap-1.5"><Icon name="doc" size={12} /> 本机保存</span>
            <span className="flex items-center gap-1.5"><Icon name="download" size={12} /> 随时导出备份</span>
            <span className="flex items-center gap-1.5"><Icon name="wifi" size={12} /> 同步可选</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1060px] px-7 pb-16 pt-8">
        {/* 页头 */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="engrave mb-1 text-[11px] tracking-[0.25em]">
                {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
              </div>
              <h1 className="title-serif text-[30px] font-black leading-tight">
                {greet}，来打磨几条提示词
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {[
                { n: live.length, l: "在库资产" },
                { n: totalUse, l: "累计使用" },
                { n: favs.length, l: "收藏" },
              ].map((s) => (
                <div key={s.l} className="text-right">
                  <div className="title-serif text-[26px] font-black leading-none tabular-nums" style={{ color: "var(--brass)" }}>{s.n}</div>
                  <div className="engrave mt-1 text-[10.5px] tracking-[0.2em]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 示例数据提示 */}
        {!tipHidden && (
          <Reveal delay={80}>
            <div className="card mt-6 flex flex-wrap items-center gap-3 border-l-4 px-4 py-3" style={{ borderLeftColor: "var(--brass-2)" }}>
              <span className="flex-none" style={{ color: "var(--brass)" }}><Icon name="sparkle" size={15} /></span>
              <div className="min-w-0 flex-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
                这是一份示例工作台，包含 Agent、对话、生图与视频模板，可随意修改感受顺手程度。
              </div>
              <button className="btn btn-ghost !py-[6px]" onClick={hideTip}>知道了</button>
              <button className="btn btn-ghost !py-[6px] !text-[var(--err)]" onClick={clearSample}>清空，从空白开始</button>
            </div>
          </Reveal>
        )}

        {/* 散落明信片：继续打磨 */}
        <section className="mt-9">
          <SectionTitle right={
            <button className="btn btn-ghost !py-[5px] !text-[12px]" onClick={() => nav({ name: "list", smart: "recent-edit" })}>
              全部最近编辑 <Icon name="chevR" size={12} />
            </button>
          }>继续打磨</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentEdit.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <div className="scatter card card-hover relative cursor-pointer p-4 pt-5"
                  style={{ transform: `rotate(${ROT[i % 4]})` }}
                  onClick={() => openPrompt(p.id)}>
                  <span className="absolute -top-[7px] left-1/2 h-[14px] w-[14px] -translate-x-1/2 rounded-full border-2"
                    style={{ background: "radial-gradient(circle at 35% 30%, #e5cf9a, #a3803a)", borderColor: "#8f6e2e", boxShadow: "0 2px 4px rgba(84,64,34,0.4)" }} />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <TypeBadge type={p.type} size="sm" />
                    <span className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>{timeAgo(p.updatedAt)}</span>
                  </div>
                  <div className="title-serif mb-1.5 truncate text-[15px] font-bold">{p.title}</div>
                  <p className="mb-3 line-clamp-2 min-h-[34px] text-[11.5px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                    {p.summary || p.body.slice(0, 60) || TYPE_META[p.type].blurb}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>用过 {p.useCount} 次</span>
                    <button className="icon-btn" title="复制最终 Prompt"
                      onClick={async (e) => { e.stopPropagation(); if (await copyText(composePrompt(p, {}))) toast("ok", "已复制最终 Prompt"); }}>
                      <Icon name="copy" size={13} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-10">
            {/* 类型快捷入口 */}
            <section>
              <SectionTitle>按类型开始</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TYPE_ORDER.map((t, i) => {
                  const m = TYPE_META[t];
                  const n = live.filter((p) => p.type === t).length;
                  return (
                    <Reveal key={t} delay={i * 60}>
                      <button className="card card-hover group w-full p-4 text-left"
                        onClick={() => createByType(t)}>
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] border transition-transform group-hover:-rotate-6"
                          style={{ color: m.color, borderColor: "color-mix(in srgb, " + m.color + " 40%, var(--line))", background: "color-mix(in srgb, " + m.color + " 10%, var(--card))", boxShadow: "var(--inset)" }}>
                          <Icon name={m.icon} size={17} />
                        </div>
                        <div className="title-serif text-[15px] font-bold">{m.label}</div>
                        <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>{m.blurb}</div>
                        <div className="mt-2 text-[10.5px] tabular-nums" style={{ color: m.color }}>{n} 条在库</div>
                      </button>
                    </Reveal>
                  );
                })}
                <Reveal delay={320}>
                  <button className="card card-hover flex w-full flex-col items-start justify-between border-dashed p-4 text-left"
                    style={{ borderStyle: "dashed" }} onClick={() => nav({ name: "vaults" })}>
                    <Icon name="grid" size={17} className="mb-3 opacity-60" />
                    <div>
                      <div className="title-serif text-[15px] font-bold">仓库总览</div>
                      <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>管理空间 · 分组 · 标签</div>
                    </div>
                  </button>
                </Reveal>
              </div>
            </section>

            {/* 最近使用 */}
            <section>
              <SectionTitle right={
                <button className="btn btn-ghost !py-[5px] !text-[12px]" onClick={() => nav({ name: "list", smart: "recent-used" })}>
                  更多 <Icon name="chevR" size={12} />
                </button>
              }>最近使用</SectionTitle>
              {recentUsed.length === 0 ? (
                <div className="card px-5 py-6 text-center text-[12.5px]" style={{ color: "var(--ink-3)" }}>
                  还没有使用记录。打开一条提示词，点「试运行」就会记在这里。
                </div>
              ) : (
                <div className="card divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
                  {recentUsed.map((p) => (
                    <button key={p.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(84,64,34,0.045)]"
                      style={{ borderColor: "var(--line)" }} onClick={() => openPrompt(p.id)}>
                      <TypeBadge type={p.type} text={false} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                      <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{p.useCount} 次 · {timeAgo(p.lastUsedAt)}</span>
                      <Icon name="chevR" size={12} className="opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右栏 */}
          <div className="space-y-6">
            <Reveal delay={120}>
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="title-serif text-[13.5px] font-bold">同步状态</span>
                  <SyncDot status={syncStatus} />
                </div>
                <div className="space-y-1.5 text-[11.5px]" style={{ color: "var(--ink-2)" }}>
                  <div className="flex justify-between"><span>本机设备</span><span className="font-medium text-[var(--ink)]">{state.settings.deviceName}</span></div>
                  <div className="flex justify-between gap-3"><span>WebSocket</span><span className="max-w-[150px] truncate">{state.settings.wsUrl || "未配置"}</span></div>
                  {queue.length > 0 && <div style={{ color: "var(--warn)" }}>{queue.length} 条修改等待同步</div>}
                </div>
                <button className="btn mt-3.5 w-full !py-[7px] !text-[12px]" onClick={() => nav({ name: "sync" })}>
                  <Icon name="sync" size={13} /> 打开同步中心
                </button>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div>
                <SectionTitle>待测试</SectionTitle>
                {pendingTest.length === 0 ? (
                  <div className="card px-4 py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>没有待测试的草稿，一切就绪。</div>
                ) : (
                  <div className="space-y-2">
                    {pendingTest.map((p) => (
                      <button key={p.id} className="card card-hover flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left" onClick={() => openPrompt(p.id)}>
                        <span className="dot" style={{ background: "var(--warn)" }} />
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{p.title}</span>
                        <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>{timeAgo(p.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div>
                <SectionTitle>仓库一览</SectionTitle>
                <div className="space-y-2">
                  {state.vaults.map((v) => {
                    const n = live.filter((p) => p.vaultId === v.id).length;
                    return (
                      <button key={v.id} className="card card-hover flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left" onClick={() => nav({ name: "list", vaultId: v.id })}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: v.color, background: "color-mix(in srgb, " + v.color + " 12%, var(--card))" }}>
                          <Icon name={v.icon} size={13} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{v.name}</span>
                        <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );

  function createByType(t: keyof typeof TYPE_META) {
    const vaultId =
      t === "agent" ? state.vaults.find((v) => v.id === "v-agent")?.id :
      t === "image" ? state.vaults.find((v) => v.id === "v-image")?.id :
      t === "video" ? state.vaults.find((v) => v.id === "v-video")?.id :
      state.vaults[0]?.id;
    if (!vaultId) { toast("warn", "请先创建一个仓库"); return; }
    const p = np(vaultId, t, "未命名" + TYPE_META[t].label + "提示词");
    set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
    select(p.id); setFocus(true);
  }

  function loadSample() {
    set(() => seedState());
    toast("ok", "示例工作台已载入");
  }
  function clearSample() {
    set((s) => ({ ...s, vaults: [], groups: [], tags: [], prompts: [] }));
    toast("info", "已清空，从空白开始");
  }
}
