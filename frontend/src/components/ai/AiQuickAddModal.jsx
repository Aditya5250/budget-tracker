import { useState } from "react";
import Modal from "../ui/Modal";
import { parseTransactionWithAi } from "../../api/ai.api";
import { addTransaction } from "../../api/transactions.api";
import { useToast } from "../../context/ToastContext";
import { Sparkles, ArrowRight, Check, Loader2, Calendar, Tag, DollarSign, FileText } from "lucide-react";
import confetti from "canvas-confetti";

export default function AiQuickAddModal({ isOpen, onClose, categories = [], onTransactionAdded }) {
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const { addToast } = useToast();

  const examplePrompts = [
    "Dinner with friends at Olive Bistro 650 rs yesterday",
    "Received $2500 salary for September",
    "Bought groceries at Supermarket for 1200",
    "Uber cab to office 350 rupees",
  ];

  async function handleParse(textToParse) {
    const text = textToParse || promptText;
    if (!text.trim()) return;

    try {
      setLoading(true);
      const res = await parseTransactionWithAi(text);
      if (res.parsed) {
        setParsedData(res.parsed);
      }
    } catch (err) {
      addToast("Failed to parse prompt with AI. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSave() {
    if (!parsedData) return;

    try {
      setSaving(true);
      await addTransaction({
        type: parsedData.type,
        amount: Number(parsedData.amount),
        categoryId: parsedData.categoryId || null,
        note: parsedData.note,
        occurredAt: parsedData.occurredAt,
      });

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      addToast("Transaction added via AI!", "success");
      setPromptText("");
      setParsedData(null);
      onTransactionAdded();
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to save transaction", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setParsedData(null);
    setPromptText("");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--ai-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f172a",
            }}
          >
            <Sparkles size={16} />
          </div>
          <span>AI Quick Add Transaction</span>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {!parsedData ? (
          <>
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Type naturally about your transaction (e.g. amount, where, when, and item). Our AI will instantly parse and categorize it for you!
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleParse();
              }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div className="form-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. Spent 450 rupees on dinner with friends yesterday"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-ai"
                disabled={loading || !promptText.trim()}
                style={{ width: "100%", padding: "12px" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Parse & Categorize
                  </>
                )}
              </button>
            </form>

            <div>
              <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: 600 }}>
                TRY THESE EXAMPLES:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {examplePrompts.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setPromptText(ex);
                      handleParse(ex);
                    }}
                    style={{
                      textAlign: "left",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 12px",
                      fontSize: "12.5px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-focus)";
                      e.currentTarget.style.color = "var(--text-main)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-card)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase" }}>
                  AI Extraction Preview
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    background: parsedData.type === "income" ? "var(--income-bg)" : "var(--expense-bg)",
                    color: parsedData.type === "income" ? "var(--income)" : "var(--expense)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {parsedData.type}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <DollarSign size={12} /> Amount
                  </span>
                  <input
                    type="number"
                    value={parsedData.amount}
                    onChange={(e) => setParsedData({ ...parsedData, amount: Number(e.target.value) })}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "14px",
                      color: "var(--text-main)",
                      width: "100%",
                      marginTop: "4px",
                    }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Tag size={12} /> Category
                  </span>
                  <select
                    value={parsedData.categoryId || ""}
                    onChange={(e) => {
                      const selected = categories.find((c) => String(c.id) === e.target.value);
                      setParsedData({
                        ...parsedData,
                        categoryId: e.target.value ? Number(e.target.value) : null,
                        category: selected ? selected.name : "Uncategorized",
                      });
                    }}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "13px",
                      color: "var(--text-main)",
                      width: "100%",
                      marginTop: "4px",
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FileText size={12} /> Note / Description
                </span>
                <input
                  type="text"
                  value={parsedData.note}
                  onChange={(e) => setParsedData({ ...parsedData, note: e.target.value })}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "13.5px",
                    color: "var(--text-main)",
                    width: "100%",
                    marginTop: "4px",
                  }}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> Date
                </span>
                <input
                  type="date"
                  value={parsedData.occurredAt ? parsedData.occurredAt.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setParsedData({ ...parsedData, occurredAt: new Date(e.target.value).toISOString() })}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "13px",
                    color: "var(--text-main)",
                    width: "100%",
                    marginTop: "4px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ flex: 1 }}
              >
                Try Another
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSave}
                disabled={saving || !parsedData.amount}
                style={{ flex: 2 }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Save Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
