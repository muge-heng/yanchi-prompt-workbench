/* ========= 砚池 · 数据模型与提示词合成引擎 ========= */

export type PromptType = "agent" | "chat" | "image" | "video" | "custom";
export type Role = "system" | "user" | "assistant";

export interface ChatMsg { id: string; role: Role; content: string }
export interface Shot { id: string; label: string; content: string; secs: string }
export interface VarPreset { id: string; name: string; values: Record<string, string> }
export interface Version { id: string; at: number; label: string; body: string; fields: Record<string, any>; negative: string }
export interface DebugRun { id: string; at: number; final: string; values: Record<string, string>; copied: boolean; sent: boolean; note: string }

export interface Prompt {
  id: string; vaultId: string; groupId?: string; type: PromptType;
  title: string; summary: string; body: string; negative: string;
  fields: Record<string, any>;
  params: Record<string, string>;
  tagIds: string[]; favorite: boolean; pinned: boolean; deletedAt: number | null;
  useCount: number; lastUsedAt: number | null; lastDebugAt: number | null;
  createdAt: number; updatedAt: number;
  presets: VarPreset[]; versions: Version[]; runs: DebugRun[];
  sync: "local" | "synced" | "pending";
}

export interface Group { id: string; vaultId: string; name: string; order: number }
export interface Tag { id: string; name: string; color: string }
export interface Vault {
  id: string; name: string; icon: string; desc: string; color: string;
  createdAt: number; updatedAt: number; syncOn: boolean;
}

export interface Settings {
  deviceName: string; wsUrl: string; ns: string; autoSync: boolean;
  scope: "all" | "fav" | "norefuse" | "current";
  apiUrl: string; apiKey: string; apiModel: string;
  reduceMotion: boolean; saveFlash: boolean; compactList: boolean;
}

export interface AppState {
  vaults: Vault[]; groups: Group[]; tags: Tag[]; prompts: Prompt[];
  settings: Settings; welcomed: boolean;
}

/* ---------- 类型结构 ---------- */
export interface FieldDef { key: string; label: string; kind: "text" | "area" | "chat" | "shots"; hint?: string; quick?: string[] }
export interface TypeMeta { label: string; en: string; color: string; icon: string; blurb: string; fields: FieldDef[]; params: { key: string; label: string; ph?: string }[] }

export const TYPE_META: Record<PromptType, TypeMeta> = {
  agent: {
    label: "Agent", en: "Agent", color: "var(--moss)", icon: "agent",
    blurb: "智能体 · 系统指令 · 角色扮演",
    fields: [
      { key: "role", label: "角色设定", kind: "area", hint: "它是谁、擅长什么、以什么口吻说话" },
      { key: "abilities", label: "能力边界", kind: "area", hint: "能做什么、不能做什么" },
      { key: "tools", label: "工具描述", kind: "area", hint: "可调用工具的名称与用途" },
      { key: "toolRules", label: "工具调用规则", kind: "area", hint: "何时调用、参数约束、失败处理" },
      { key: "memory", label: "记忆策略", kind: "area", hint: "记住什么、遗忘什么、上下文长度" },
      { key: "output", label: "输出格式", kind: "text", hint: "如：JSON / Markdown / 分点" },
      { key: "forbidden", label: "禁止事项", kind: "area", hint: "红线清单" },
      { key: "examples", label: "示例对话", kind: "chat", hint: "Few-shot 示例，越具体越好" },
    ],
    params: [
      { key: "model", label: "模型", ph: "gpt-4o / claude…" },
      { key: "temperature", label: "温度", ph: "0.7" },
      { key: "topP", label: "Top P", ph: "0.9" },
      { key: "maxTokens", label: "Max Tokens", ph: "2048" },
    ],
  },
  chat: {
    label: "Chat", en: "Chat", color: "var(--slate)", icon: "chat",
    blurb: "对话模板 · 多轮话术 · 写作对话",
    fields: [
      { key: "goal", label: "对话目标", kind: "text", hint: "这组对话想达成什么" },
      { key: "system", label: "系统提示", kind: "area", hint: "对话开始前注入的设定" },
      { key: "firstUser", label: "用户首条消息", kind: "area", hint: "对话的第一句" },
      { key: "turns", label: "预设多轮消息", kind: "chat", hint: "按顺序排列的 user / assistant 消息" },
      { key: "style", label: "风格要求", kind: "text", hint: "如：克制、幽默、学术" },
      { key: "tone", label: "语气要求", kind: "text", hint: "如：第二人称、温和坚定" },
      { key: "length", label: "长度要求", kind: "text", hint: "如：300 字以内" },
      { key: "taboo", label: "禁忌项", kind: "area", hint: "不要出现的词、句式、话题" },
      { key: "output", label: "输出格式", kind: "text" },
    ],
    params: [
      { key: "model", label: "模型" },
      { key: "temperature", label: "温度", ph: "0.8" },
      { key: "maxTokens", label: "Max Tokens", ph: "1024" },
    ],
  },
  image: {
    label: "生图", en: "Image", color: "var(--clay)", icon: "image",
    blurb: "文生图 · 海报 · 电商 · 插画",
    fields: [
      { key: "subject", label: "主体描述", kind: "area", hint: "画面的核心对象" },
      { key: "style", label: "风格", kind: "text", quick: ["电影感", "日系清新", "极简构图", "胶片质感", "水墨留白", "电商白底"] },
      { key: "composition", label: "构图", kind: "text", quick: ["居中对称", "三分法", "俯视平铺", "大特写", "留白构图"] },
      { key: "lighting", label: "光影", kind: "text", quick: ["柔和光", "黄昏逆光", "侧逆轮廓光", "棚拍匀光", "烛光暖调"] },
      { key: "camera", label: "镜头", kind: "text", quick: ["35mm", "85mm 人像", "微距", "广角低机位", "长焦压缩"] },
      { key: "color", label: "色彩", kind: "text", quick: ["低饱和", "莫兰迪", "暖调", "黑白"] },
      { key: "texture", label: "质感", kind: "text", quick: ["磨砂颗粒", "丝绸光泽", "陶土肌理", "纸质纹理"] },
      { key: "detail", label: "细节增强", kind: "area", hint: "材质、高光、边缘等细节补充" },
      { key: "lora", label: "LoRA / ControlNet 备注", kind: "text" },
      { key: "ref", label: "参考图说明", kind: "text" },
    ],
    params: [
      { key: "ratio", label: "比例", ph: "1:1 / 3:4 / 16:9" },
      { key: "resolution", label: "分辨率", ph: "1024×1024" },
      { key: "seed", label: "Seed", ph: "随机" },
      { key: "model", label: "模型偏好", ph: "SDXL / MJ v6…" },
    ],
  },
  video: {
    label: "生视频", en: "Video", color: "var(--plum)", icon: "video",
    blurb: "文生视频 · 镜头脚本 · 动态",
    fields: [
      { key: "theme", label: "视频主题", kind: "text" },
      { key: "firstFrame", label: "首帧描述", kind: "area", hint: "开场画面" },
      { key: "lastFrame", label: "尾帧描述", kind: "area", hint: "结束画面（可选）" },
      { key: "motion", label: "运动方式", kind: "text", quick: ["缓慢推近", "环绕拍摄", "手持跟随", "横向平移", "升格慢动作", "延时"] },
      { key: "camera", label: "镜头语言", kind: "text", quick: ["特写", "广角", "长焦", "航拍俯瞰", "过肩镜头"] },
      { key: "rhythm", label: "节奏", kind: "text", quick: ["舒缓", "紧凑卡点", "渐快"] },
      { key: "light", label: "光影氛围", kind: "text", quick: ["黄昏暖调", "冷调清晨", "舞台聚光", "窗边自然光"] },
      { key: "transition", label: "场景转换", kind: "text", quick: ["硬切", "叠化", "匹配剪辑", "黑场过渡"] },
      { key: "shots", label: "分镜列表", kind: "shots", hint: "把视频拆成一个个镜头" },
    ],
    params: [
      { key: "duration", label: "时长", ph: "5s / 10s / 30s" },
      { key: "ratio", label: "比例", ph: "16:9 / 9:16" },
      { key: "fps", label: "帧率偏好", ph: "24fps 电影感" },
      { key: "model", label: "模型偏好", ph: "Kling / Sora…" },
    ],
  },
  custom: {
    label: "自定义", en: "Custom", color: "var(--sand)", icon: "doc",
    blurb: "写作 · 翻译 · 代码 · 任意结构",
    fields: [],
    params: [
      { key: "model", label: "模型" },
      { key: "temperature", label: "温度" },
      { key: "maxTokens", label: "Max Tokens" },
    ],
  },
};

export const TYPE_ORDER: PromptType[] = ["agent", "chat", "image", "video", "custom"];

export const TAG_COLORS = ["var(--moss)", "var(--slate)", "var(--clay)", "var(--plum)", "var(--sand)", "var(--seal)", "var(--brass)", "var(--ok)"];

/* ---------- 小工具 ---------- */
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

export function timeAgo(ts: number | null | undefined): string {
  if (!ts) return "从未";
  const d = Date.now() - ts;
  const m = 60_000, h = 3_600_000, day = 86_400_000;
  if (d < m) return "刚刚";
  if (d < h) return `${Math.floor(d / m)} 分钟前`;
  if (d < day) return `${Math.floor(d / h)} 小时前`;
  if (d < 7 * day) return `${Math.floor(d / day)} 天前`;
  return fmtDate(ts);
}
export function fmtDate(ts: number): string {
  const t = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
}
export function fmtClock(ts: number): string {
  const t = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
}

/* ---------- 变量系统 ---------- */
export function extractVars(p: Prompt): string[] {
  const texts: string[] = [p.body, p.negative, p.summary];
  Object.values(p.fields).forEach((v) => {
    if (typeof v === "string") texts.push(v);
    if (Array.isArray(v)) v.forEach((m: any) => { if (m && typeof m.content === "string") texts.push(m.content); });
  });
  const found: string[] = [];
  texts.forEach((t) => {
    const ms = t.match(/\{\{\s*([^{}]+?)\s*\}\}/g) || [];
    ms.forEach((m) => {
      const k = m.replace(/\{\{|\}\}/g, "").trim();
      if (k && !found.includes(k)) found.push(k);
    });
  });
  return found;
}
export function fillVars(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (m, k) => {
    const v = values[k.trim()];
    return v === undefined || v === "" ? m : v;
  });
}

/* ---------- 最终 Prompt 合成 ---------- */
const sec = (label: string, content: string) => (content && content.trim() ? `【${label}】\n${content.trim()}` : "");
const line = (label: string, content: string) => (content && content.trim() ? `${label}：${content.trim()}` : "");
const roleLabel: Record<Role, string> = { system: "系统", user: "用户", assistant: "助手" };

export function composePrompt(p: Prompt, values: Record<string, string>): string {
  const f = p.fields;
  const parts: string[] = [];
  if (p.type === "agent") {
    if (p.body.trim()) parts.push(p.body.trim());
    ["role", "abilities", "tools", "toolRules", "memory", "forbidden"].forEach((k) => {
      const def = TYPE_META.agent.fields.find((d) => d.key === k)!;
      const s = sec(def.label, f[k] || "");
      if (s) parts.push(s);
    });
    if (f.output) parts.push(line("输出格式", f.output));
    const ex: ChatMsg[] = f.examples || [];
    if (ex.length) parts.push("【示例对话】\n" + ex.map((m) => `${roleLabel[m.role]}：${m.content}`).join("\n"));
  } else if (p.type === "chat") {
    if (f.system) parts.push(sec("系统", f.system));
    const msgs: ChatMsg[] = [];
    if (f.firstUser) msgs.push({ id: "fu", role: "user", content: f.firstUser });
    (f.turns || []).forEach((m: ChatMsg) => msgs.push(m));
    if (msgs.length) parts.push("【对话结构】\n" + msgs.map((m) => `${roleLabel[m.role]}：${m.content}`).join("\n\n"));
    ["goal", "style", "tone", "length", "output"].forEach((k) => {
      const def = TYPE_META.chat.fields.find((d) => d.key === k)!;
      const s = line(def.label, f[k] || "");
      if (s) parts.push(s);
    });
    if (f.taboo) parts.push(sec("禁忌项", f.taboo));
    if (p.body.trim()) parts.push(p.body.trim());
  } else if (p.type === "image") {
    const bits: string[] = [];
    ["subject", "style", "composition", "lighting", "camera", "color", "texture", "detail"].forEach((k) => {
      const v = (f[k] || "").toString().trim();
      if (v) bits.push(v);
    });
    parts.push(bits.join("，"));
    if (p.body.trim()) parts.push(p.body.trim());
  } else if (p.type === "video") {
    const bits: string[] = [];
    if (f.theme) bits.push(line("主题", f.theme));
    if (f.firstFrame) bits.push(line("首帧", f.firstFrame));
    if (f.lastFrame) bits.push(line("尾帧", f.lastFrame));
    if (f.motion) bits.push(line("运动", f.motion));
    if (f.camera) bits.push(line("镜头", f.camera));
    if (f.rhythm) bits.push(line("节奏", f.rhythm));
    if (f.light) bits.push(line("光影氛围", f.light));
    if (f.transition) bits.push(line("转场", f.transition));
    const shots: Shot[] = f.shots || [];
    if (shots.length) bits.push("【分镜】\n" + shots.map((s, i) => `镜头${i + 1}（${s.secs || "3s"}${s.label ? " · " + s.label : ""}）：${s.content}`).join("\n"));
    if (p.body.trim()) bits.push(p.body.trim());
    parts.push(bits.filter(Boolean).join("\n"));
  } else {
    parts.push(p.body.trim());
  }
  return fillVars(parts.filter((x) => x && x.trim()).join("\n\n"), values);
}

/** 生图：三种复制格式 */
export function imageFormats(p: Prompt, values: Record<string, string>): { name: string; text: string }[] {
  const f = p.fields;
  const bits = ["subject", "style", "composition", "lighting", "camera", "color", "texture", "detail"]
    .map((k) => ((f[k] || "").toString().trim()))
    .filter(Boolean);
  const plain = fillVars([...bits, p.body.trim()].filter(Boolean).join("，"), values);
  const paramBits: string[] = [];
  if (p.params.ratio) paramBits.push(`--ar ${p.params.ratio}`);
  if (p.params.seed) paramBits.push(`--seed ${p.params.seed}`);
  if (p.params.resolution) paramBits.push(`--size ${p.params.resolution}`);
  const withParams = [plain, paramBits.join(" "), p.negative.trim() ? `--no ${fillVars(p.negative.trim(), values)}` : ""].filter(Boolean).join("\n");
  const perField = fillVars(
    ["subject", "style", "composition", "lighting", "camera", "color", "texture", "detail"]
      .map((k) => {
        const def = TYPE_META.image.fields.find((d) => d.key === k)!;
        const v = (f[k] || "").toString().trim();
        return v ? `${def.label}：${v}` : "";
      })
      .filter(Boolean)
      .join("\n") + (p.negative.trim() ? `\n负面提示：${p.negative.trim()}` : ""),
    values
  );
  return [
    { name: "纯文本", text: plain },
    { name: "带参数", text: withParams },
    { name: "分字段", text: perField },
  ];
}

/** 生视频：三种复制格式 */
export function videoFormats(p: Prompt, values: Record<string, string>): { name: string; text: string }[] {
  const f = p.fields;
  const brief = fillVars([f.theme, f.firstFrame, f.motion].filter((x: any) => x && x.trim()).join("，"), values);
  const full = composePrompt(p, values);
  const shots: Shot[] = f.shots || [];
  const pro = fillVars(
    [
      line("THEME", f.theme || ""), line("OPEN", f.firstFrame || ""), line("END", f.lastFrame || ""),
      line("MOVEMENT", f.motion || ""), line("LENS", f.camera || ""), line("PACE", f.rhythm || ""),
      line("LIGHT", f.light || ""), line("CUT", f.transition || ""),
      p.params.duration ? `DURATION：${p.params.duration}` : "", p.params.ratio ? `RATIO：${p.params.ratio}` : "", p.params.fps ? `FPS：${p.params.fps}` : "",
      shots.length ? "SHOTS：\n" + shots.map((s, i) => `  ${String(i + 1).padStart(2, "0")} [${s.secs || "3s"}] ${s.content}`).join("\n") : "",
    ].filter(Boolean).join("\n"),
    values
  );
  return [
    { name: "简洁版", text: brief },
    { name: "详细版", text: full },
    { name: "专业版", text: pro },
  ];
}

export function paramSummary(p: Prompt): string {
  const meta = TYPE_META[p.type];
  return meta.params.filter((k) => p.params[k.key]).map((k) => `${k.label} ${p.params[k.key]}`).join(" · ");
}

/* ---------- 剪贴板与文件 ---------- */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
      return true;
    } catch { return false; }
  }
}

export function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function makeBackup(state: AppState, prompts: Prompt[], withVersions: boolean) {
  const clean = prompts.map((p) => ({ ...p, runs: withVersions ? p.runs : [], versions: withVersions ? p.versions : [] }));
  return {
    app: "yanchi-prompt-vault", format: 1,
    exportedAt: new Date().toISOString(),
    count: clean.length,
    vaults: state.vaults.filter((v) => clean.some((p) => p.vaultId === v.id)),
    groups: state.groups.filter((g) => clean.some((p) => p.vaultId === g.vaultId)),
    tags: state.tags.filter((t) => clean.some((p) => p.tagIds.includes(t.id))),
    prompts: clean,
  };
}
