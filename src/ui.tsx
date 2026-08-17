import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { cx, TYPE_META, type PromptType } from "./lib";
import { SYNC_STATUS_COLOR, SYNC_STATUS_TEXT, type SyncStatus } from "./sync";

/* ================= 手绘线性图标库 ================= */
const PATHS: Record<string, ReactNode> = {
  home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.8 10v9.8h12.4V10" /><path d="M10 19.8v-5h4v5" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.4" /><rect x="13" y="4" width="7" height="7" rx="1.4" /><rect x="4" y="13" width="7" height="7" rx="1.4" /><rect x="13" y="13" width="7" height="7" rx="1.4" /></>,
  sync: <><path d="M4.3 9.2a8 8 0 0 1 13.9-2.7l1.9 2.1" /><path d="M20.1 4.3v4.3h-4.3" /><path d="M19.7 14.8a8 8 0 0 1-13.9 2.7l-1.9-2.1" /><path d="M3.9 19.7v-4.3h4.3" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" /><path d="M6.5 7l.9 12.1a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" /><path d="M10.2 11v5.5M13.8 11v5.5" /></>,
  settings: <><circle cx="12" cy="12" r="3.6" /><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.2 5.2 7 7M17 17l1.8 1.8M18.8 5.2 17 7M7 17l-1.8 1.8" /></>,
  search: <><circle cx="11" cy="11" r="6.6" /><path d="M20 20l-3.6-3.6" /></>,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  star: <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />,
  copy: <><rect x="8.8" y="8.8" width="11.2" height="11.2" rx="2" /><path d="M5 15.2V5.5A1.5 1.5 0 0 1 6.5 4h9.7" /></>,
  check: <path d="M4.5 12.6l5 5L19.5 6.8" />,
  pen: <><path d="M4 20l1-4L16.4 4.6a2.1 2.1 0 0 1 3 3L8 19z" /><path d="M13.6 6.4l3 3" /></>,
  tag: <><path d="M3.8 12.4V4.3a.5.5 0 0 1 .5-.5h8.1L20.7 12l-8.2 8.2z" /><circle cx="8.1" cy="8.1" r="1.3" /></>,
  folder: <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.6l1.9 2.4h7.5A1.5 1.5 0 0 1 20.5 9.4V18A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />,
  clock: <><circle cx="12" cy="12" r="8.3" /><path d="M12 7.2V12l3.4 2" /></>,
  bolt: <path d="M13.2 2.5 4.8 13.6h6L10 21.5l8.4-11.1h-6z" />,
  history: <><path d="M3.8 12a8.2 8.2 0 1 0 2.4-5.8L3.8 8.6" /><path d="M3.8 4.2v4.4h4.4" /><path d="M12 7.6V12l3 2.1" /></>,
  agent: <><rect x="5" y="8.2" width="14" height="10.6" rx="2.6" /><path d="M12 8.2V5.6" /><circle cx="12" cy="4.4" r="1.1" /><path d="M9.4 12.6v1.8M14.6 12.6v1.8" /><path d="M2.8 12.5v3M21.2 12.5v3" /></>,
  chat: <path d="M4 6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v6.4a2.8 2.8 0 0 1-2.8 2.8H12l-4.8 3.9V16H6.8A2.8 2.8 0 0 1 4 13.2z" />,
  image: <><rect x="3.8" y="5" width="16.4" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4.5 17.5 10 12l3.8 3.8 2.7-2.7 3 3" /></>,
  video: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.4" /><path d="M10.4 9.4v5.2l4.6-2.6z" /></>,
  doc: <><path d="M13.8 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.2z" /><path d="M13.8 3.5v4.7h4.7" /><path d="M9 13.2h6M9 16.6h6" /></>,
  chevD: <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  chevR: <path d="M9.5 6.5L15 12l-5.5 5.5" />,
  chevL: <path d="M14.5 6.5L9 12l5.5 5.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  pin: <><path d="M9.2 3.5h5.6l-.7 6.1 2.7 3.4H7.2l2.7-3.4z" /><path d="M12 13v7.5" /></>,
  send: <><path d="M4 11.6 20 4.4l-4.4 15.8-3.9-6.3z" /><path d="M11.7 13.9 20 4.4" /></>,
  download: <><path d="M12 4v10.6" /><path d="M7.5 10.4 12 15l4.5-4.6" /><path d="M4.5 19.5h15" /></>,
  upload: <><path d="M12 15V4.4" /><path d="M7.5 8.6 12 4l4.5 4.6" /><path d="M4.5 19.5h15" /></>,
  wifi: <><path d="M2.8 9.3a14.6 14.6 0 0 1 18.4 0" /><path d="M5.8 12.7a10.2 10.2 0 0 1 12.4 0" /><path d="M8.8 16a5.8 5.8 0 0 1 6.4 0" /><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none" /></>,
  inbox: <><path d="M4 13.5h4.4l1.5 2.4h4.2l1.5-2.4H20" /><path d="M4 13.5V18A1.6 1.6 0 0 0 5.6 19.6h12.8A1.6 1.6 0 0 0 20 18v-4.5" /><path d="M4 13.5 6.3 5.4A1.5 1.5 0 0 1 7.8 4.3h8.4a1.5 1.5 0 0 1 1.5 1.1L20 13.5" /></>,
  briefcase: <><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M8.5 7.5V6A1.5 1.5 0 0 1 10 4.5h4A1.5 1.5 0 0 1 15.5 6v1.5" /><path d="M3.5 12.5h17" /></>,
  command: <><path d="M9 9V7.2A2.7 2.7 0 1 0 6.3 9.9H9zm0 0h6m-6 0v6m6-6V7.2a2.7 2.7 0 1 1 2.7 2.7H15zm0 0v6m0 0h1.8a2.7 2.7 0 1 1-2.7 2.7V15zm-6 0H7.2A2.7 2.7 0 1 0 9.9 17.7V15z" /></>,
  undo: <><path d="M7.2 4.8 3.6 8.4l3.6 3.6" /><path d="M3.6 8.4h10.9a5.4 5.4 0 1 1 0 10.8h-3.4" /></>,
  filter: <path d="M4.5 5.5h15l-5.9 6.8v5.6l-3.2-1.9v-3.7z" />,
  layers: <><path d="M12 3.6 3.8 8 12 12.4 20.2 8z" /><path d="M4.6 12.3 12 16.3l7.4-4" /><path d="M4.6 16.2 12 20.2l7.4-4" /></>,
  eye: <><path d="M2.8 12S6.4 5.8 12 5.8 21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12z" /><circle cx="12" cy="12" r="2.9" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="18.5" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  sparkle: <path d="M12 3.4l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z" />,
  move: <><path d="M5 9.2V5h4.2" /><path d="M14.8 5H19v4.2" /><path d="M19 14.8V19h-4.2" /><path d="M9.2 19H5v-4.2" /></>,
  book: <><path d="M4.5 5.6A2.6 2.6 0 0 1 7.1 3H19.5v15.4H7.1a2.6 2.6 0 0 0-2.6 2.6z" /><path d="M19.5 15.8H7.1a2.6 2.6 0 0 0-2.6 2.6" /></>,
  link: <><path d="M9.5 14.5 14.5 9.5" /><path d="M11 6.8 13 4.8a3.4 3.4 0 0 1 4.8 4.8L15.8 11.6" /><path d="M13 17.2 11 19.2a3.4 3.4 0 0 1-4.8-4.8l2-2" /></>,
  collapse: <><path d="M8.5 5 4 12l4.5 7" /><path d="M15.5 5 20 12l-4.5 7" /></>,
  expand: <><path d="M4 8.5 12 4l7 4.5" /><path d="M4 15.5 12 20l7-4.5" /></>,
};

export function Icon({ name, size = 16, className, sw = 1.7 }: { name: string; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" className={cx("flex-none", className)} aria-hidden>
      {PATHS[name] || <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

/* ================= 类型徽章 ================= */
export function TypeBadge({ type, text = true, size = "md" }: { type: PromptType; text?: boolean; size?: "sm" | "md" }) {
  const m = TYPE_META[type];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-lg border font-medium",
      size === "sm" ? "px-1.5 py-[2px] text-[10.5px]" : "px-2 py-[3px] text-[11px]")}
      style={{ color: m.color, borderColor: "color-mix(in srgb, " + m.color + " 40%, var(--line))", background: "color-mix(in srgb, " + m.color + " 9%, var(--card))" }}>
      <Icon name={m.icon} size={size === "sm" ? 11 : 12.5} />
      {text && m.label}
    </span>
  );
}

export function SyncDot({ status, text = true }: { status: SyncStatus; text?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--ink-2)" }}>
      <span className={cx("dot", status === "online" && "breathe")} style={{ background: SYNC_STATUS_COLOR[status] }} />
      {text && SYNC_STATUS_TEXT[status]}
    </span>
  );
}

/* ================= 开关 ================= */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label}
      className={cx("toggle", on && "on")} onClick={() => onChange(!on)} />
  );
}

/* ================= 弹层 ================= */
export function Modal({ open, onClose, title, children, width = 460 }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-5" role="dialog" aria-modal>
      <div className="absolute inset-0" style={{ background: "rgba(59, 50, 33, 0.34)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="pop-in card relative max-h-[86vh] w-full overflow-auto thin-scroll" style={{ maxWidth: width, boxShadow: "var(--shadow-lift)" }}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <div className="title-serif text-[15px] font-bold">{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label="关闭"><Icon name="close" size={15} /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onOk, title, desc, okText = "确认", danger = true }:
  { open: boolean; onClose: () => void; onOk: () => void; title: string; desc?: ReactNode; okText?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={400}>
      {desc && <div className="mb-5 text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{desc}</div>}
      <div className="flex justify-end gap-2.5">
        <button className="btn" onClick={onClose}>取消</button>
        <button className={cx("btn", danger ? "btn-danger" : "btn-primary")} onClick={() => { onOk(); onClose(); }}>{okText}</button>
      </div>
    </Modal>
  );
}

/* ================= 滚动浮现 ================= */
export function Reveal({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add("in"); ob.disconnect(); } }),
      { threshold: 0.08 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx("rise", className)} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ================= 空状态 ================= */
export function EmptyState({ icon = "inbox", title, desc, children }: { icon?: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
        style={{ borderColor: "var(--line-2)", background: "linear-gradient(180deg, var(--card), var(--card-2))", boxShadow: "var(--inset)", color: "var(--ink-3)" }}>
        <Icon name={icon} size={26} sw={1.4} />
      </div>
      <div className="title-serif mb-1.5 text-[16px] font-bold">{title}</div>
      {desc && <div className="mb-5 max-w-[300px] text-[12.5px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{desc}</div>}
      {children && <div className="flex flex-wrap items-center justify-center gap-2.5">{children}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/* ================= 段落标题（雕刻感） ================= */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="engrave title-serif flex items-center gap-2 text-[13px] font-bold tracking-wide">
        <span className="inline-block h-[3px] w-[3px] rounded-full" style={{ background: "var(--brass-2)" }} />
        {children}
      </div>
      {right}
    </div>
  );
}

/* ================= 复制按钮（勾选动效） ================= */
export function CopyBtn({ text, label = "复制", size = "md", className, onCopied }: { text: string; label?: string; size?: "sm" | "md"; className?: string; onCopied?: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={cx("btn", ok && "btn-primary", size === "sm" && "!px-2.5 !py-[6px] !text-[12px]", className)}
      onClick={async () => {
        const { copyText } = await import("./lib");
        const r = await copyText(text);
        if (r) {
          setOk(true);
          onCopied?.();
          setTimeout(() => setOk(false), 1400);
        }
      }}
    >
      {ok ? <Icon name="check" size={13} className="check-draw" /> : <Icon name="copy" size={13} />}
      {ok ? "已复制" : label}
    </button>
  );
}
