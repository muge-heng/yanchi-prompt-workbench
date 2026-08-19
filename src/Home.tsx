import { useMemo, useState } from "react";
import { useStore, newPrompt as np } from "./store";
import { cx, timeAgo, allTypes, getTypeDef, getLang, tl, tb, tt, composePrompt, copyText } from "./lib";
import { Icon, Reveal, SectionTitle, TypeBadge, SyncDot } from "./ui";
import { seedState } from "./seed";

const ROT = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg"];

export default function Home() {
  const { state, set, select, nav, syncStatus, queue, toast, setFocus } = useStore();
  const [tipHidden, setTipHidden] = useState(() => localStorage.getItem("yanchi.tip") === "1");
  const en = getLang() === "en";

  const live = useMemo(() => state.prompts.filter((p) => !p.deletedAt), [state.prompts]);
  const recentEdit = useMemo(() => [...live].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [live]);
  const recentUsed = useMemo(() => [...live].filter((p) => p.lastUsedAt).sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0)).slice(0, 6), [live]);
  const pendingTest = useMemo(() => live.filter((p) => p.tagIds.some((t) => /待测试|to.?test/i.test(state.tags.find((x) => x.id === t)?.name || ""))).slice(0, 5), [live, state.tags]);
  const favs = useMemo(() => live.filter((p) => p.favorite).slice(0, 6), [live]);

  const hour = new Date().getHours();
  const greet = hour < 5 ? tt("夜深了", "Late night") : hour < 11 ? tt("早上好", "Good morning") : hour < 14 ? tt("中午好", "Good noon") : hour < 18 ? tt("下午好", "Good afternoon") : tt("晚上好", "Good evening");
  const totalUse = live.reduce((s, p) => s + p.useCount, 0);

  const hideTip = () => { localStorage.setItem("yanchi.tip", "1"); setTipHidden(true); };
  const openPrompt = (id: string) => { select(id); setFocus(true); };

  if (state.vaults.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="card w-full max-w-[520px] p-8 text-center">
          <div className="seal-stamp mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] font-black">砚</div>
          <h1 className="title-serif mb-2 text-[22px] font-black">{tt("创建你的第一个提示词仓库", "Create your first prompt vault")}</h1>
          <p className="mx-auto mb-6 max-w-[380px] text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {tt("砚池把散落在聊天记录、文档与收藏夹里的提示词收拢成可打磨的资产。数据默认保存在本机浏览器，不上传任何云端。",
              "Yanchi gathers the prompts scattered across chats, docs and bookmarks into assets you can refine. Data stays in this browser by default and is never uploaded.")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="btn btn-primary" onClick={() => loadSample()}>
              <Icon name="sparkle" size={14} /> {tt("一键载入示例工作台", "Load the sample workbench")}
            </button>
            <button className="btn" onClick={() => nav({ name: "vaults" })}>
              <Icon name="plus" size={14} /> {tt("从空白仓库开始", "Start from an empty vault")}
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span className="flex items-center gap-1.5"><Icon name="doc" size={12} /> {tt("本机保存", "Stored locally")}</span>
            <span className="flex items-center gap-1.5"><Icon name="download" size={12} /> {tt("随时导出备份", "Export backups anytime")}</span>
            <span className="flex items-center gap-1.5"><Icon name="wifi" size={12} /> {tt("同步可选", "Sync is optional")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1060px] px-7 pb-16 pt-8">
        {/* 页头 Header */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="engrave mb-1 text-[11px] tracking-[0.25em]">
                {new Date().toLocaleDateString(en ? "en-US" : "zh-CN", { month: "long", day: "numeric", weekday: "long" })}
              </div>
              <h1 className="title-serif text-[30px] font-black leading-tight">
                {greet}{tt("，来打磨几条提示词", " — let's polish a few prompts")}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {([
                { n: live.length, l: tt("在库资产", "Assets") },
                { n: totalUse, l: tt("累计使用", "Total uses") },
                { n: favs.length, l: tt("收藏", "Favorites") },
              ] as { n: number; l: string }[]).map((s) => (
                <div key={s.l} className="text-right">
                  <div className="title-serif text-[26px] font-black leading-none tabular-nums" style={{ color: "var(--brass)" }}>{s.n}</div>
                  <div className="engrave mt-1 text-[10.5px] tracking-[0.2em]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 示例数据提示 Sample data notice */}
        {!tipHidden && (
          <Reveal delay={80}>
            <div className="card mt-6 flex flex-wrap items-center gap-3 border-l-4 px-4 py-3" style={{ borderLeftColor: "var(--brass-2)" }}>
              <span className="flex-none" style={{ color: "var(--brass)" }}><Icon name="sparkle" size={15} /></span>
              <div className="min-w-0 flex-1 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
                {tt("这是一份示例工作台，包含 Agent、对话、生图与视频模板，可随意修改感受顺手程度。",
                  "This is a sample workbench with Agent, chat, image and video templates. Edit freely to get a feel for it.")}
              </div>
              <button className="btn btn-ghost !py-[6px]" onClick={hideTip}>{tt("知道了", "Got it")}</button>
              <button className="btn btn-ghost !py-[6px] !text-[var(--err)]" onClick={clearSample}>{tt("清空，从空白开始", "Clear & start blank")}</button>
            </div>
          </Reveal>
        )}

        {/* 散落明信片：继续打磨 Scattered postcards: keep polishing */}
        <section className="mt-9">
          <SectionTitle right={
            <button className="btn btn-ghost !py-[5px] !text-[12px]" onClick={() => nav({ name: "list", smart: "recent-edit" })}>
              {tt("全部最近编辑", "All recent edits")} <Icon name="chevR" size={12} />
            </button>
          }>{tt("继续打磨", "Keep polishing")}</SectionTitle>
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
                    {p.summary || p.body.slice(0, 60) || tb(getTypeDef(p.type))}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{p.useCount} {tt("次使用", "uses")}</span>
                    <button className="icon-btn" title={tt("复制最终 Prompt", "Copy final prompt")}
                      onClick={async (e) => { e.stopPropagation(); if (await copyText(composePrompt(p, {}))) toast("ok", tt("已复制最终 Prompt", "Final prompt copied")); }}>
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
            {/* 类型快捷入口 Type quick entries */}
            <section>
              <SectionTitle>{tt("按类型开始", "Start by type")}</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {allTypes().map((t, i) => {
                  const n = live.filter((p) => p.type === t.id).length;
                  return (
                    <Reveal key={t.id} delay={i * 60}>
                      <button className="card card-hover group w-full p-4 text-left"
                        onClick={() => createByType(t.id)}>
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] border transition-transform group-hover:-rotate-6"
                          style={{ color: t.color, borderColor: "color-mix(in srgb, " + t.color + " 40%, var(--line))", background: "color-mix(in srgb, " + t.color + " 10%, var(--card))", boxShadow: "var(--inset)" }}>
                          <Icon name={t.icon} size={17} />
                        </div>
                        <div className="title-serif text-[15px] font-bold">{tl(t)}</div>
                        <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>{tb(t)}</div>
                        <div className="mt-2 text-[10.5px] tabular-nums" style={{ color: t.color }}>{n} {tt("条在库", "items")}</div>
                      </button>
                    </Reveal>
                  );
                })}
                <Reveal delay={320}>
                  <button className="card card-hover flex w-full flex-col items-start justify-between border-dashed p-4 text-left"
                    style={{ borderStyle: "dashed" }} onClick={() => nav({ name: "vaults" })}>
                    <Icon name="grid" size={17} className="mb-3 opacity-60" />
                    <div>
                      <div className="title-serif text-[15px] font-bold">{tt("仓库总览", "All vaults")}</div>
                      <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>{tt("管理空间 · 分组 · 标签", "Spaces · groups · tags")}</div>
                    </div>
                  </button>
                </Reveal>
              </div>
            </section>

            {/* 最近使用 Recently used */}
            <section>
              <SectionTitle right={
                <button className="btn btn-ghost !py-[5px] !text-[12px]" onClick={() => nav({ name: "list", smart: "recent-used" })}>
                  {tt("更多", "More")} <Icon name="chevR" size={12} />
                </button>
              }>{tt("最近使用", "Recently used")}</SectionTitle>
              {recentUsed.length === 0 ? (
                <div className="card px-5 py-6 text-center text-[12.5px]" style={{ color: "var(--ink-3)" }}>
                  {tt("还没有使用记录。打开一条提示词，点「试运行」就会记在这里。", "No usage yet. Open a prompt and hit “Trial run” — it will be logged here.")}
                </div>
              ) : (
                <div className="card divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
                  {recentUsed.map((p) => (
                    <button key={p.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(84,64,34,0.045)]"
                      style={{ borderColor: "var(--line)" }} onClick={() => openPrompt(p.id)}>
                      <TypeBadge type={p.type} text={false} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                      <span className="text-[10.5px] tabular-nums" style={{ color: "var(--ink-3)" }}>{p.useCount} {tt("次", "×")} · {timeAgo(p.lastUsedAt)}</span>
                      <Icon name="chevR" size={12} className="opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右栏 Right column */}
          <div className="space-y-6">
            <Reveal delay={120}>
              <div className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="title-serif text-[13.5px] font-bold">{tt("同步状态", "Sync status")}</span>
                  <SyncDot status={syncStatus} />
                </div>
                <div className="space-y-1.5 text-[11.5px]" style={{ color: "var(--ink-2)" }}>
                  <div className="flex justify-between"><span>{tt("本机设备", "This device")}</span><span className="font-medium text-[var(--ink)]">{state.settings.deviceName}</span></div>
                  <div className="flex justify-between gap-3"><span>WebSocket</span><span className="max-w-[150px] truncate">{state.settings.wsUrl || tt("未配置", "Not set")}</span></div>
                  {queue.length > 0 && <div style={{ color: "var(--warn)" }}>{queue.length} {tt("条修改等待同步", "changes awaiting sync")}</div>}
                </div>
                <button className="btn mt-3.5 w-full !py-[7px] !text-[12px]" onClick={() => nav({ name: "sync" })}>
                  <Icon name="sync" size={13} /> {tt("打开同步中心", "Open Sync Center")}
                </button>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div>
                <SectionTitle>{tt("待测试", "To test")}</SectionTitle>
                {pendingTest.length === 0 ? (
                  <div className="card px-4 py-5 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>{tt("没有待测试的草稿，一切就绪。", "No drafts waiting to be tested. All set.")}</div>
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
                <SectionTitle>{tt("仓库一览", "Vaults at a glance")}</SectionTitle>
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

  function createByType(id: string) {
    const def = getTypeDef(id);
    const vaultId =
      def.mode === "agent" ? state.vaults.find((v) => v.id === "v-agent")?.id :
      def.mode === "image" ? state.vaults.find((v) => v.id === "v-image")?.id :
      def.mode === "video" ? state.vaults.find((v) => v.id === "v-video")?.id :
      state.vaults[0]?.id;
    if (!vaultId) { toast("warn", tt("请先创建一个仓库", "Please create a vault first")); return; }
    const p = np(vaultId, id, tt("未命名", "Untitled ") + tl(def) + tt("提示词", " prompt"));
    set((s) => ({ ...s, prompts: [p, ...s.prompts] }));
    select(p.id); setFocus(true);
  }

  function loadSample() {
    set(() => seedState(getLang()));
    toast("ok", tt("示例工作台已载入", "Sample workbench loaded"));
  }
  function clearSample() {
    set((s) => ({ ...s, vaults: [], groups: [], tags: [], prompts: [] }));
    toast("info", tt("已清空，从空白开始", "Cleared. Starting fresh."));
  }
}
