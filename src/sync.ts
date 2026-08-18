import type { Prompt } from "./lib";
import { tt } from "./lib";

export type SyncStatus = "off" | "connecting" | "online" | "reconnecting" | "error";

export interface SyncLog {
  id: string; at: number; dir: "in" | "out" | "sys";
  text: string; ok: boolean; raw?: string;
}

interface EngineOpts {
  onStatus: (s: SyncStatus) => void;
  onLog: (l: SyncLog) => void;
  onRemotePrompt: (p: Prompt) => void;
}

const lid = () => Math.random().toString(36).slice(2, 10);

/**
 * 消息中转型同步引擎：
 * 不假设服务端实现了业务逻辑，只要求它能转发文本。
 * 所有消息携带命名空间 ns，收到非本应用消息时安静忽略（仅记入高级日志）。
 */
export class SyncEngine {
  private ws: WebSocket | null = null;
  private opts: EngineOpts;
  private ns = "prompt-vault";
  private device = "我的书桌";
  private manualClose = false;
  private retries = 0;
  private hb: any = null;
  private retryTimer: any = null;
  private url = "";

  constructor(opts: EngineOpts) { this.opts = opts; }

  private log(dir: SyncLog["dir"], text: string, ok = true, raw?: string) {
    this.opts.onLog({ id: lid(), at: Date.now(), dir, text, ok, raw });
  }
  private status(s: SyncStatus) { this.opts.onStatus(s); }

  connect(url: string, ns: string, device: string) {
    this.url = url; this.ns = ns || "prompt-vault"; this.device = device || "我的书桌";
    if (!/^wss?:\/\//i.test(url)) {
      this.log("sys", tt("地址无效：需要以 ws:// 或 wss:// 开头", "Invalid address: it must start with ws:// or wss://"), false);
      this.status("error");
      return;
    }
    this.manualClose = false;
    this.retries = 0;
    this.open();
  }

  private open() {
    try {
      this.cleanupSocket();
      this.status(this.retries === 0 ? "connecting" : "reconnecting");
      this.log("sys", this.retries === 0 ? tt(`正在连接 ${this.url} …`, `Connecting to ${this.url} …`) : tt(`第 ${this.retries} 次重连 ${this.url} …`, `Reconnecting (attempt ${this.retries}) ${this.url} …`));
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        this.retries = 0;
        this.status("online");
        this.log("sys", tt("连接成功，已加入频道", "Connected — joined channel") + " #" + this.ns);
        this.send({ type: "hello" });
        this.hb = setInterval(() => this.send({ type: "ping" }), 25_000);
      };

      ws.onmessage = (ev) => {
        let d: any = null;
        try { d = JSON.parse(String(ev.data)); } catch { d = null; }
        if (!d || typeof d !== "object") {
          this.log("in", tt("收到非 JSON 消息（已忽略）", "Non-JSON message received (ignored)"), true, String(ev.data).slice(0, 160));
          return;
        }
        if (d.ns && d.ns !== this.ns) {
          this.log("in", tt(`其他频道的消息（#${d.ns}，已忽略）`, `Message from another channel (#${d.ns}, ignored)`), true, String(ev.data).slice(0, 160));
          return;
        }
        if (!d.type) {
          this.log("in", tt("收到未识别消息（已忽略，可在日志查看原文）", "Unrecognized message received (ignored — raw text available in log)"), true, String(ev.data).slice(0, 160));
          return;
        }
        switch (d.type) {
          case "hello":
            this.log("in", tt(`设备「${d.device || "未知"}」已上线`, `Device “${d.device || "unknown"}” is online`));
            this.send({ type: "hello-ack", to: d.device });
            break;
          case "hello-ack":
            this.log("in", tt(`「${d.device || "远端"}」回应了问候`, `“${d.device || "remote"}” replied to the greeting`));
            break;
          case "ping":
            this.send({ type: "pong" });
            break;
          case "pong":
            break;
          case "test":
            this.log("in", tt(`收到测试消息：${d.note || ""}（服务端收发正常）`, `Test message received: ${d.note || ""} (server relay works)`));
            break;
          case "push":
            if (d.prompt && d.prompt.id) {
              this.log("in", tt(`收到「${d.prompt.title || "未命名"}」来自 ${d.device || "远端"}`, `Received “${d.prompt.title || "untitled"}” from ${d.device || "remote"}`));
              this.opts.onRemotePrompt(d.prompt as Prompt);
            }
            break;
          case "scope-push":
            if (Array.isArray(d.prompts)) {
              this.log("in", tt(`收到远端快照（${d.prompts.length} 条）来自 ${d.device || "远端"}`, `Received remote snapshot (${d.prompts.length} items) from ${d.device || "remote"}`));
              (d.prompts as Prompt[]).forEach((p) => p && p.id && this.opts.onRemotePrompt(p));
            }
            break;
          default:
            this.log("in", tt(`收到消息 type=${d.type}（已按未知类型忽略）`, `Message type=${d.type} received (unknown type, ignored)`), true, String(ev.data).slice(0, 160));
        }
      };

      ws.onerror = () => {
        this.log("sys", tt("连接出现错误，请确认服务已启动且设备在同一网络", "Connection error — make sure the service is running and devices share a network"), false);
      };

      ws.onclose = () => {
        this.clearHb();
        if (this.manualClose) {
          this.status("off");
          this.log("sys", tt("已断开连接", "Disconnected"));
          return;
        }
        if (this.retries < 3) {
          this.retries++;
          this.status("reconnecting");
          this.log("sys", tt(`连接中断，${this.retries * 2} 秒后自动重连…`, `Connection lost — auto-reconnecting in ${this.retries * 2}s…`), false);
          this.retryTimer = setTimeout(() => this.open(), this.retries * 2000);
        } else {
          this.status("error");
          this.log("sys", tt("多次重连失败。请确认 WebSocket 服务已启动，并且本机与服务在同一局域网。", "Reconnection failed repeatedly. Check that the WebSocket service is running on the same LAN."), false);
        }
      };
    } catch (e: any) {
      this.status("error");
      this.log("sys", tt(`无法建立连接：${e?.message || "未知原因"}`, `Failed to connect: ${e?.message || "unknown reason"}`), false);
    }
  }

  send(obj: Record<string, any>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    const payload = { ns: this.ns, device: this.device, app: "yanchi", ...obj };
    this.ws.send(JSON.stringify(payload));
    if (obj.type === "push" && obj.prompt) this.log("out", tt(`推送「${obj.prompt.title || "未命名"}」`, `Pushed “${obj.prompt.title || "untitled"}”`));
    else if (obj.type === "scope-push") this.log("out", tt(`推送快照（${obj.count} 条）`, `Pushed snapshot (${obj.count} items)`));
    else if (obj.type === "test") this.log("out", tt("发送测试消息", "Sent test message"));
    else if (obj.type === "hello") this.log("out", tt(`问候频道内的其他设备（我是「${this.device}」）`, `Greeting other devices in the channel (I am “${this.device}”)`));
    return true;
  }

  close() {
    this.manualClose = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.cleanupSocket();
    this.status("off");
    this.log("sys", tt("已主动断开连接", "Disconnected by you"));
  }

  private clearHb() { if (this.hb) { clearInterval(this.hb); this.hb = null; } }
  private cleanupSocket() {
    this.clearHb();
    if (this.ws) {
      try {
        this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
        this.ws.close();
      } catch { /* noop */ }
      this.ws = null;
    }
  }
}

/* 连接状态文案（中英双语）。Connection status labels (bilingual). */
export const syncStatusText = (s: SyncStatus): string => {
  switch (s) {
    case "off": return tt("未连接", "Not connected");
    case "connecting": return tt("正在连接", "Connecting");
    case "online": return tt("已连接", "Connected");
    case "reconnecting": return tt("重连中", "Reconnecting");
    case "error": return tt("连接失败", "Connection failed");
  }
};

export const SYNC_STATUS_COLOR: Record<SyncStatus, string> = {
  off: "var(--ink-3)",
  connecting: "var(--warn)",
  online: "var(--ok)",
  reconnecting: "var(--warn)",
  error: "var(--err)",
};
