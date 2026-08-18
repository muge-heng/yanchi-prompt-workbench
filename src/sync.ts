import type { Prompt } from "./lib";

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
      this.log("sys", "地址无效：需要以 ws:// 或 wss:// 开头", false);
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
      this.log("sys", this.retries === 0 ? `正在连接 ${this.url} …` : `第 ${this.retries} 次重连 ${this.url} …`);
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        this.retries = 0;
        this.status("online");
        this.log("sys", "连接成功，已加入频道 #" + this.ns);
        this.send({ type: "hello" });
        this.hb = setInterval(() => this.send({ type: "ping" }), 25_000);
      };

      ws.onmessage = (ev) => {
        let d: any = null;
        try { d = JSON.parse(String(ev.data)); } catch { d = null; }
        if (!d || typeof d !== "object") {
          this.log("in", "收到非 JSON 消息（已忽略）", true, String(ev.data).slice(0, 160));
          return;
        }
        if (d.ns && d.ns !== this.ns) {
          this.log("in", `其他频道的消息（#${d.ns}，已忽略）`, true, String(ev.data).slice(0, 160));
          return;
        }
        if (!d.type) {
          this.log("in", "收到未识别消息（已忽略，可在日志查看原文）", true, String(ev.data).slice(0, 160));
          return;
        }
        switch (d.type) {
          case "hello":
            this.log("in", `设备「${d.device || "未知"}」已上线`);
            this.send({ type: "hello-ack", to: d.device });
            break;
          case "hello-ack":
            this.log("in", `「${d.device || "远端"}」回应了问候`);
            break;
          case "ping":
            this.send({ type: "pong" });
            break;
          case "pong":
            break;
          case "test":
            this.log("in", `收到测试消息：${d.note || ""}（服务端收发正常）`);
            break;
          case "push":
            if (d.prompt && d.prompt.id) {
              this.log("in", `收到「${d.prompt.title || "未命名"}」来自 ${d.device || "远端"}`);
              this.opts.onRemotePrompt(d.prompt as Prompt);
            }
            break;
          case "scope-push":
            if (Array.isArray(d.prompts)) {
              this.log("in", `收到远端快照（${d.prompts.length} 条）来自 ${d.device || "远端"}`);
              (d.prompts as Prompt[]).forEach((p) => p && p.id && this.opts.onRemotePrompt(p));
            }
            break;
          default:
            this.log("in", `收到消息 type=${d.type}（已按未知类型忽略）`, true, String(ev.data).slice(0, 160));
        }
      };

      ws.onerror = () => {
        this.log("sys", "连接出现错误，请确认服务已启动且设备在同一网络", false);
      };

      ws.onclose = () => {
        this.clearHb();
        if (this.manualClose) {
          this.status("off");
          this.log("sys", "已断开连接");
          return;
        }
        if (this.retries < 3) {
          this.retries++;
          this.status("reconnecting");
          this.log("sys", `连接中断，${this.retries * 2} 秒后自动重连…`, false);
          this.retryTimer = setTimeout(() => this.open(), this.retries * 2000);
        } else {
          this.status("error");
          this.log("sys", "多次重连失败。请确认 WebSocket 服务已启动，并且本机与服务在同一局域网。", false);
        }
      };
    } catch (e: any) {
      this.status("error");
      this.log("sys", `无法建立连接：${e?.message || "未知原因"}`, false);
    }
  }

  send(obj: Record<string, any>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    const payload = { ns: this.ns, device: this.device, app: "yanchi", ...obj };
    this.ws.send(JSON.stringify(payload));
    if (obj.type === "push" && obj.prompt) this.log("out", `推送「${obj.prompt.title || "未命名"}」`);
    else if (obj.type === "scope-push") this.log("out", `推送快照（${obj.count} 条）`);
    else if (obj.type === "test") this.log("out", "发送测试消息");
    else if (obj.type === "hello") this.log("out", `问候频道内的其他设备（我是「${this.device}」）`);
    return true;
  }

  close() {
    this.manualClose = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.cleanupSocket();
    this.status("off");
    this.log("sys", "已主动断开连接");
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

export const SYNC_STATUS_TEXT: Record<SyncStatus, string> = {
  off: "未连接",
  connecting: "正在连接",
  online: "已连接",
  reconnecting: "重连中",
  error: "连接失败",
};

export const SYNC_STATUS_COLOR: Record<SyncStatus, string> = {
  off: "var(--ink-3)",
  connecting: "var(--warn)",
  online: "var(--ok)",
  reconnecting: "var(--warn)",
  error: "var(--err)",
};
