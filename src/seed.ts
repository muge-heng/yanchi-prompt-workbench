/* ============================================================
 * 砚池 · 预置数据（中英双语，按首次系统语言选择）
 * Yanchi · seeded demo data (bilingual, chosen by system language)
 * ============================================================ */
import type { AppState, Prompt, TypeDef, Lang } from "./lib";
import { DEFAULT_TYPES, DEFAULT_SIDEBAR } from "./lib";

const now = Date.now();
const H = 3_600_000, D = 86_400_000;

/* ---------- 自定义类型示例 Example custom types ---------- */
function customTypes(t: (zh: string, en: string) => string): TypeDef[] {
  return [
    {
      id: "writing", label: "写作", labelEn: "Writing", icon: "pen", color: "var(--sand)",
      blurb: t("文章 · 文案 · 结构化写作", "Articles · copy · structured writing"), mode: "generic",
      fields: [
        { key: "topic", label: "主题", labelEn: "Topic", kind: "text", icon: "star" },
        { key: "audience", label: "受众", labelEn: "Audience", kind: "text", icon: "agent" },
        { key: "style", label: "风格", labelEn: "Style", kind: "text", icon: "spark" },
        { key: "structure", label: "结构要求", labelEn: "Structure", kind: "area", icon: "grid" },
        { key: "length", label: "字数", labelEn: "Length", kind: "text", icon: "ruler" },
      ],
      params: [
        { key: "model", label: "模型", labelEn: "Model" },
        { key: "temperature", label: "温度", labelEn: "Temperature", ph: "0.7" },
      ],
    },
    {
      id: "translate", label: "翻译", labelEn: "Translation", icon: "globe", color: "var(--slate)",
      blurb: t("信达雅 · 术语一致 · 风格收口", "Faithful · consistent terms · styled output"), mode: "generic",
      fields: [
        { key: "direction", label: "翻译方向", labelEn: "Direction", kind: "text", icon: "sync" },
        { key: "journal", label: "目标风格", labelEn: "Target style", kind: "text", icon: "doc" },
        { key: "glossary", label: "术语表", labelEn: "Glossary", kind: "area", icon: "rules" },
      ],
      params: [{ key: "model", label: "模型", labelEn: "Model" }],
    },
  ];
}

function P(x: Partial<Prompt> & { id: string; vaultId: string; type: string; title: string }): Prompt {
  return {
    summary: "", body: "", negative: "", fields: {}, params: {}, tagIds: [],
    favorite: false, pinned: false, deletedAt: null, groupId: undefined,
    useCount: 0, lastUsedAt: null, lastDebugAt: null,
    createdAt: now - 20 * D, updatedAt: now - 2 * D,
    presets: [], versions: [], runs: [], sync: "local", ...x,
  } as Prompt;
}

export function seedState(lang: Lang): AppState {
  const t = (zh: string, en: string) => (lang === "en" ? en : zh);
  return {
    welcomed: true,
    settings: {
      lang,
      deviceName: t("我的书桌", "My Desk"), wsUrl: "", ns: "prompt-vault", autoSync: true,
      scope: "all", apiUrl: "", apiKey: "", apiModel: "",
      reduceMotion: false, saveFlash: true, compactList: false,
      sidebar: { ...DEFAULT_SIDEBAR },
    },
    types: [...DEFAULT_TYPES, ...customTypes(t)],
    vaults: [
      { id: "v-work", name: t("工作项目", "Work Projects"), icon: "briefcase", desc: t("客户方案、产品文案与客服话术", "Client work, product copy and support scripts"), color: "var(--slate)", createdAt: now - 60 * D, updatedAt: now - 3 * H, syncOn: true },
      { id: "v-agent", name: t("AI Agent 库", "AI Agent Library"), icon: "agent", desc: t("长期打磨的智能体与系统指令", "Agents and system prompts, refined over time"), color: "var(--moss)", createdAt: now - 55 * D, updatedAt: now - D, syncOn: true },
      { id: "v-image", name: t("生图模板库", "Image Prompt Library"), icon: "image", desc: t("海报、电商与插画的画面配方", "Recipes for posters, e-commerce and illustration"), color: "var(--clay)", createdAt: now - 40 * D, updatedAt: now - 2 * D, syncOn: true },
      { id: "v-video", name: t("视频 Prompt 库", "Video Prompt Library"), icon: "video", desc: t("分镜、运镜与氛围模板", "Shot lists, camera moves and mood templates"), color: "var(--plum)", createdAt: now - 30 * D, updatedAt: now - 5 * D, syncOn: false },
      { id: "v-self", name: t("个人创作", "Personal Writing"), icon: "pen", desc: t("写作、翻译与灵感收集", "Writing, translation and sparks of ideas"), color: "var(--sand)", createdAt: now - 25 * D, updatedAt: now - 6 * D, syncOn: true },
      { id: "v-inbox", name: t("临时收集箱", "Inbox"), icon: "inbox", desc: t("随手一存，周末再整理", "Drop it here, sort it on the weekend"), color: "var(--brass)", createdAt: now - 10 * D, updatedAt: now - 8 * H, syncOn: false },
    ],
    groups: [
      { id: "g-xhs", vaultId: "v-work", name: t("小红书", "Xiaohongshu"), order: 1 },
      { id: "g-wx", vaultId: "v-work", name: t("公众号", "WeChat Articles"), order: 2 },
      { id: "g-cs", vaultId: "v-work", name: t("客服话术", "Support Scripts"), order: 3 },
      { id: "g-poster", vaultId: "v-image", name: t("海报生图", "Poster Art"), order: 1 },
      { id: "g-ec", vaultId: "v-image", name: t("电商摄影", "E-commerce Photo"), order: 2 },
      { id: "g-ad", vaultId: "v-video", name: t("产品宣传", "Product Ads"), order: 1 },
      { id: "g-role", vaultId: "v-agent", name: t("角色 Agent", "Role Agents"), order: 1 },
    ],
    tags: [
      { id: "t-ok", name: t("成熟可用", "Battle-tested"), color: "var(--ok)" },
      { id: "t-test", name: t("待测试", "Needs testing"), color: "var(--warn)" },
      { id: "t-hot", name: t("高转化", "High CTR"), color: "var(--seal)" },
      { id: "t-xhs", name: t("小红书", "Xiaohongshu"), color: "var(--clay)" },
      { id: "t-min", name: t("极简风", "Minimal"), color: "var(--slate)" },
      { id: "t-film", name: t("电影感", "Cinematic"), color: "var(--plum)" },
      { id: "t-cs", name: t("客服", "Support"), color: "var(--sand)" },
      { id: "t-long", name: t("长文", "Long-form"), color: "var(--moss)" },
    ],
    prompts: [
      P({
        id: "p-xhs-agent", vaultId: "v-agent", groupId: "g-role", type: "agent",
        title: t("小红书爆款标题 Agent", "Xiaohongshu Viral-Title Agent"),
        summary: t("给定主题与受众，产出 10 个带钩子的小红书标题，附点击率自评。", "Given a topic and audience, produce 10 hook-driven titles with self-rated CTR."),
        body: t("你是一名深耕小红书平台 6 年的内容策略师，擅长把平庸的主题改写成让人忍不住点开的标题。", "You are a content strategist with 6 years on Xiaohongshu, expert at turning flat topics into irresistible titles."),
        fields: {
          role: t("擅长拆解爆款笔记的标题结构：悬念前置、数字承诺、身份代入、反常识转折。输出始终使用简体中文。", "You deconstruct viral title structures: front-loaded suspense, numeric promises, identity hooks, counter-intuitive twists. Always answer in Simplified Chinese."),
          abilities: t("能做：标题改写、钩子分析、关键词前置建议、emoji 点缀。\n不能做：编造数据、夸大功效、医疗与金融承诺。", "Can do: title rewrites, hook analysis, keyword placement, emoji garnish.\nCannot do: fabricate data, overstate claims, medical or financial promises."),
          tools: t("search_trends：查询主题近期热搜词（可选）。\nemoji_pick：从常用表情库挑选 1-2 个点缀。", "search_trends: look up recent hot keywords for the topic (optional).\nemoji_pick: pick 1-2 emojis from a common set."),
          toolRules: t("仅当用户提供「行业」字段时才调用 search_trends；失败时静默降级，不打断输出。", "Only call search_trends when the user provides an industry field; on failure, degrade silently without interrupting output."),
          memory: t("记住用户的账号定位与禁用词，跨会话保留 30 天。", "Remember the account positioning and banned words; keep them across sessions for 30 days."),
          output: t("Markdown 表格：序号 | 标题 | 钩子类型 | 点击率自评（1-5）", "Markdown table: No. | Title | Hook type | CTR self-rating (1-5)"),
          forbidden: t("不使用「最」「第一」「绝对」等绝对化用语；不模仿他人账号名。", "No absolute claims like “best / first / definitely”; never imitate other account names."),
          examples: [
            { id: "e1", role: "user", content: t("主题：小户型收纳；受众：租房独居女生", "Topic: small-apartment storage; audience: young women renting alone") },
            { id: "e2", role: "assistant", content: t("1. 租房 3 年，我把 9㎡ 卧室收成了样板间｜收纳师都来抄作业 🏠（身份代入 · 5）\n2. 房东看了都想加租：小户型收纳的 7 个反常识细节（反常识 · 4）", "1. After 3 years of renting, I turned my 9㎡ bedroom into a show room 🏠 (identity hook · 5)\n2. Even the landlord wants to raise rent: 7 counter-intuitive storage tricks (counter-intuitive · 4)") },
          ],
        },
        params: { model: "gpt-4o", temperature: "0.9", topP: "0.95", maxTokens: "1024" },
        tagIds: ["t-ok", "t-xhs", "t-hot"], favorite: true, pinned: true,
        useCount: 47, lastUsedAt: now - 5 * H, lastDebugAt: now - 5 * H,
        createdAt: now - 45 * D, updatedAt: now - 5 * H,
        presets: [
          { id: "vp1", name: t("美妆向", "Beauty"), values: { [t("主题", "Topic")]: t("早八伪素颜妆容", "no-makeup makeup for early mornings"), [t("受众", "Audience")]: t("20-25 岁通勤女生", "commuters aged 20-25"), [t("平台", "Platform")]: t("小红书", "Xiaohongshu") } },
          { id: "vp2", name: t("家居向", "Home"), values: { [t("主题", "Topic")]: t("小户型收纳", "small-apartment storage"), [t("受众", "Audience")]: t("租房独居女生", "young women renting alone"), [t("平台", "Platform")]: t("小红书", "Xiaohongshu") } },
        ],
        versions: [
          { id: "ver1", at: now - 30 * D, label: t("v1 · 初版，仅产出标题", "v1 · first draft, titles only"), body: t("你是小红书标题助手，请为给定主题写 10 个标题。", "You are a Xiaohongshu title assistant; write 10 titles for the given topic."), fields: { output: t("纯文本列表", "plain text list") }, negative: "" },
          { id: "ver2", at: now - 12 * D, label: t("v2 · 加入钩子类型与自评", "v2 · added hook types and self-rating"), body: t("你是一名深耕小红书平台 6 年的内容策略师。", "You are a content strategist with 6 years on Xiaohongshu."), fields: { output: t("Markdown 表格：序号 | 标题 | 钩子类型 | 点击率自评", "Markdown table: No. | Title | Hook type | CTR self-rating") }, negative: "" },
        ],
        runs: [
          { id: "r1", at: now - 5 * H, final: t("（主题：小户型收纳 · 受众：租房独居女生）产出 10 条标题，钩子类型覆盖身份代入 4 / 反常识 3 / 数字承诺 3。", "(Topic: small-apartment storage · Audience: young women renting alone) Produced 10 titles: 4 identity hooks / 3 counter-intuitive / 3 numeric promises."), values: { [t("主题", "Topic")]: t("小户型收纳", "small-apartment storage"), [t("受众", "Audience")]: t("租房独居女生", "young women renting alone") }, copied: true, sent: false, note: t("第 2、7 条可直接用", "Items 2 and 7 are ready to use") },
          { id: "r2", at: now - 2 * D, final: t("美妆向测试：早八伪素颜，整体偏稳，钩子略温和。", "Beauty test: no-makeup makeup, solid overall, hooks a bit mild."), values: { [t("主题", "Topic")]: t("早八伪素颜妆容", "no-makeup makeup for early mornings"), [t("受众", "Audience")]: t("20-25 岁通勤女生", "commuters aged 20-25") }, copied: false, sent: false, note: t("把温度调到 0.9 后好很多", "Much better after raising temperature to 0.9") },
        ],
        sync: "synced",
      }),
      P({
        id: "p-code-review", vaultId: "v-agent", groupId: "g-role", type: "agent",
        title: t("代码审查 Agent · 温和严格派", "Code Review Agent · kind but strict"),
        summary: t("按严重度分级给 review 意见，先肯定再建议，附最小修改示例。", "Severity-graded review: affirm first, then suggest, with minimal diff examples."),
        body: t("你是一位有 10 年经验的代码审查者，风格温和但标准严格：先指出写得好的地方，再按严重度给出可执行的修改建议。", "You are a code reviewer with 10 years of experience: warm in tone, strict in standards. Point out what's done well, then give actionable, severity-graded suggestions."),
        fields: {
          role: t("输出结构化的 review 报告，引用具体行号。", "Produce a structured review report that cites specific line numbers."),
          abilities: t("能做：逻辑缺陷、边界条件、命名、性能隐患、可读性建议。\n不能做：直接重写整个文件（除非用户要求）。", "Can do: logic flaws, edge cases, naming, performance risks, readability.\nCannot do: rewrite the whole file (unless asked)."),
          output: t("分级列表：🔴 必须修改 / 🟡 建议修改 / 🟢 可以更好，每条附最小 diff 示例。", "Graded list: 🔴 must fix / 🟡 should fix / 🟢 could improve, each with a minimal diff example."),
          forbidden: t("不评价作者本人；不使用讽刺语气。", "Never judge the author; never use sarcasm."),
          examples: [],
        },
        params: { model: "claude-sonnet", temperature: "0.2", maxTokens: "2048" },
        tagIds: ["t-ok"], useCount: 23, lastUsedAt: now - 26 * H,
        createdAt: now - 38 * D, updatedAt: now - 3 * D, sync: "local",
      }),
      P({
        id: "p-long-chat", vaultId: "v-work", groupId: "g-wx", type: "chat",
        title: t("公众号深度长文 · 三轮打磨对话", "Deep Long-form Article · three-round dialogue"),
        summary: t("立意 → 大纲 → 成稿的三段式写作对话，变量控制主题与读者。", "Angle → outline → draft: a three-round writing dialogue with topic and reader variables."),
        fields: {
          goal: t("和 AI 一起把「{{主题}}」写成一篇适合{{读者}}的深度长文，三轮对话完成立意、大纲、成稿。", "Work with the AI to turn “{{Topic}}” into a deep article for {{Reader}}, completing angle, outline and draft in three rounds."),
          system: t("你是一位资深特稿编辑，信奉「先有洞察，再有文字」。每一轮只推进一件事，不抢跑。", "You are a veteran features editor who believes insight precedes prose. Advance one thing per round; never rush ahead."),
          firstUser: t("第一轮：请就「{{主题}}」给出 3 个不同的立意角度，每个角度用一句话说清「这篇稿子到底在回答什么问题」。", "Round one: give 3 distinct angles on “{{Topic}}”, each stating in one sentence what question the piece actually answers."),
          turns: [
            { id: "m1", role: "assistant", content: t("（给出三个立意后）请选择一个角度，或告诉我哪个更接近你的想法，我们再 sharpen 它。", "(After offering three angles) Pick one, or tell me which is closest and we'll sharpen it.") },
            { id: "m2", role: "user", content: t("第二轮：就选定的立意，写一份分层大纲，要求每一节都有「这一节存在的理由」。", "Round two: for the chosen angle, write a layered outline where every section earns its place.") },
            { id: "m3", role: "assistant", content: t("（大纲确认后）可以开始成稿了，需要我先写导语给你定调吗？", "(Once the outline is confirmed) We can start drafting — want me to write the lede to set the tone?") },
          ],
          style: t("克制、具体、多用名词少用形容词", "Restrained, concrete, noun-heavy, adjective-light"), tone: t("平视读者，不煽情", "Meet the reader at eye level; no sentimentality"), length: t("成稿 3000-4000 字", "Final draft 3000-4000 characters"),
          taboo: t("不使用「赋能」「抓手」「闭环」；不空喊口号；不在没有细节的地方抒情。", "No corporate jargon like “empower /抓手 / closed loop”; no empty slogans; no lyricism without detail."),
          output: t("Markdown，小节用「一、二、三」", "Markdown; number sections 一、二、三"),
        },
        body: "",
        params: { model: "claude-sonnet", temperature: "0.7", maxTokens: "4096" },
        tagIds: ["t-long", "t-ok"], favorite: true,
        useCount: 18, lastUsedAt: now - 30 * H,
        createdAt: now - 33 * D, updatedAt: now - 4 * D,
        presets: [{ id: "vp3", name: t("AI 工具观察", "AI tools essay"), values: { [t("主题", "Topic")]: t("AI 工具正在改变小团队的工作方式", "How AI tools are changing small teams"), [t("读者", "Reader")]: t("互联网从业者", "tech workers") } }],
        sync: "synced",
      }),
      P({
        id: "p-ec-image", vaultId: "v-image", groupId: "g-ec", type: "image",
        title: t("电商白底产品图 · 通用配方", "E-commerce White-bg Product · universal recipe"),
        summary: t("主体 + 棚拍匀光 + 微距质感，负面词挡住脏背景与变形。", "Subject + even studio light + macro texture; negatives block clutter and distortion."),
        fields: {
          subject: t("{{产品}}，产品摄影，完整呈现外观与材质细节，正面 45° 视角", "{{Product}}, product photography, full exterior and material detail, 45° front view"),
          style: t("电商白底，干净克制，高级感", "E-commerce white background, clean and restrained, premium feel"),
          composition: t("居中构图，四周留白 20%", "Centered composition, 20% margin all around"),
          lighting: t("棚拍柔光箱匀光，轻微底部反光", "Even softbox studio light, subtle bottom bounce"),
          camera: t("90mm 微距，f/8 小光圈", "90mm macro, f/8 small aperture"),
          color: t("还原真实色彩，低饱和微调", "True-to-life color, slight desaturation"),
          texture: t("突出{{材质}}的天然肌理", "Emphasize the natural grain of {{Material}}"),
          detail: t("边缘锐利，无多余阴影，倒影自然", "Crisp edges, no stray shadows, natural reflection"),
        },
        negative: t("杂乱背景，多余道具，文字水印，变形，低质量，过曝，塑料感", "cluttered background, extra props, watermark, distortion, low quality, overexposed, plastic look"),
        params: { ratio: "1:1", resolution: "1024×1024", model: "SDXL" },
        tagIds: ["t-ok"], favorite: true, useCount: 56, lastUsedAt: now - 9 * H, lastDebugAt: now - 9 * H,
        createdAt: now - 26 * D, updatedAt: now - 9 * H,
        presets: [
          { id: "vp4", name: t("陶瓷杯", "Ceramic mug"), values: { [t("产品", "Product")]: t("手工粗陶马克杯，哑光釉面", "handmade stoneware mug, matte glaze"), [t("材质", "Material")]: t("粗陶", "stoneware") } },
          { id: "vp5", name: t("香薰", "Diffuser"), values: { [t("产品", "Product")]: t("琥珀色玻璃瓶香薰，木质瓶盖", "amber glass diffuser, wooden cap"), [t("材质", "Material")]: t("玻璃与原木", "glass and wood") } },
        ],
        runs: [{ id: "r3", at: now - 9 * H, final: t("陶瓷杯版本：白底干净，釉面质感到位，杯柄略糊，seed 42 时最好。", "Mug version: clean white bg, glaze texture right, handle slightly soft — best at seed 42."), values: { [t("产品", "Product")]: t("手工粗陶马克杯，哑光釉面", "handmade stoneware mug, matte glaze") }, copied: true, sent: true, note: t("seed 42 最佳", "seed 42 is best") }],
        sync: "synced",
      }),
      P({
        id: "p-film-poster", vaultId: "v-image", groupId: "g-poster", type: "image",
        title: t("电影感人像海报 · 黄昏逆光", "Cinematic Portrait Poster · golden-hour backlight"),
        summary: t("黄昏逆光 + 长焦压缩 + 胶片颗粒，一句话把人拍进故事里。", "Golden-hour backlight + telephoto compression + film grain; put a person inside a story."),
        fields: {
          subject: t("{{人物}}站在{{场景}}，侧身回望，发丝被风吹起", "{{Person}} standing in {{Scene}}, glancing back over a shoulder, hair lifted by wind"),
          style: t("电影感，胶片质感，故事氛围", "Cinematic, film texture, narrative mood"),
          composition: t("三分法，人物偏右下，大面积天空", "Rule of thirds, subject lower-right, expansive sky"),
          lighting: t("黄昏逆光，轮廓光勾边，暗部偏青", "Golden-hour backlight, rim light, teal shadows"),
          camera: t("135mm 长焦压缩，浅景深", "135mm telephoto compression, shallow depth of field"),
          color: t("橙青对比，暗角", "Orange-teal contrast, vignette"),
          texture: t("35mm 胶片颗粒，轻微光晕", "35mm film grain, slight halation"),
          detail: t("眼神光保留，皮肤质感真实", "Keep catchlights, realistic skin texture"),
        },
        negative: t("过度磨皮，塑料感，饱和度过高，畸变，多余人物，文字", "over-smoothed skin, plastic look, over-saturated, distortion, extra people, text"),
        params: { ratio: "3:4", seed: "77", model: "MJ v6" },
        tagIds: ["t-film", "t-ok"], favorite: true, useCount: 12, lastUsedAt: now - 4 * D,
        createdAt: now - 21 * D, updatedAt: now - 4 * D, sync: "local",
      }),
      P({
        id: "p-ad-video", vaultId: "v-video", groupId: "g-ad", type: "video",
        title: t("产品宣传片 30s · 三段式分镜", "30s Product Film · three-act shot list"),
        summary: t("悬念开场 → 使用场景 → 品牌定格，附带 5 个镜头的分镜表。", "Hook opening → use scene → brand freeze, with a 5-shot shot list."),
        fields: {
          theme: t("{{产品}} 30 秒宣传片：把日常的一分钟拍出仪式感", "30-second film for {{Product}}: make an everyday minute feel ceremonial"),
          firstFrame: t("清晨 6:58，闹钟响起前的安静房间，光线从窗帘缝里渗进来", "6:58 AM, a quiet room before the alarm, light seeping through the curtain gap"),
          lastFrame: t("产品静置于原木桌面，品牌 logo 以烫金质感浮现", "The product rests on a wooden desk as the logo rises in gold-foil texture"),
          motion: t("缓慢推近 + 升格慢动作点缀", "Slow push-in + sprinkled slow motion"), camera: t("特写与广角交替，一次航拍俯瞰", "Alternating close-ups and wide shots, one aerial top-down"),
          rhythm: t("前 10 秒舒缓，中段渐快，尾段定格", "Calm first 10s, accelerating middle, freeze at the end"), light: t("窗边自然光为主，尾段转棚拍暖光", "Window daylight first, studio warm light at the end"),
          transition: t("匹配剪辑串联三个场景，结尾黑场 0.5s", "Match cuts link the three scenes; 0.5s black at the end"),
          shots: [
            { id: "s1", label: t("开场", "Open"), content: t("闹钟特写，手指按下，升格", "Alarm clock close-up, finger pressing, slow motion"), secs: "4s" },
            { id: "s2", label: t("场景一", "Scene 1"), content: t("厨房晨光，产品第一次入画", "Morning kitchen light, product enters frame"), secs: "8s" },
            { id: "s3", label: t("场景二", "Scene 2"), content: t("通勤路上，航拍城市转手持跟随", "Commute: aerial city to handheld follow"), secs: "8s" },
            { id: "s4", label: t("高潮", "Climax"), content: t("快切三连：使用瞬间的特写", "Rapid triple cut: close-ups of the moment of use"), secs: "6s" },
            { id: "s5", label: t("定格", "Freeze"), content: t("桌面静物 + logo 浮现", "Desk still life + logo reveal"), secs: "4s" },
          ],
        },
        params: { duration: "30s", ratio: "16:9", fps: t("24fps 电影感", "24fps cinematic"), model: "Kling 1.5" },
        tagIds: ["t-film", "t-ok"], favorite: true, useCount: 9, lastUsedAt: now - 2 * D, lastDebugAt: now - 2 * D,
        createdAt: now - 18 * D, updatedAt: now - 2 * D,
        runs: [{ id: "r4", at: now - 2 * D, final: t("用详细版投给 Kling，镜头 3 的航拍转手持需要拆成两条生成。", "Fed the detailed version to Kling; shot 3's aerial-to-handheld needs to be split into two generations."), values: { [t("产品", "Product")]: t("手冲咖啡套装", "pour-over coffee set") }, copied: true, sent: false, note: t("镜头 3 拆分生成效果更好", "Splitting shot 3 gives better results") }],
        sync: "local",
      }),
      P({
        id: "p-translate", vaultId: "v-self", type: "translate",
        title: t("学术翻译润色 · 信雅达三步", "Academic Translation · faithfulness in three steps"),
        summary: t("先直译、再意译、最后按{{期刊}}风格收口，保留术语表。", "Literal first, then free, finally styled to {{Journal}}; glossary preserved."),
        body: t("请把以下{{方向}}文本翻译成学术书面语。\n\n第一步（信）：逐句直译，保留所有术语原貌；\n第二步（达）：在不改变论点的前提下重排句式，使其符合目标语言习惯；\n第三步（雅）：按{{期刊}}的行文风格润色，控制被动语态密度。\n\n术语表：\n{{术语表}}\n\n待翻译文本：\n{{原文}}", "Translate the following {{Direction}} text into academic prose.\n\nStep 1 (faithful): translate sentence by sentence, keeping every term intact;\nStep 2 (expressive): restructure for target-language flow without changing the argument;\nStep 3 (elegant): polish to the style of {{Journal}}, controlling passive-voice density.\n\nGlossary:\n{{Glossary}}\n\nSource text:\n{{Source}}"),
        fields: {
          direction: t("中文 → 英文", "Chinese → English"),
          journal: t("Nature 子刊风格", "Nature sister-journal style"),
          glossary: t("抓手 → lever\n闭环 → closed loop\n赋能 → enable", "抓手 → lever\n闭环 → closed loop\n赋能 → enable"),
        },
        params: { model: "gpt-4o", temperature: "0.3" },
        tagIds: ["t-ok", "t-long"], useCount: 15, lastUsedAt: now - 8 * D,
        createdAt: now - 22 * D, updatedAt: now - 8 * D, sync: "synced",
      }),
      P({
        id: "p-weekly", vaultId: "v-self", type: "writing",
        title: t("周报生成器 · 不卑不亢版", "Weekly Report Generator · poised edition"),
        summary: t("把流水账输入变成「进展 + 判断 + 需求」三段式周报。", "Turn a raw log into a Progress + Judgment + Ask weekly report."),
        body: t("把这周的流水账整理成周报，结构固定为三段：\n1. 本周进展：只写有结果的事，每件事一句话 + 一个数字；\n2. 我的判断：对当前方向的一个观察或一个担忧；\n3. 需要的支持：最多两条，明确到人。\n语气不卑不亢，不用「赋能」「抓手」。\n\n流水账：\n{{流水账}}", "Organize this week's raw log into a weekly report with three fixed sections:\n1. Progress: only outcomes, one sentence + one number each;\n2. My judgment: one observation or one concern about the current direction;\n3. Support needed: at most two items, each assigned to a person.\nTone: poised, no corporate jargon.\n\nRaw log:\n{{Log}}"),
        fields: {
          audience: t("直属上级", "Direct manager"),
          style: t("不卑不亢，数据说话", "Poised, let numbers speak"),
          length: t("不超过 300 字", "Under 300 characters"),
        },
        tagIds: ["t-ok"], useCount: 21, lastUsedAt: now - 32 * H,
        createdAt: now - 15 * D, updatedAt: now - 32 * H, sync: "local",
      }),
      P({
        id: "p-inbox-1", vaultId: "v-inbox", type: "custom",
        title: t("剪藏：某开源 Agent 框架的系统指令", "Clipped: a system prompt from an open-source agent framework"),
        summary: t("从 GitHub 上抄来的，还没消化，周末整理。", "Copied from GitHub, not yet digested — sorting it on the weekend."),
        body: "You are a helpful research assistant. Always cite sources with [n] markers. When uncertain, say so explicitly and propose a verification plan before answering.",
        tagIds: ["t-test"], createdAt: now - 8 * H, updatedAt: now - 8 * H, useCount: 0, sync: "local",
      }),
      P({
        id: "p-old-1", vaultId: "v-inbox", type: "custom",
        title: t("（旧）早期文案助手 v0.1", "(old) Early copy assistant v0.1"),
        summary: t("最早的版本，已经被长文对话模板取代。", "The earliest version, superseded by the long-form dialogue template."),
        body: t("你是一个文案助手，请帮我写文案。", "You are a copywriting assistant; help me write copy."),
        tagIds: [], deletedAt: now - 2 * D, createdAt: now - 50 * D, updatedAt: now - 50 * D, useCount: 64, sync: "local",
      }),
    ],
  };
}
