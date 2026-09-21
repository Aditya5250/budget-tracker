import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getTransactions, getTransactionSummary } from "../api/transactions.api";
import CashflowBarChart from "../components/charts/CashflowBarChart";
import CategoryDonutChart from "../components/charts/CategoryDonutChart";
import StatCard from "../components/ui/StatCard";
import { BarChart3, TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";

export default function Analytics() {
  const { refreshTrigger } = useOutletContext();
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period, refreshTrigger]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const [sumData, txData] = await Promise.all([
        getTransactionSummary(period),
        getTransactions(),
      ]);
      setSummary(sumData);
      setTransactions(txData.transactions || []);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Find biggest single expense
  const expenses = transactions.filter((t) => t.type === "expense");
  const maxExpense = expenses.reduce((max, t) => (Number(t.amount) > Number(max?.amount || 0) ? t : max), null);

  return (
    <div className="dashboard-container">
      {/* Header & Period Switcher */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart3 size={24} color="#818cf8" />
            <span>Financial Analytics & Trends</span>
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            In-depth spending patterns, category distributions, and historical cashflow metrics.
          </p>
        </div>

        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${period === "month" ? "active" : ""}`}
            onClick={() => setPeriod("month")}
          >
            This Month
          </button>
          <button
            type="button"
            className={`filter-pill ${period === "year" ? "active" : ""}`}
            onClick={() => setPeriod("year")}
          >
            This Year
          </button>
          <button
            type="button"
            className={`filter-pill ${period === "all" ? "active" : ""}`}
            onClick={() => setPeriod("all")}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      {summary && (
        <div className="stats-grid">
          <StatCard
            label="Total Inflow"
            value={summary.totalIncome}
            type="income"
            icon={ArrowDownRight}
            metaText={`Recorded for ${period}`}
          />
          <StatCard
            label="Total Outflow"
            value={summary.totalExpense}
            type="expense"
            icon={ArrowUpRight}
            metaText={`${summary.transactionCount} transactions analyzed`}
          />
          <StatCard
            label="Net Cashflow"
            value={summary.netSavings}
            type="balance"
            icon={TrendingUp}
            metaText={summary.netSavings >= 0 ? "Positive Net Position" : "Deficit Warning"}
          />
          <StatCard
            label="Savings Rate"
            value={`${summary.savingsRate}%`}
            type="rate"
            icon={Award}
            prefix=""
            metaText="50/30/20 target: 20%"
          />
        </div>
      )}

      {/* Highlight Box for Highest Expense */}
      {maxExpense && (
        <div className="analytics-highlight-card">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                background: "var(--expense-bg)",
                color: "var(--expense)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUpRight size={22} />
            </div>
            <div>
              <span className="analytics-highlight-badge" style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--expense)", fontWeight: 700 }}>
                Highest Recorded Single Expense
              </span>
              <h4 className="analytics-highlight-title" style={{ fontSize: "16px", marginTop: "2px", fontWeight: 700 }}>
                {maxExpense.note || "Expense"}
              </h4>
              <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                Category: {maxExpense.category || "General"} • {new Date(maxExpense.occurred_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--expense)", fontFamily: "var(--font-heading)" }}>
            ₹{Number(maxExpense.amount).toLocaleString("en-IN")}
          </span>
        </div>
      )}

      {/* Visual Analytics Charts */}
      {summary && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Income vs Expense Ratio</h3>
            </div>
            <div className="chart-body">
              <CashflowBarChart income={summary.totalIncome} expense={summary.totalExpense} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Category Spending Distribution</h3>
            </div>
            <div className="chart-body">
              <CategoryDonutChart data={summary.categoryBreakdown} total={summary.totalExpense} />
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      {summary && summary.categoryBreakdown?.length > 0 && (
        <div className="tx-table-container">
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Category Ranking & Volume</h3>
          </div>
          {summary.categoryBreakdown.map((cat, idx) => {
            const percent = summary.totalExpense > 0 ? ((cat.total / summary.totalExpense) * 100).toFixed(1) : 0;
            return (
              <div key={cat.name} className="tx-item-row">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-subtle)", width: "24px" }}>
                    #{idx + 1}
                  </span>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: cat.color || "#64748b",
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: "14.5px" }}>{cat.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{percent}% of total</span>
                  <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-main)" }}>
                    ₹{cat.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
