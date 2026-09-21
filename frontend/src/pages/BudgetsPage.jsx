import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getBudgets, setBudget, deleteBudget } from "../api/budgets.api";
import { getAiBudgetRecommendations } from "../api/ai.api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/ui/Modal";
import { Target, Sparkles, Plus, Trash2, Check, AlertTriangle, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function BudgetsPage() {
  const { categories, refreshTrigger, triggerRefresh } = useOutletContext();
  const [budgets, setBudgets] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadBudgetData();
  }, [refreshTrigger]);

  async function loadBudgetData() {
    try {
      setLoading(true);
      const [bData, recData] = await Promise.allSettled([
        getBudgets(),
        getAiBudgetRecommendations(),
      ]);

      if (bData.status === "fulfilled") {
        setBudgets(bData.value.budgets || []);
      }
      if (recData.status === "fulfilled") {
        setRecommendations(recData.value.recommendations || []);
      }
    } catch (err) {
      console.error("Budget page error:", err);
      addToast("Failed to load budget records", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBudget(e) {
    e.preventDefault();
    if (!selectedCatId || !monthlyLimit || Number(monthlyLimit) <= 0) {
      addToast("Please select a category and specify a positive limit", "error");
      return;
    }

    try {
      setSaving(true);
      await setBudget({
        categoryId: Number(selectedCatId),
        monthlyLimit: Number(monthlyLimit),
      });

      confetti({ particleCount: 40, spread: 50 });
      addToast("Budget target configured!", "success");
      setModalOpen(false);
      setSelectedCatId("");
      setMonthlyLimit("");
      loadBudgetData();
      triggerRefresh();
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to set budget", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id, name) {
    if (!window.confirm(`Remove budget target for ${name}?`)) return;
    try {
      await deleteBudget(id);
      addToast("Budget target removed", "info");
      loadBudgetData();
      triggerRefresh();
    } catch (err) {
      addToast("Failed to delete budget target", "error");
    }
  }

  async function handleApplyRecommendation(rec) {
    try {
      await setBudget({
        categoryId: rec.categoryId,
        monthlyLimit: rec.suggestedLimit,
      });
      addToast(`Applied AI budget limit for ${rec.categoryName}`, "success");
      loadBudgetData();
      triggerRefresh();
    } catch (err) {
      addToast("Failed to apply recommendation", "error");
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "expense" || !c.type);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Target size={24} color="#818cf8" />
            <span>Monthly Category Budgets</span>
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Set category spending caps, prevent budget overruns, and follow AI-optimized allocations.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSelectedCatId(expenseCategories[0]?.id || "");
            setMonthlyLimit("");
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Set Category Budget
        </button>
      </div>

      {/* Active Budgets Grid */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
          Active Spending Limits ({budgets.length})
        </h3>

        {budgets.length > 0 ? (
          <div className="budgets-summary-grid">
            {budgets.map((b) => (
              <div key={b.id} className="budget-progress-card" style={{ padding: "20px" }}>
                <div className="budget-progress-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: b.categoryColor || "#64748b",
                      }}
                    />
                    <strong style={{ fontSize: "15px" }}>{b.categoryName}</strong>
                  </div>

                  <button
                    type="button"
                    className="icon-btn danger"
                    style={{ width: "28px", height: "28px" }}
                    onClick={() => handleDeleteBudget(b.id, b.categoryName)}
                    title="Remove limit"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ margin: "6px 0" }}>
                  <div className="budget-bar-track" style={{ height: "10px" }}>
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${Math.min(100, b.percentage)}%`,
                        backgroundColor:
                          b.status === "exceeded"
                            ? "var(--expense)"
                            : b.status === "warning"
                            ? "var(--warning)"
                            : b.categoryColor || "var(--income)",
                      }}
                    />
                  </div>
                </div>

                <div className="budget-meta-row">
                  <span style={{ fontWeight: 600 }}>
                    Spent: ₹{b.spent.toLocaleString("en-IN")}
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    Limit: ₹{b.monthlyLimit.toLocaleString("en-IN")}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                    fontSize: "12px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        b.status === "exceeded"
                          ? "var(--expense)"
                          : b.status === "warning"
                          ? "var(--warning)"
                          : "var(--income)",
                    }}
                  >
                    {b.percentage}% Used
                  </span>
                  <span style={{ color: "var(--text-subtle)" }}>
                    {b.isOver
                      ? `Over by ₹${Math.abs(b.monthlyLimit - b.spent).toLocaleString("en-IN")}`
                      : `₹${b.remaining.toLocaleString("en-IN")} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tx-table-container" style={{ padding: "40px", textAlign: "center" }}>
            <Target size={36} color="var(--text-subtle)" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ fontSize: "16px" }}>No category budget limits set yet</h4>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
              Define monthly limits for routine expenses like Groceries, Dining, and Shopping to stay disciplined.
            </p>
          </div>
        )}
      </div>

      {/* AI Budget Recommendations */}
      {recommendations.length > 0 && (
        <div className="ai-budget-rec-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Sparkles size={20} color="#818cf8" />
            <div>
              <h3 className="ai-budget-rec-title" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                AI Suggested Category Budgets
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Calculated using your actual transaction velocity plus recommended healthy buffer limits.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {recommendations.map((rec) => (
              <div key={rec.categoryId} className="ai-budget-rec-item">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>{rec.categoryName}</strong>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>
                      ₹{rec.suggestedLimit.toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4 }}>
                    {rec.rationale}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleApplyRecommendation(rec)}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Check size={13} /> Apply Limit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configure Category Budget"
      >
        <form onSubmit={handleSaveBudget} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="form-input-wrapper">
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                required
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <div className="form-input-wrapper">
              <input
                type="number"
                placeholder="e.g. 8000"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !monthlyLimit}
              style={{ flex: 2 }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Budget Target"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
