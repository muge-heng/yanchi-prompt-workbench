<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/a3678a9b-3b49-46f3-8a15-93b69355e62e/_result.png" alt="砚池 · 私人提示词工作台" width="720" />
</p>

<h1 align="center">砚池 · 私人提示词工作台</h1>

<p align="center">
  <b>Yanchi — A Private Prompt Vault & Workbench</b><br/>
  本地优先 · 轻拟物 · 面向长期沉淀的 AI 提示词资产库
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-8a6a2f?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Storage-IndexedDB_本地优先-5c6b52?style=flat-square" alt="Local-first" />
  <img src="https://img.shields.io/badge/Sync-WebSocket_局域网-46526a?style=flat-square" alt="LAN Sync" />
  <img src="https://img.shields.io/badge/Python-启动器_零依赖-f2ece0?style=flat-square" alt="Python Launcher" />
</p>

---

## 一句话说清楚

**砚池**是一个把 AI 提示词当作「资产」来长期经营的私人工作台：
它在你的浏览器本机建了一座安静的纸感仓库，让你沉淀、归类、调试、复用
Agent / Chat / 生图 / 生视频等各类提示词，并可以通过局域网在台式机、笔记本、平板与手机之间自然同步——不依赖任何云服务。

它刻意不是：一个 CRUD 后台、一个冷冰冰的表单、一个深色赛博风面板。
它想成为一件你可以长期使用的桌面工具——**安静、漂亮、可靠**。

## 为什么做它

- 提示词散落在聊天记录、文档、收藏夹与代码片段里，难以统一管理；
- Agent、生图、生视频的结构完全不同，普通文本笔记承载不了；
- 反复调试时，复制粘贴、填变量、切窗口的过程支离破碎；
- 数据希望留在本地，隐私可控，又能局域网多端同步；
- 工具有义务好看、有秩序，而不是粗糙的默认表单。

## 功能总览

### 本地优先的数据体验
- 数据默认保存在本机浏览器（IndexedDB + 本地备份键），**断网完整可用**；
- 编辑即自动保存，右上角轻提示「已保存到本机」，不打扰；
- 一键导出 JSON 备份（可选是否包含版本历史），导入前可预览；
- 导入冲突提供 **覆盖 / 跳过 / 保留副本** 三种策略。

### 多类型提示词资产
| 类型 | 结构化字段 | 特色能力 |
| --- | --- | --- |
| **Agent** | 角色设定 · 能力边界 · 工具描述 · 调用规则 · 记忆策略 · 禁止事项 · 示例对话 | 示例以对话气泡呈现，调试时预览完整系统指令 |
| **Chat** | 对话目标 · 系统提示 · 多轮消息 · 风格/语气/长度 · 禁忌项 | user / assistant 角色切换，消息增删与排序 |
| **生图** | 主体 · 风格 · 构图 · 光影 · 镜头 · 色彩 · 质感 · 负面词 | 快捷画面词，**纯文本 / 带参数 / 分字段**三种复制格式 |
| **生视频** | 首帧 · 尾帧 · 运动 · 镜头语言 · 节奏 · 转场 · 分镜列表 | 分镜卡片，**简洁版 / 详细版 / 专业版**三种文本 |
| **自定义** | 自由正文 + 参数 | 写作、翻译、代码、工作流……任意结构 |

### 工作台调试
- `{{变量}}` 自动识别与填写，支持保存多组**变量预设**；
- 实时合成预览最终 Prompt，字符数与参数摘要一目了然；
- 试运行记录每次调试的变量、结果与备注——「我当时是怎么调的」可回溯；
- 一键**保存为新版本**、版本对比与回滚、另存为副本；
- 可选配置外部模型 API（OpenAI 兼容格式）真实试运行；未配置时本地调试完整可用。

### 精细仓库管理
- 多仓库 / 分组 / 标签三维组织，收藏、置顶、拖拽归类；
- 智能视图：最近使用、最近编辑、草稿、高频使用、长期未整理、有版本、待测试、待同步；
- 全局搜索（标题 / 正文 / 标签 / 变量名）即时过滤并高亮；
- 批量打标签、移动、导出、删除；删除先进回收站，批量删除可撤销。

### WebSocket 局域网同步
- 连接**任意** `ws://` / `wss://` 地址，随附通用中转脚本 `tools/relay.py`；
- 命名空间过滤（默认 `yanchi-vault`），心跳、自动重连、连接测试；
- 实时同步可开关；断线修改进入**离线队列**，恢复后自动补发；
- 多端冲突不粗暴覆盖：保留本地 / 采用远端 / 同时保留副本；
- 同步范围可选（全部 / 仅收藏 / 仅当前仓库），日志以可读语言呈现。

### 轻拟物浅色界面
- 暖纸底色、噪点肌理、柔和阴影与细腻高光，黄铜与印章红点缀；
- 思源宋体 × 思源黑体 × JetBrains Mono 的字体体系；
- 克制的动效：卡片浮现、明信片式最近编辑、同步呼吸点、收藏盖章；
- 遵循 `prefers-reduced-motion`，可在设置中进一步降低动效；
- **有意不提供深色模式**——这是一间白天的书房。

## 界面一览

打开应用即是工作台首页：问候语、散落明信片式的最近编辑、类型快捷印章、同步状态卡与待测试提醒；
左侧亚麻目录收纳仓库、分组与标签；右侧详情面板随时展开，专注模式（`\` 键）全屏编辑。

> 截图将陆续补充至 `docs/screenshots/`。

## 快速开始

### 方式一：一键启动器（推荐）

```bash
python launcher.py
```

启动器只使用 Python 标准库，零依赖。它会自动启动本地服务并打开浏览器，
窗口里显示「本地服务运行中」；离开时按 `Ctrl + C`，数据不受影响。

### 方式二：开发模式

```bash
npm install
npm run dev       # 开发预览
npm run build     # 构建到 dist/
```

构建产物是纯静态站点，可部署到任意静态托管；但请注意：**数据保存在访问者的浏览器本机**。

## 局域网同步指南

砚池的同步是「消息中转友好型」设计——服务端无需任何定制。
仓库随附一个 20 行的通用中转器：

```bash
pip install websockets
python tools/relay.py
```

脚本启动后会打印本机与局域网地址。在砚池「设置 → 局域网同步」填入
`ws://<局域网 IP>:8765`，点击连接即可。两台设备填写同一地址，
一台推送、另一台接收，冲突会温和地请你选择保留方式。

### 同步消息协议

砚池收发的 JSON 消息形如：

```jsonc
{
  "ns": "yanchi-vault",        // 命名空间，用于过滤无关消息
  "kind": "prompt" | "ping" | "pong" | "hello" | "test",
  "from": "设备名",
  "at": 1735689600000,
  "payload": { /* prompt 完整数据 */ }
}
```

收到 `ping` 回复 `pong`；收到 `prompt` 且本地更新时间更旧时直接采纳，
双方都改过则进入冲突中心。你可以让砚池连接任何支持广播的中转服务
（如 `websocat`、自建的 socket 服务等）。

## 备份文件格式

导出文件为自描述 JSON，便于自行处理与跨工具迁移：

```jsonc
{
  "app": "yanchi-prompt-vault",
  "format": 1,
  "exportedAt": "2026-01-01T12:00:00.000Z",
  "count": 42,
  "vaults": [...], "groups": [...], "tags": [...],
  "prompts": [ /* 含 versions / runs，取决于导出选项 */ ]
}
```

## 快捷键

| 按键 | 动作 | 按键 | 动作 |
| --- | --- | --- | --- |
| `⌘/Ctrl K` | 命令面板 | `⌘/Ctrl F` 或 `/` | 聚焦搜索 |
| `⌘/Ctrl N` | 新建提示词 | `⌘/Ctrl S` | 存为新版本 |
| `⌘/Ctrl ⇧ C` | 复制最终 Prompt | `⌘/Ctrl D` | 聚焦调试 |
| `↑ / ↓` | 上一条 / 下一条 | `⌘/Ctrl F` | 收藏 |
| `⌘/Ctrl ⌫` | 移入回收站 | `⌘/Ctrl Z` | 撤销删除 |
| `\` | 专注模式 | `⌘/Ctrl ,` | 设置 |
| `Esc` | 关闭弹层 / 退出专注 | `⌘/Ctrl ⇧ S` | 同步中心 |

## 技术栈

- **前端**：React 18 · TypeScript · Vite · Tailwind CSS v4
- **存储**：IndexedDB（localStorage 自动降级），纯离线架构
- **同步**：原生 WebSocket，无服务端依赖
- **字体**：思源宋体 / 思源黑体（SIL OFL 1.1）、JetBrains Mono（SIL OFL 1.1），经 Google Fonts 加载
- **启动器 / 中转器**：Python 3（标准库；中转器额外需要 `websockets`）

## 目录结构

```
├── launcher.py            # 一键本地启动器（零依赖）
├── tools/relay.py         # 局域网消息中转服务
├── LICENSE                # MIT
├── index.html
└── src/
    ├── App.tsx            # 应用外壳 · 三栏布局 · 全局快捷键
    ├── store.tsx          # 状态容器 · IndexedDB 持久化 · Toast
    ├── lib.ts             # 数据模型 · 变量系统 · Prompt 合成引擎
    ├── seed.ts            # 内置示例数据
    ├── sync.ts            # WebSocket 同步引擎
    ├── Sidebar.tsx        # 导航 / 智能视图 / 目录 / 标签
    ├── Home.tsx           # 工作台首页
    ├── lists.tsx          # 仓库总览 / 列表 / 回收站
    ├── Editor.tsx         # 详情编辑面板
    ├── Workbench.tsx      # 调试工作台
    ├── SyncCenter.tsx     # 同步中心
    ├── Settings.tsx       # 设置 / 导入导出 / 关于
    ├── CommandPalette.tsx # ⌘K 命令面板
    └── ui.tsx             # 图标库与基础组件
```

## 开源协议

本项目以 **[MIT 协议](LICENSE)** 开源——欢迎使用、修改与再分发，保留版权声明即可。

第三方致谢：

- [React](https://github.com/facebook/react)、[Vite](https://github.com/vitejs/vite)、[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — MIT License
- [Noto Serif SC / Noto Sans SC](https://fonts.google.com)、[JetBrains Mono](https://www.jetbrains.com/lp/mono/) — SIL Open Font License 1.1

> 发布到 GitHub 前，可将 `LICENSE` 中的 `Yanchi Contributors` 替换为你的名字或组织名。

## 路线图

- [ ] 分组的键盘与拖拽排序体验优化
- [ ] 版本差异的逐行高亮视图
- [ ] 浏览器标签页 / Web Share 快速收集入口
- [ ] 更多内置模板（客服、营销、代码评审……）
- [ ] PWA 安装与离线图标

## 常见问题

**Q：数据存在哪里？换浏览器会丢吗？**
数据存在当前浏览器的 IndexedDB 中，不经过任何服务器。清除浏览器数据前，请在「设置 → 导入导出」导出备份；跨设备请用局域网同步或备份文件搬家。

**Q：为什么没有深色模式？**
砚池的视觉语言围绕纸张、奶油与暖光建立，深色模式不在这件作品的设计意图之内。这是刻意的取舍，而非遗漏。

**Q：同步安全吗？**
同步走你自己局域网里的 WebSocket 地址，数据点对点中转；密钥类设置（如外部模型 API Key）也仅保存在本机浏览器。

**Q：可以商用吗？**
MIT 协议允许商用，保留 LICENSE 即可。

---

<p align="center"><b>砚池</b> · 愿你的每一条提示词，都有处安放。</p>
