/* ============================================================
 * 砚池 · 数据模型 / 类型系统 / 合成引擎 / 内联国际化
 * Yanchi · data model, type system, prompt composer, inline i18n
 * ============================================================ */

/* ---------- 语言 Language ---------- */
export type Lang = "zh" | "en";

/** 全局当前语言（由 store 同步写入）。Global current language, kept in sync by the store. */
let LANG: Lang = "zh";
export const setLang = (l: Lang) => { LANG = l; };
export const getLang = (): Lang => LANG;

/** 内联翻译：中文优先时返回 zh，英文时返回 en。Inline translator. */
export const tt = (zh: string, en: string): string => (LANG === "en" ? en : zh);

/* ---------- 类型系统 Type system（数据驱动，可编辑/可创建） ---------- */
export type FieldKind = "text" | "area" | "chat" | "shots";
export type TypeMode = "agent" | "chat" | "image" | "video" | "generic";

export interface FieldDef {
  key: string;
  label: string;      // 中文标签 Chinese label
  labelEn?: string;   // 英文标签 English label
  kind: FieldKind;
  hint?: string;      // 中文提示 Chinese hint
  hintEn?: string;    // 英文提示 English hint
  quick?: string[];   // 快捷词 quick-fill suggestions
  icon?: string;      // 字段图标 field icon name
  hidden?: boolean;   // 开关：隐藏后不参与编辑与合成 toggle: hidden fields are skipped
}

export interface TypeDef {
  id: string;
  label: string;      // 中文名
  labelEn?: string;   // 英文名
  icon: string;       // 类型图标 type icon name
  color: string;      // 主题色点缀 accent color
  blurb: string;      // 中文简介
  blurbEn?: string;   // 英文简介
  mode: TypeMode;     // 合成策略 composition strategy
  fields: FieldDef[];
  params: { key: string; label: string; labelEn?: string; ph?: string }[];
  builtin?: boolean;  // 是否内置 built-in
}

/** 本地化读取 localized accessors */
export const tl = (x: { label: string; labelEn?: string }): string =>
  LANG === "en" ? x.labelEn ?? x.label : x.label;
export const th = (x: { hint?: string; hintEn?: string }): string =>
  LANG === "en" ? x.hintEn ?? x.hint ?? "" : x.hint ?? "";
export const tb = (x: { blurb: string; blurbEn?: string }): string =>
  LANG === "en" ? x.blurbEn ?? x.blurb : x.blurb;

/* ---------- 内置类型 Built-in types（中英双语 bilingual） ---------- */
export const DEFAULT_TYPES: TypeDef[] = [
  {
    id: "agent", label: "Agent", labelEn: "Agent", icon: "agent", color: "var(--moss)",
    blurb: "智能体 · 系统指令 · 角色扮演", blurbEn: "Agents · system prompts · role-play", mode: "agent", builtin: true,
    fields: [
      { key: "role", label: "角色设定", labelEn: "Role", kind: "area", icon: "agent", hint: "它是谁、擅长什么、以什么口吻说话", hintEn: "Who it is, what it's good at, its tone" },
      { key: "abilities", label: "能力边界", labelEn: "Capabilities", kind: "area", icon: "check", hint: "能做什么、不能做什么", hintEn: "What it can and cannot do" },
      { key: "tools", label: "工具描述", labelEn: "Tools", kind: "area", icon: "tool", hint: "可调用工具的名称与用途", hintEn: "Available tools and their purpose" },
      { key: "toolRules", label: "工具调用规则", labelEn: "Tool rules", kind: "area", icon: "rules", hint: "何时调用、参数约束、失败处理", hintEn: "When to call, constraints, failure handling" },
      { key: "memory", label: "记忆策略", labelEn: "Memory", kind: "area", icon: "history", hint: "记住什么、遗忘什么、上下文长度", hintEn: "What to remember, context length" },
      { key: "output", label: "输出格式", labelEn: "Output format", kind: "text", icon: "doc", hint: "如：JSON / Markdown / 分点", hintEn: "e.g. JSON / Markdown / bullet points" },
      { key: "forbidden", label: "禁止事项", labelEn: "Forbidden", kind: "area", icon: "close", hint: "红线清单", hintEn: "Hard limits" },
      { key: "examples", label: "示例对话", labelEn: "Example dialogue", kind: "chat", icon: "chat", hint: "Few-shot 示例，越具体越好", hintEn: "Few-shot examples, the more specific the better" },
    ],
    params: [
      { key: "model", label: "模型", labelEn: "Model", ph: "gpt-4o / claude…" },
      { key: "temperature", label: "温度", labelEn: "Temperature", ph: "0.7" },
      { key: "topP", label: "Top P", ph: "0.9" },
      { key: "maxTokens", label: "Max Tokens", ph: "2048" },
    ],
  },
  {
    id: "chat", label: "Chat", labelEn: "Chat", icon: "chat", color: "var(--slate)",
    blurb: "对话模板 · 多轮话术 · 写作对话", blurbEn: "Dialogue templates · multi-turn scripts", mode: "chat", builtin: true,
    fields: [
      { key: "goal", label: "对话目标", labelEn: "Goal", kind: "text", icon: "target", hint: "这组对话想达成什么", hintEn: "What this dialogue should achieve" },
      { key: "system", label: "系统提示", labelEn: "System prompt", kind: "area", icon: "doc", hint: "对话开始前注入的设定", hintEn: "Setup injected before the dialogue" },
      { key: "firstUser", label: "用户首条消息", labelEn: "First user message", kind: "area", icon: "chat", hint: "对话的第一句", hintEn: "The opening line" },
      { key: "turns", label: "预设多轮消息", labelEn: "Preset turns", kind: "chat", icon: "chat", hint: "按顺序排列的 user / assistant 消息", hintEn: "Ordered user / assistant messages" },
      { key: "style", label: "风格要求", labelEn: "Style", kind: "text", icon: "spark", hint: "如：克制、幽默、学术", hintEn: "e.g. restrained, witty, academic" },
      { key: "tone", label: "语气要求", labelEn: "Tone", kind: "text", icon: "mic", hint: "如：第二人称、温和坚定", hintEn: "e.g. second person, warm but firm" },
      { key: "length", label: "长度要求", labelEn: "Length", kind: "text", icon: "ruler", hint: "如：300 字以内", hintEn: "e.g. under 300 words" },
      { key: "taboo", label: "禁忌项", labelEn: "Taboos", kind: "area", icon: "close", hint: "不要出现的词、句式、话题", hintEn: "Words, patterns, topics to avoid" },
      { key: "output", label: "输出格式", labelEn: "Output format", kind: "text", icon: "doc" },
    ],
    params: [
      { key: "model", label: "模型", labelEn: "Model" },
      { key: "temperature", label: "温度", labelEn: "Temperature", ph: "0.8" },
      { key: "maxTokens", label: "Max Tokens", ph: "1024" },
    ],
  },
  {
    id: "image", label: "生图", labelEn: "Image", icon: "image", color: "var(--clay)",
    blurb: "文生图 · 海报 · 电商 · 插画", blurbEn: "Text-to-image · poster · e-commerce · illustration", mode: "image", builtin: true,
    fields: [
      { key: "subject", label: "主体描述", labelEn: "Subject", kind: "area", icon: "star", hint: "画面的核心对象", hintEn: "The core object of the frame" },
      { key: "style", label: "风格", labelEn: "Style", kind: "text", icon: "spark", quick: ["电影感", "日系清新", "极简构图", "胶片质感", "水墨留白", "电商白底"] },
      { key: "composition", label: "构图", labelEn: "Composition", kind: "text", icon: "grid", quick: ["居中对称", "三分法", "俯视平铺", "大特写", "留白构图"] },
      { key: "lighting", label: "光影", labelEn: "Lighting", kind: "text", icon: "sun", quick: ["柔和光", "黄昏逆光", "侧逆轮廓光", "棚拍匀光", "烛光暖调"] },
      { key: "camera", label: "镜头", labelEn: "Camera", kind: "text", icon: "camera", quick: ["35mm", "85mm 人像", "微距", "广角低机位", "长焦压缩"] },
      { key: "color", label: "色彩", labelEn: "Color", kind: "text", icon: "palette", quick: ["低饱和", "莫兰迪", "暖调", "黑白"] },
      { key: "texture", label: "质感", labelEn: "Texture", kind: "text", icon: "layers", quick: ["磨砂颗粒", "丝绸光泽", "陶土肌理", "纸质纹理"] },
      { key: "detail", label: "细节增强", labelEn: "Detail boost", kind: "area", icon: "edit", hint: "材质、高光、边缘等细节补充", hintEn: "Material, highlights, edges" },
      { key: "lora", label: "LoRA / ControlNet 备注", labelEn: "LoRA / ControlNet notes", kind: "text", icon: "tool" },
      { key: "ref", label: "参考图说明", labelEn: "Reference notes", kind: "text", icon: "image" },
    ],
    params: [
      { key: "ratio", label: "比例", labelEn: "Ratio", ph: "1:1 / 3:4 / 16:9" },
      { key: "resolution", label: "分辨率", labelEn: "Resolution", ph: "1024×1024" },
      { key: "seed", label: "Seed", ph: "随机 / random" },
      { key: "model", label: "模型偏好", labelEn: "Model", ph: "SDXL / MJ v6…" },
    ],
  },
  {
    id: "video", label: "生视频", labelEn: "Video", icon: "video", color: "var(--plum)",
    blurb: "文生视频 · 镜头脚本 · 动态", blurbEn: "Text-to-video · shot scripts · motion", mode: "video", builtin: true,
    fields: [
      { key: "theme", label: "视频主题", labelEn: "Theme", kind: "text", icon: "star" },
      { key: "firstFrame", label: "首帧描述", labelEn: "First frame", kind: "area", icon: "image", hint: "开场画面", hintEn: "Opening frame" },
      { key: "lastFrame", label: "尾帧描述", labelEn: "Last frame", kind: "area", icon: "image", hint: "结束画面（可选）", hintEn: "Ending frame (optional)" },
      { key: "motion", label: "运动方式", labelEn: "Motion", kind: "text", icon: "play", quick: ["缓慢推近", "环绕拍摄", "手持跟随", "横向平移", "升格慢动作", "延时"] },
      { key: "camera", label: "镜头语言", labelEn: "Lens language", kind: "text", icon: "camera", quick: ["特写", "广角", "长焦", "航拍俯瞰", "过肩镜头"] },
      { key: "rhythm", label: "节奏", labelEn: "Pacing", kind: "text", icon: "clock", quick: ["舒缓", "紧凑卡点", "渐快"] },
      { key: "light", label: "光影氛围", labelEn: "Light & mood", kind: "text", icon: "sun", quick: ["黄昏暖调", "冷调清晨", "舞台聚光", "窗边自然光"] },
      { key: "transition", label: "场景转换", labelEn: "Transition", kind: "text", icon: "sync", quick: ["硬切", "叠化", "匹配剪辑", "黑场过渡"] },
      { key: "shots", label: "分镜列表", labelEn: "Shot list", kind: "shots", icon: "grid", hint: "把视频拆成一个个镜头", hintEn: "Break the video into shots" },
    ],
    params: [
      { key: "duration", label: "时长", labelEn: "Duration", ph: "5s / 10s / 30s" },
      { key: "ratio", label: "比例", labelEn: "Ratio", ph: "16:9 / 9:16" },
      { key: "fps", label: "帧率偏好", labelEn: "FPS", ph: "24fps 电影感 / cinematic" },
      { key: "model", label: "模型偏好", labelEn: "Model", ph: "Kling / Sora…" },
    ],
  },
  {
    id: "custom", label: "自定义", labelEn: "Custom", icon: "doc", color: "var(--sand)",
    blurb: "写作 · 翻译 · 代码 · 任意结构", blurbEn: "Writing · translation · code · any structure", mode: "generic", builtin: true,
    fields: [],
    params: [
      { key: "model", label: "模型", labelEn: "Model" },
      { key: "temperature", label: "温度", labelEn: "Temperature" },
      { key: "maxTokens", label: "Max Tokens" },
    ],
  },
];

/* ---------- 类型注册表 Type registry（全局，供合成引擎读取） ---------- */
const FALLBACK_TYPE: TypeDef = {
  id: "custom", label: "自定义", labelEn: "Custom", icon: "doc", color: "var(--sand)",
  blurb: "通用类型", blurbEn: "Generic type", mode: "generic", fields: [], params: [],
};
let TYPES: TypeDef[] = [...DEFAULT_TYPES];
export const registerTypes = (types: TypeDef[]) => { TYPES = types; };
export const allTypes = (): TypeDef[] => TYPES;
/* getTypeDef 返回的类型只含可见字段（hidden 字段被过滤），
 * 因此编辑与合成都会自动忽略被关闭的字段。类型管理器直接读取 state.types（未过滤）。
 * getTypeDef returns a type with hidden fields filtered out, so editing and composing
 * automatically skip toggled-off fields. The TypeManager reads the unfiltered state.types. */
export const getTypeDef = (id: string): TypeDef => {
  const t = TYPES.find((x) => x.id === id) ?? FALLBACK_TYPE;
  return { ...t, fields: t.fields.filter((f) => !f.hidden) };
};

/* ---------- 数据模型 Data model ---------- */
export type Role = "system" | "user" | "assistant";
export interface ChatMsg { id: string; role: Role; content: string }
export interface Shot { id: string; label: string; content: string; secs: string }
export interface VarPreset { id: string; name: string; values: Record<string, string> }
export interface Version { id: string; at: number; label: string; body: string; fields: Record<string, any>; negative: string }
export interface DebugRun { id: string; at: number; final: string; values: Record<string, string>; copied: boolean; sent: boolean; note: string }

export interface Prompt {
  id: string; vaultId: string; groupId?: string; type: string; // 类型 id（可为自定义）type id, may be custom
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

/** 左栏区域可见性 · sidebar section visibility */
export interface SidebarPrefs {
  smartViews: boolean; vaults: boolean; tags: boolean; typeCenter: boolean; syncCard: boolean;
}
export const DEFAULT_SIDEBAR: SidebarPrefs = {
  smartViews: true, vaults: true, tags: true, typeCenter: true, syncCard: true,
};

export interface Settings {
  lang: Lang;                       // 界面语言 UI language
  deviceName: string; wsUrl: string; ns: string; autoSync: boolean;
  scope: "all" | "fav" | "current";
  apiUrl: string; apiKey: string; apiModel: string;
  reduceMotion: boolean; saveFlash: boolean; compactList: boolean;
  sidebar: SidebarPrefs;            // 左栏区域开关 sidebar toggles
}

export interface AppState {
  vaults: Vault[]; groups: Group[]; tags: Tag[]; prompts: Prompt[];
  types: TypeDef[];                 // 可编辑的类型表 editable type registry
  settings: Settings; welcomed: boolean;
}

export const TAG_COLORS = ["var(--moss)", "var(--slate)", "var(--clay)", "var(--plum)", "var(--sand)", "var(--seal)", "var(--brass)", "var(--ok)"];

/* ---------- 小工具 Utils ---------- */
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

export function timeAgo(ts: number | null | undefined): string {
  if (!ts) return tt("从未", "never");
  const d = Date.now() - ts;
  const m = 60_000, h = 3_600_000, day = 86_400_000;
  if (d < m) return tt("刚刚", "just now");
  if (d < h) return tt(`${Math.floor(d / m)} 分钟前`, `${Math.floor(d / m)}m ago`);
  if (d < day) return tt(`${Math.floor(d / h)} 小时前`, `${Math.floor(d / h)}h ago`);
  if (d < 7 * day) return tt(`${Math.floor(d / day)} 天前`, `${Math.floor(d / day)}d ago`);
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

/* ---------- 变量系统 Variables ---------- */
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

/* ---------- 最终 Prompt 合成 Composer ---------- */
const sec = (label: string, content: string) => (content && content.trim() ? `【${label}】\n${content.trim()}` : "");
const line = (label: string, content: string) => (content && content.trim() ? `${label}：${content.trim()}` : "");
const roleLabel = (): Record<Role, string> => ({
  system: tt("系统", "System"), user: tt("用户", "User"), assistant: tt("助手", "Assistant"),
});

export function composePrompt(p: Prompt, values: Record<string, string>): string {
  const f = p.fields;
  const def = getTypeDef(p.type);
  const rl = roleLabel();
  const parts: string[] = [];

  if (def.mode === "agent") {
    if (p.body.trim()) parts.push(p.body.trim());
    def.fields.forEach((fd) => {
      if (fd.kind === "chat") {
        const ex: ChatMsg[] = f[fd.key] || [];
        if (ex.length) parts.push(sec(tl(fd), ex.map((m) => `${rl[m.role]}：${m.content}`).join("\n")));
      } else {
        const s = fd.kind === "area" ? sec(tl(fd), f[fd.key] || "") : line(tl(fd), f[fd.key] || "");
        if (s) parts.push(s);
      }
    });
  } else if (def.mode === "chat") {
    const sysDef = def.fields.find((d) => d.key === "system");
    if (sysDef && f.system) parts.push(sec(tl(sysDef), f.system));
    const msgs: ChatMsg[] = [];
    if (f.firstUser) msgs.push({ id: "fu", role: "user", content: f.firstUser });
    (f.turns || []).forEach((m: ChatMsg) => msgs.push(m));
    const turnsDef = def.fields.find((d) => d.key === "turns");
    if (msgs.length) parts.push(sec(turnsDef ? tl(turnsDef) : tt("对话结构", "Dialogue"), msgs.map((m) => `${rl[m.role]}：${m.content}`).join("\n\n")));
    def.fields.forEach((fd) => {
      if (["system", "turns", "firstUser", "taboo"].includes(fd.key)) return;
      const s = line(tl(fd), f[fd.key] || "");
      if (s) parts.push(s);
    });
    const tabooDef = def.fields.find((d) => d.key === "taboo");
    if (tabooDef && f.taboo) parts.push(sec(tl(tabooDef), f.taboo));
    if (p.body.trim()) parts.push(p.body.trim());
  } else if (def.mode === "image") {
    const bits: string[] = [];
    def.fields.forEach((fd) => {
      if (["lora", "ref", "detail"].includes(fd.key)) return;
      const v = (f[fd.key] || "").toString().trim();
      if (v) bits.push(v);
    });
    const detailDef = def.fields.find((d) => d.key === "detail");
    if (detailDef && (f.detail || "").trim()) bits.push(f.detail.trim());
    parts.push(bits.join("，"));
    if (p.body.trim()) parts.push(p.body.trim());
  } else if (def.mode === "video") {
    const bits: string[] = [];
    def.fields.forEach((fd) => {
      if (fd.kind === "shots") return;
      const v = (f[fd.key] || "").toString().trim();
      if (v) bits.push(line(tl(fd), v));
    });
    const shotsDef = def.fields.find((d) => d.kind === "shots");
    const shots: Shot[] = shotsDef ? f[shotsDef.key] || [] : [];
    if (shots.length) bits.push(sec(shotsDef ? tl(shotsDef) : tt("分镜", "Shots"), shots.map((s, i) => `${tt("镜头", "Shot")}${i + 1}（${s.secs || "3s"}${s.label ? " · " + s.label : ""}）：${s.content}`).join("\n")));
    if (p.body.trim()) bits.push(p.body.trim());
    parts.push(bits.filter(Boolean).join("\n"));
  } else {
    /* 通用自定义类型 generic custom type */
    if (p.body.trim()) parts.push(p.body.trim());
    def.fields.forEach((fd) => {
      const v = f[fd.key];
      if (fd.kind === "chat" && Array.isArray(v) && v.length) {
        parts.push(sec(tl(fd), v.map((m: ChatMsg) => `${rl[m.role]}：${m.content}`).join("\n")));
      } else if (fd.kind === "shots" && Array.isArray(v) && v.length) {
        parts.push(sec(tl(fd), v.map((s: Shot, i: number) => `${i + 1}. ${s.content}`).join("\n")));
      } else if (typeof v === "string" && v.trim()) {
        parts.push(fd.kind === "area" ? sec(tl(fd), v) : line(tl(fd), v));
      }
    });
  }
  return fillVars(parts.filter((x) => x && x.trim()).join("\n\n"), values);
}

/** 生图：三种复制格式 Image: three copy formats */
export function imageFormats(p: Prompt, values: Record<string, string>): { name: string; text: string }[] {
  const f = p.fields;
  const def = getTypeDef("image");
  const bits = def.fields.filter((d) => !["lora", "ref"].includes(d.key)).map((d) => ((f[d.key] || "").toString().trim())).filter(Boolean);
  const plain = fillVars([...bits].filter(Boolean).join("，"), values);
  const paramBits: string[] = [];
  if (p.params.ratio) paramBits.push(`--ar ${p.params.ratio}`);
  if (p.params.seed) paramBits.push(`--seed ${p.params.seed}`);
  if (p.params.resolution) paramBits.push(`--size ${p.params.resolution}`);
  const withParams = [plain, paramBits.join(" "), p.negative.trim() ? `--no ${fillVars(p.negative.trim(), values)}` : ""].filter(Boolean).join("\n");
  const perField = fillVars(
    def.fields.filter((d) => !["lora", "ref"].includes(d.key)).map((d) => {
      const v = (f[d.key] || "").toString().trim();
      return v ? `${tl(d)}：${v}` : "";
    }).filter(Boolean).join("\n") + (p.negative.trim() ? `\n${tt("负面提示", "Negative")}：${p.negative.trim()}` : ""),
    values
  );
  return [
    { name: tt("纯文本", "Plain text"), text: plain },
    { name: tt("带参数", "With params"), text: withParams },
    { name: tt("分字段", "By field"), text: perField },
  ];
}

/** 生视频：三种复制格式 Video: three copy formats */
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
    { name: tt("简洁版", "Brief"), text: brief },
    { name: tt("详细版", "Detailed"), text: full },
    { name: tt("专业版", "Pro"), text: pro },
  ];
}

export function paramSummary(p: Prompt): string {
  const meta = getTypeDef(p.type);
  return meta.params.filter((k) => p.params[k.key]).map((k) => `${tl(k)} ${p.params[k.key]}`).join(" · ");
}

/* ---------- 剪贴板与文件 Clipboard & files ---------- */
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
    app: "yanchi-prompt-vault", format: 2,
    exportedAt: new Date().toISOString(),
    count: clean.length,
    vaults: state.vaults.filter((v) => clean.some((p) => p.vaultId === v.id)),
    groups: state.groups.filter((g) => clean.some((p) => p.vaultId === g.vaultId)),
    tags: state.tags.filter((t) => clean.some((p) => p.tagIds.includes(t.id))),
    types: state.types.filter((t) => !t.builtin), // 仅携带自定义类型 only carry custom types
    prompts: clean,
  };
}
