"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, X, RotateCcw, ChevronRight } from "lucide-react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { apiFetch } from "@/services/api";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const robotData = require("@/public/robot.json");

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  navigate?: string;
};
type HistoryItem = { role: "user" | "assistant"; content: string };

let msgId = 0;
const GREETING =
  "Hey there! I'm DebtBot, your app guide. Ask me how anything works — or say something like \"take me to invoices\" and I'll go there!";
const SS_KEY = "debtbot_session";

/* ─── Session persistence ──────────────────────────────────────────────────── */
function loadSession(): {
  messages: Message[];
  history: HistoryItem[];
  typingDone: Record<number, boolean>;
  open: boolean;
} | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      messages: Message[];
      history: HistoryItem[];
      typingDone: Record<number, boolean>;
      open: boolean;
    };
  } catch {
    return null;
  }
}
function saveSession(
  messages: Message[],
  history: HistoryItem[],
  typingDone: Record<number, boolean>,
  open: boolean,
) {
  try {
    sessionStorage.setItem(
      SS_KEY,
      JSON.stringify({ messages, history, typingDone, open }),
    );
  } catch {
    /* noop */
  }
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes floatY {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    40%      { transform: translateY(-10px) rotate(-1.5deg); }
    70%      { transform: translateY(-5px) rotate(1deg); }
  }
  @keyframes panelFromRobot {
    0%   { opacity: 0; transform: scale(0.1) translate(0px, 55px); }
    60%  { opacity: 1; transform: scale(1.03) translate(0, 0); }
    100% { opacity: 1; transform: scale(1) translate(0, 0); }
  }
  @keyframes glowPulse {
    0%,100% { filter: drop-shadow(0 0 12px rgba(0,212,240,0.5)); }
    50%     { filter: drop-shadow(0 0 26px rgba(0,212,240,0.9)); }
  }
  .bot-float { animation: floatY 3.2s ease-in-out infinite, glowPulse 3.2s ease-in-out infinite; }
  .panel-enter { animation: panelFromRobot 0.42s cubic-bezier(0.34,1.18,0.64,1) both; transform-origin: bottom right; }
`;

/* ─── LottieRobot ──────────────────────────────────────────────────────────── */
function LottieRobot({
  size = 80,
  lottieRef,
}: {
  size?: number;
  lottieRef?: React.RefObject<LottieRefCurrentProps | null>;
}) {
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={robotData}
      loop
      autoplay
      style={{ width: size, height: size }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}

/* ─── Typewriter ───────────────────────────────────────────────────────────── */
// onDone is stored in a ref so it never triggers a re-run of the interval effect
function Typewriter({ text, onDone }: { text: string; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  const idxRef = useRef(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    // only reset when the text itself changes — interval overwrites shown on first tick
    idxRef.current = 0;
    const timer = setInterval(() => {
      idxRef.current++;
      setShown(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, 18);
    return () => clearInterval(timer);
  }, [text]); // ← only text, not onDone — prevents restart on every render

  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "#22d3ee",
            marginLeft: "2px",
            verticalAlign: "middle",
          }}
          className="animate-pulse"
        />
      )}
    </span>
  );
}

/* ─── Chat panel ───────────────────────────────────────────────────────────── */
function ChatPanel({
  messages,
  loading,
  input,
  setInput,
  onSend,
  onClose,
  onReset,
  typingDone,
  onTypingDone,
  containerRef,
}: {
  messages: Message[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  onReset: () => void;
  typingDone: Record<number, boolean>;
  onTypingDone: (id: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const lastBotMsg = [...messages].reverse().find((m) => m.role === "bot");
  const historyMsgs = messages.slice(0, -1);

  return (
    <div
      ref={containerRef}
      className="panel-enter"
      style={{
        position: "fixed",
        bottom: "100px",
        right: "16px",
        width: "340px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 9990,
        borderRadius: "20px",
        overflow: "hidden",
        background: "linear-gradient(145deg, #0d1829 0%, #0a1020 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,180,216,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,180,216,0.06)",
        }}
      >
        <div style={{ flexShrink: 0, marginBottom: "-4px" }}>
          <LottieRobot size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            DebtBot
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              marginTop: "1px",
            }}
          >
            AI App Guide
          </div>
        </div>
        <button
          onClick={onReset}
          title="New chat"
          style={{
            padding: "6px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateCcw style={{ width: 13, height: 13 }} />
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "6px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          height: "240px",
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* History messages (all except last bot) */}
        {historyMsgs.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                lineHeight: "1.45",
                padding: "8px 12px",
                borderRadius: "14px",
                maxWidth: "82%",
                wordBreak: "break-word",
                background:
                  msg.role === "user"
                    ? "rgba(37,99,235,0.75)"
                    : "rgba(255,255,255,0.08)",
                color: "#e2e8f0",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {/* Current / last bot message */}
        {lastBotMsg && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <span
              style={{
                fontSize: "13px",
                lineHeight: "1.5",
                padding: "8px 12px",
                borderRadius: "14px",
                maxWidth: "82%",
                wordBreak: "break-word",
                fontWeight: 500,
                background: "rgba(255,255,255,0.08)",
                color: "#f1f5f9",
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    gap: "5px",
                    alignItems: "center",
                    padding: "2px 0",
                  }}
                >
                  {[0, 140, 280].map((d) => (
                    <span
                      key={d}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22d3ee",
                        display: "inline-block",
                        animation: "bounce 1s ease-in-out infinite",
                        animationDelay: `${d}ms`,
                      }}
                    />
                  ))}
                </span>
              ) : typingDone[lastBotMsg.id] ? (
                lastBotMsg.text
              ) : (
                <Typewriter
                  text={lastBotMsg.text}
                  onDone={() => onTypingDone(lastBotMsg.id)}
                />
              )}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            padding: "8px 12px",
          }}
        >
          <ChevronRight
            style={{ width: 13, height: 13, color: "#22d3ee", flexShrink: 0 }}
          />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask me anything…"
            disabled={loading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "#f1f5f9",
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || loading}
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                !input.trim() || loading ? "rgba(255,255,255,0.1)" : "#06b6d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            <Send style={{ width: 13, height: 13, color: "white" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main widget ──────────────────────────────────────────────────────────── */
function initMessages(): Message[] {
  const s = loadSession();
  if (s && s.messages.length > 0) {
    // keep the msgId counter ahead of stored ids
    const maxId = Math.max(...s.messages.map((m) => m.id));
    if (maxId >= msgId) msgId = maxId + 1;
    return s.messages;
  }
  return [{ id: ++msgId, role: "bot", text: GREETING }];
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(() => loadSession()?.open ?? false);
  const [messages, setMessages] = useState<Message[]>(initMessages);
  const [history, setHistory] = useState<HistoryItem[]>(
    () => loadSession()?.history ?? [],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Restore typingDone: all stored messages are already done (we don't replay on reload)
  const [typingDone, setTypingDone] = useState<Record<number, boolean>>(() => {
    const s = loadSession();
    if (s) return s.typingDone;
    // Mark greeting as done so it doesn't play on every render
    return {};
  });
  const containerRef = useRef<HTMLDivElement>(null!);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const router = useRouter();

  const markDone = useCallback((id: number) => {
    setTypingDone((p) => {
      const next = { ...p, [id]: true };
      return next;
    });
  }, []);

  /* Persist to sessionStorage whenever state changes */
  useEffect(() => {
    saveSession(messages, history, typingDone, open);
  }, [messages, history, typingDone, open]);

  /* Outside click closes panel */
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const btn = document.getElementById("debtbot-trigger");
      if (btn?.contains(e.target as Node)) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* Periodic salute */
  useEffect(() => {
    if (open) return;
    const id = setInterval(() => {
      if (!lottieRef.current) return;
      lottieRef.current.setSpeed(2.8);
      const reset = setTimeout(() => lottieRef.current?.setSpeed(1), 2000);
      return () => clearTimeout(reset);
    }, 7000);
    return () => clearInterval(id);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { id: ++msgId, role: "user", text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);
    const newHistory: HistoryItem[] = [
      ...history,
      { role: "user", content: text },
    ];
    try {
      const res = await apiFetch<{ reply: string; navigate?: string }>(
        "/chatbot/message",
        {
          method: "POST",
          body: JSON.stringify({ message: text, history }),
        },
      );
      const botId = ++msgId;
      const botMsg: Message = {
        id: botId,
        role: "bot",
        text: res.reply,
        navigate: res.navigate,
      };
      setMessages((p) => [...p, botMsg]);
      setHistory([...newHistory, { role: "assistant", content: res.reply }]);
      if (res.navigate) {
        router.push(res.navigate);
      }
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: ++msgId,
          role: "bot",
          text: "Sorry, I couldn't reach the AI service right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    const greetId = ++msgId;
    setMessages([{ id: greetId, role: "bot", text: GREETING }]);
    setHistory([]);
    setTypingDone({});
    saveSession([{ id: greetId, role: "bot", text: GREETING }], [], {}, true);
  }

  return (
    <>
      <style>{STYLES}</style>

      {open && (
        <ChatPanel
          messages={messages}
          loading={loading}
          input={input}
          setInput={setInput}
          onSend={send}
          onClose={() => setOpen(false)}
          onReset={reset}
          typingDone={typingDone}
          onTypingDone={markDone}
          containerRef={containerRef}
        />
      )}

      {/* Floating robot button */}
      <button
        id="debtbot-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Chat with DebtBot"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9991,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <div className="bot-float">
          <LottieRobot size={80} lottieRef={lottieRef} />
        </div>
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#22d3ee",
            border: "2px solid #0f172a",
          }}
          className="animate-pulse"
        />
      </button>
    </>
  );
}
