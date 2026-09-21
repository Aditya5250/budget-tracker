import { useState, useRef, useEffect } from "react";
import { askAiAdvisor } from "../../api/ai.api";
import { Bot, Send, X, Sparkles, User, Loader2, RefreshCw } from "lucide-react";

export default function AiAdvisorDrawer({ isOpen, onClose, userName = "there" }) {
  const [messages, setMessages] = useState([
    {
      id: "initial",
      sender: "ai",
      text: `Hello ${userName}! 👋 I'm **Aura**, your personal AI Financial Advisor.\n\nI have real-time access to your income, expenses, and category trends. Ask me anything about optimizing your budget, finding spending leaks, or planning savings goals!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const suggestedQuestions = [
    "Where can I cut expenses this month?",
    "Am I on track for a 20% savings rate?",
    "How does my dining spend compare to essentials?",
    "Give me 3 tips to boost my savings",
  ];

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend) {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMsg = {
      id: String(Date.now()),
      sender: "user",
      text: question,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askAiAdvisor(question);
      const aiReply = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: res.reply || "I analyzed your budget and found several optimization opportunities.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: "I encountered an issue consulting your financial records. Please try asking again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "var(--ai-gradient)",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "15px" }}>Aura Financial AI</span>
                <span className="ai-sparkle-badge">Online</span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                Personal Budget Advisor
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="ai-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.sender}`}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                  fontSize: "11px",
                  opacity: 0.7,
                }}
              >
                {m.sender === "ai" ? <Bot size={12} /> : <User size={12} />}
                <span>{m.sender === "ai" ? "Aura AI" : "You"}</span>
                <span>• {m.time}</span>
              </div>
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble ai" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 size={16} className="animate-spin" color="#818cf8" />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Aura is analyzing your transactions...
              </span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            background: "rgba(255, 255, 255, 0.01)",
          }}
        >
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "11.5px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#818cf8";
                e.currentTarget.style.color = "var(--text-main)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
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
            placeholder="Ask Aura anything about your money..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading || !input.trim()}
            style={{ padding: "0 14px" }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
