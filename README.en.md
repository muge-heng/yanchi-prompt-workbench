<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/a3678a9b-3b49-46f3-8a15-93b69355e62e/_result.png" alt="Yanchi — A Private Prompt Vault & Workbench" width="720" />
</p>

<h1 align="center">Yanchi · Private Prompt Workbench</h1>

<p align="center">
  <b>砚池 — A Private Prompt Vault & Workbench</b><br/>
  Local-first · Skeuomorphic-lite · An AI prompt asset library built for the long run
</p>

<p align="center">
  <a href="README.md">中文</a> | <b>English</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-8a6a2f?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Storage-IndexedDB_local--first-5c6b52?style=flat-square" alt="Local-first" />
  <img src="https://img.shields.io/badge/Sync-WebSocket_LAN-46526a?style=flat-square" alt="LAN Sync" />
  <img src="https://img.shields.io/badge/i18n-中文_English-8a5a5a?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/Python-zero--dep_launcher-f2ece0?style=flat-square" alt="Python Launcher" />
</p>

---
> 🚀 **Live demo: [https://muge-heng.github.io/yanchi-prompt-workbench/](https://muge-heng.github.io/yanchi-prompt-workbench/)**
All data stays in your browser. Nothing is ever uploaded to a server.

## In one sentence

**Yanchi** is a private workbench for treating AI prompts as long-lived *assets*.
It builds a quiet, paper-textured vault inside your browser where you can collect,
organize, debug, and reuse Agent / Chat / Image / Video prompts — and sync them
across your desktop, laptop, tablet, and phone over your local network, with no
cloud service required.

It is deliberately *not*: a CRUD admin panel, a cold form builder, or a dark
cyberpunk dashboard. It aims to be a desk tool you can live with for years —
**quiet, beautiful, reliable**.

## Why it exists

- Prompts are scattered across chat logs, docs, bookmarks, and code snippets, hard to manage;
- Agent, image, and video prompts have completely different structures that plain notes can't hold;
- Debugging means copy-pasting, filling variables, and switching windows — a fragmented loop;
- You want your data to stay local and private, yet sync across devices on your LAN;
- A tool should look good and feel ordered, not like a rough default form.

## Feature overview

### Local-first data
- Data lives in your browser by default (IndexedDB + a localStorage fallback) and **works fully offline**;
- Edits autosave with a gentle "Saved to this device" hint — never intrusive;
- One-click JSON backup export (optionally including version history), with preview before import;
- Import conflicts offer **overwrite / skip / keep-as-copy** strategies.

### Multi-type prompt assets
| Type | Structured fields | Highlights |
| --- | --- | --- |
| **Agent** | Role · Capabilities · Tools · Tool rules · Memory · Forbidden · Example dialog | Examples as chat bubbles; preview the full system prompt while debugging |
| **Chat** | Goal · System prompt · Multi-turn messages · Style/tone/length · Taboos | user/assistant role switching; add, remove, reorder messages |
| **Image** | Subject · Style · Composition · Lighting · Camera · Color · Texture · Negative prompt | Quick visual tags; **plain / with-params / by-field** copy formats |
| **Video** | First frame · Last frame · Movement · Lens · Pacing · Transition · Shot list | Shot cards; **brief / detailed / pro** text formats |
| **Custom** | Free-form body + params | Writing, translation, code, workflows… any structure |

### Type Center (customizable types)
- Not happy with a preset type's fields? The **Type Center** lets you reshape any type like building blocks;
- Add / remove / toggle fields, pick each field's icon and control kind (single-line / multi-line / chat / shots);
- When creating a type, choose its icon, accent color, and composition strategy, or duplicate an existing type and tweak it;
- Built-in types can be reset to defaults; custom types can be deleted entirely.

### Workbench debugging
- `{{variables}}` are auto-detected and fillable, with saveable **variable presets**;
- Live-composed preview of the final prompt, with character count and param summary;
- Trial runs log the variables, result, and notes of every debug session — "how did I tune this?" stays answerable;
- One-click **save as new version**, version compare & rollback, save-as-copy;
- Optionally wire up an external model API (OpenAI-compatible) for real trial runs; without it, local debugging is fully functional.

### Fine-grained vault management
- Organize in three dimensions: vaults / groups / tags, plus favorites, pinning, drag-to-file;
- Smart views: recently used, recently edited, drafts, heavy use, long untouched, versioned, to-test, pending sync;
- Global search (title / body / tags / variable names) filters instantly with highlighting;
- Bulk tag, move, export, delete; deletes go to Trash first, bulk deletes are undoable.

### WebSocket LAN sync
- Connect to **any** `ws://` / `wss://` address; a generic relay script `tools/relay.py` is included;
- Namespace filtering (default `yanchi-vault`), heartbeat, auto-reconnect, connection test;
- Realtime sync is toggleable; offline edits queue up and resend automatically on reconnect;
- Multi-device conflicts never clobber: keep local / take remote / keep both as copies;
- Sync scope is selectable (all / favorites only / current vault), logs in plain language.

### Skeuomorphic-lite light UI · Bilingual
- Warm paper base, grain texture, soft shadows and subtle highlights, brass and seal-red accents;
- A type system of Noto Serif × Noto Sans × JetBrains Mono;
- Restrained motion: card reveals, postcard-style recent edits, a breathing sync dot, a stamp-on favorite;
- Respects `prefers-reduced-motion`, with further reduction available in Settings;
- **Chinese / English bilingual**: auto-picks your system language on first launch, switchable anytime in Settings;
- Each sidebar section (smart views / vaults / tags / Type Center / sync card) can be shown or hidden in Settings;
- **Deliberately no dark mode** — this is a daylight study.

## A tour of the interface

Open the app and you land on the Workbench home: a greeting, postcard-scattered
recent edits, type quick-stamps, a sync status card, and to-test reminders. The
linen sidebar on the left holds vaults, groups, and tags; the detail panel opens
on the right, and Focus mode (the `\` key) goes full-screen for editing.

> Screenshots will be added to `docs/screenshots/`.

## Quick start

### Option 1: one-click launcher (recommended)

```bash
python launcher.py
```

The launcher uses only the Python standard library — zero dependencies. It starts
a local server and opens your browser, printing "local server running"; press
`Ctrl + C` to leave, your data is unaffected.

### Option 2: dev mode

```bash
npm install
npm run dev       # dev preview
npm run build     # build to dist/
```

The build output is a pure static site you can host anywhere; just remember
**data lives in each visitor's own browser**.

## LAN sync guide

Yanchi's sync is "relay-friendly" by design — the server needs no customization.
A 20-line generic relay is included:

```bash
pip install websockets
python tools/relay.py
```

The script prints your local and LAN addresses. In Yanchi, go to
"Settings → LAN Sync", enter `ws://<LAN IP>:8765`, and click Connect. Fill in the
same address on two devices — one pushes, the other receives, and conflicts ask
you gently how to resolve.

### Sync message protocol

The JSON messages Yanchi sends/receives look like:

```jsonc
{
  "ns": "yanchi-vault",        // namespace, filters out unrelated traffic
  "kind": "prompt" | "ping" | "pong" | "hello" | "test",
  "from": "device name",
  "at": 1735689600000,
  "payload": { /* full prompt data */ }
}
```

On `ping`, reply `pong`; on a `prompt` whose local copy is older, adopt it;
if both sides changed, it lands in the Conflict Center. You can point Yanchi at
any broadcast-capable relay (`websocat`, your own socket service, etc.).

## Backup file format

Exports are self-describing JSON, easy to process or migrate between tools:

```jsonc
{
  "app": "yanchi-prompt-vault",
  "format": 1,
  "exportedAt": "2026-01-01T12:00:00.000Z",
  "count": 42,
  "vaults": [...], "groups": [...], "tags": [...],
  "prompts": [ /* includes versions / runs, depending on export options */ ]
}
```

## Keyboard shortcuts

| Key | Action | Key | Action |
| --- | --- | --- | --- |
| `⌘/Ctrl K` | Command palette | `⌘/Ctrl F` or `/` | Focus search |
| `⌘/Ctrl N` | New prompt | `⌘/Ctrl S` | Save as version |
| `⌘/Ctrl ⇧ C` | Copy final prompt | `⌘/Ctrl D` | Focus debugger |
| `↑ / ↓` | Previous / next | `⌘/Ctrl F` | Favorite |
| `⌘/Ctrl ⌫` | Move to Trash | `⌘/Ctrl Z` | Undo delete |
| `\` | Focus mode | `⌘/Ctrl ,` | Settings |
| `Esc` | Close overlay / exit focus | `⌘/Ctrl ⇧ S` | Sync Center |

## Tech stack

- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS v4
- **Storage**: IndexedDB (auto-fallback to localStorage), a purely offline architecture
- **Sync**: native WebSocket, no server dependency
- **Fonts**: Noto Serif SC / Noto Sans SC (SIL OFL 1.1), JetBrains Mono (SIL OFL 1.1), via Google Fonts
- **Launcher / relay**: Python 3 (stdlib; the relay additionally needs `websockets`)

## Project structure

```
├── launcher.py            # one-click local launcher (zero deps)
├── tools/relay.py         # LAN message relay service
├── LICENSE                # MIT
├── index.html
└── src/
    ├── App.tsx            # app shell · 3-column layout · global shortcuts
    ├── store.tsx          # state container · IndexedDB persistence · toasts
    ├── lib.ts             # data model · variable system · prompt composer · type registry
    ├── seed.ts            # built-in sample data (bilingual)
    ├── sync.ts            # WebSocket sync engine
    ├── Sidebar.tsx        # nav / smart views / directory / tags
    ├── Home.tsx           # workbench home
    ├── lists.tsx          # vault overview / list / trash
    ├── Editor.tsx         # detail editor panel
    ├── Workbench.tsx      # debug workbench
    ├── TypeManager.tsx    # Type Center · create/edit types
    ├── SyncCenter.tsx     # sync center
    ├── Settings.tsx       # settings / language / import-export / about
    ├── CommandPalette.tsx # ⌘K command palette
    └── ui.tsx             # icon library & base components
```

## License

This project is open-sourced under the **[MIT License](LICENSE)** — use, modify,
and redistribute freely; just keep the copyright notice.

Third-party credits:

- [React](https://github.com/facebook/react), [Vite](https://github.com/vitejs/vite), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — MIT License
- [Noto Serif SC / Noto Sans SC](https://fonts.google.com), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — SIL Open Font License 1.1

> Before publishing to GitHub, you may replace `Yanchi Contributors` in `LICENSE` with your own name or org.


## FAQ

**Q: Where is my data? Will I lose it if I switch browsers?**
Data lives in the current browser's IndexedDB and never touches a server. Before
clearing browser data, export a backup in "Settings → Import/Export"; to move
across devices, use LAN sync or a backup file.

**Q: Why is there no dark mode?**
Yanchi's visual language is built around paper, cream, and warm light; dark mode
is outside this piece's design intent. It's a deliberate trade-off, not an oversight.

**Q: Is sync secure?**
Sync runs over a WebSocket address on *your own* LAN, relayed point-to-point;
secret settings (like an external model API key) also stay in your local browser.

**Q: Can I use it commercially?**
Yes — the MIT license permits commercial use; just keep the LICENSE.

---

<p align="center"><b>Yanchi</b> · May every prompt you write have a place to rest.</p>
<p align="center"><a href="README.md">阅读中文版 →</a></p>
