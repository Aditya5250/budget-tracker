import { useState, useRef, useEffect } from "react";
import { askAiAdvisor, getAiStatus } from "../../api/ai.api";
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import AiMarkdownRenderer from "./AiMarkdownRenderer";

const LOADING_STAGES = [
  "Analyzing your income and expenses...",
  "Evaluating spending velocity & category caps...",
  "Aura is crafting personalized recommendations...",
  "Connecting with cloud services... almost ready ✨",
];

export default function AiAdvisorDrawer({ isOpen, onClose, userName = "there" }) {
  const [messages, setMessages] = useState([
    {
      id: "initial",
      sender: "ai",
      engine: "gemini",
      model: "gemini-3.6-flash",
      text: `Hello ${userName}! 👋 I'm Aura, your personal AI Financial Advisor powered by Google Gemini.\n\nI have real-time access to your income, expenses, category breakdowns, and active budget limits. Ask me anything about optimizing cash flow, discovering spending leaks, or building wealth!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [aiStatus, setAiStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showKeyInfoModal, setShowKeyInfoModal] = useState(false);
  const chatBottomRef = useRef(null);

  const suggestedQuestions = [
    "Where can I cut expenses this month?",
    "Analyze my top spending category",
    "Am I on track for a 20% savings rate?",
    "Find recurring expenses or leaks",
    "Give me 3 personalized tips to boost my savings",
  ];

  // Dynamic cycling loader
  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingStage(0);
      let current = 0;
      timer = setInterval(() => {
        current = (current + 1);
        if (current < LOADING_STAGES.length) {
          setLoadingStage(current);
        }
      }, 2800);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Fetch Gemini status on open
  useEffect(() => {
    if (isOpen) {
      checkStatus();
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function checkStatus() {
    try {
      const data = await getAiStatus();
      setAiStatus(data);
    } catch (err) {
      console.warn("Could not check AI status:", err.message);
    }
  }

  async function handleSend(textToSend) {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMsg = {
      id: String(Date.now()),
      sender: "user",
      text: question,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Prepare multi-turn history for Gemini (strip error messages)
    const historyPayload = messages
      .filter((m) => !m.isError)
      .slice(-8)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askAiAdvisor(question, historyPayload);
      const aiReply = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: res.reply || "I analyzed your budget and found several optimization opportunities.",
        engine: res.engine || "gemini",
        model: res.model || "gemini-3.6-flash",
        hint: res.hint || null,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: "I experienced a temporary connection delay while consulting your ledger. Please tap retry to ask again.",
          engine: "system",
          isError: true,
          failedQuestion: question,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClearChat() {
    setMessages([
      {
        id: String(Date.now()),
        sender: "ai",
        engine: "gemini",
        model: aiStatus?.model || "gemini-3.6-flash",
        text: `Chat cleared! Ready for your next financial question, ${userName}. What would you like to explore?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  if (!isOpen) return null;

  const isGeminiActive = aiStatus?.active === true || aiStatus?.configured === true;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="ai-bot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "15px" }}>Aura Financial AI</span>
                {isGeminiActive ? (
                  <span className="ai-sparkle-badge" title="Powered by Google Gemini">
                    <Sparkles size={11} /> {aiStatus?.model?.replace("-flash", "") || "Gemini 3.6"}
                  </span>
                ) : (
                  <span className="ai-status-badge-offline" onClick={() => setShowKeyInfoModal(true)}>
                    Local Mode
                  </span>
                )}
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-subtle)" }}>
                Autonomous Financial Advisor & Coach
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              className="icon-action-btn"
              title="Reset Conversation"
              onClick={handleClearChat}
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="icon-action-btn"
              title="Gemini API Info"
              onClick={() => setShowKeyInfoModal(true)}
            >
              <Info size={15} />
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Close Drawer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Informational Offline/Key Banner */}
        {aiStatus && !isGeminiActive && (
          <div className="ai-config-banner" onClick={() => setShowKeyInfoModal(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>Running in smart local mode. Add Gemini API key for deep reasoning.</span>
            </div>
            <ChevronRight size={14} />
          </div>
        )}

        {/* Message Thread */}
        <div className="ai-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.sender} ${m.isError ? "ai-error-bubble" : ""}`}>
              {/* Message Header Meta */}
              <div className="chat-bubble-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  {m.sender === "ai" ? <Bot size={12} color="#818cf8" /> : <User size={12} />}
                  <span style={{ fontWeight: 600 }}>{m.sender === "ai" ? "Aura AI" : "You"}</span>
                  <span style={{ opacity: 0.6 }}>• {m.time}</span>
                </div>

                {m.sender === "ai" && !m.isError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {m.engine === "gemini" && (
                      <span className="ai-model-tag">
                        <Sparkles size={10} /> {m.model || "Gemini"}
                      </span>
                    )}
                    <button
                      className="chat-copy-btn"
                      onClick={() => handleCopy(m.id, m.text)}
                      title="Copy Advice"
                    >
                      {copiedId === m.id ? (
                        <Check size={12} color="#10b981" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Message Content */}
              {m.sender === "ai" ? (
                <div className="ai-message-content">
                  <AiMarkdownRenderer content={m.text} />
                  {m.hint && (
                    <div className="ai-reply-hint">
                      <Info size={12} />
                      <span>{m.hint}</span>
                    </div>
                  )}

                  {/* 1-Click Retry Button for connection delays */}
                  {m.isError && (
                    <button
                      className="ai-retry-btn"
                      onClick={() => handleSend(m.failedQuestion)}
                      disabled={loading}
                    >
                      <RefreshCw size={12} /> Retry Question
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
              )}
            </div>
          ))}

          {/* Modern State-of-the-Art Pulsating Dynamic Loader */}
          {loading && (
            <div className="chat-bubble ai ai-modern-loading-card">
              <div className="ai-loading-header">
                <div className="ai-pulse-dot-container">
                  <span className="ai-pulse-core" />
                  <span className="ai-pulse-halo" />
                </div>
                <div className="ai-loading-text-col">
                  <span className="ai-loading-title">
                    {LOADING_STAGES[loadingStage]}
                  </span>
                  <span className="ai-loading-subtle">
                    Aura AI • Gemini 3.6 Flash
                  </span>
                </div>
              </div>
              <div className="ai-skeleton-wave">
                <div className="ai-skeleton-line w-85" />
                <div className="ai-skeleton-line w-65" />
                <div className="ai-skeleton-line w-40" />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="ai-suggested-bar">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              className="ai-suggestion-chip"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            placeholder="Ask Aura anything about your money, savings, or spending..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading || !input.trim()}
            style={{ padding: "0 14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Send size={14} />
          </button>
        </form>

        {/* Gemini API Key Information Modal */}
        {showKeyInfoModal && (
          <div className="modal-overlay" onClick={() => setShowKeyInfoModal(false)}>
            <div className="modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="#818cf8" />
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Google Gemini API Setup</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setShowKeyInfoModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: "16px 20px", fontSize: "13px", lineHeight: "1.6", color: "var(--text-muted)" }}>
                <p style={{ marginBottom: "12px" }}>
                  Aura Financial AI leverages Google Gemini (<strong style={{ color: "var(--text-main)" }}>gemini-3.6-flash</strong> and <strong style={{ color: "var(--text-main)" }}>gemini-3.8-flash</strong>) for clean, conversational financial intelligence.
                </p>

                <div style={{ background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>
                    <ShieldCheck size={14} color="#10b981" />
                    Status: {isGeminiActive ? "Connected & Active" : "Offline Rule-based Mode"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                    {aiStatus?.message || "Check your backend environment variables to enable or configure."}
                  </div>
                </div>

                <div style={{ fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                  How to activate:
                </div>
                <ol style={{ paddingLeft: "18px", margin: "0 0 14px 0", fontSize: "12.5px" }}>
                  <li>
                    Get an API key at{" "}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#818cf8", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}
                    >
                      Google AI Studio <ExternalLink size={11} />
                    </a>
                  </li>
                  <li>In your deployment environment (e.g. Render Dashboard &rarr; Environment), set:</li>
                  <li>
                    <code>GEMINI_API_KEY=your_key_here</code>
                  </li>
                </ol>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowKeyInfoModal(false)}>
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
