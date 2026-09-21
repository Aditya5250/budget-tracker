import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getTransactions, getTransactionSummary, deleteTransaction } from "../api/transactions.api";
import { getAiInsights } from "../api/ai.api";
import { getBudgets } from "../api/budgets.api";
import { useToast } from "../context/ToastContext";

import StatCard from "../components/ui/StatCard";
import CashflowBarChart from "../components/charts/CashflowBarChart";
import CategoryDonutChart from "../components/charts/CategoryDonutChart";
import AiInsightsBanner from "../components/ai/AiInsightsBanner";
import TransactionList from "../components/TransactionList";

import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  Target,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const {
    categories,
    refreshTrigger,
    triggerRefresh,
    onOpenAdvisor,
    onOpenAiQuickAdd,
    onOpenAddTx,
    onEditTx,
  } = useOutletContext();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    savingsRate: 0,
    categoryBreakdown: [],
  });
  const [insights, setInsights] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [txData, sumData, insightData, budgetData] = await Promise.allSettled([
        getTransactions(),
        getTransactionSummary("month"),
        getAiInsights(),
        getBudgets(),
      ]);

      if (txData.status === "fulfilled") {
        setTransactions(txData.value.transactions || []);
      }
      if (sumData.status === "fulfilled") {
        setSummary(sumData.value);
      }
      if (insightData.status === "fulfilled") {
        setInsights(insightData.value.insights || []);
      }
      if (budgetData.status === "fulfilled") {
        setBudgets(budgetData.value.budgets || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      addToast("Failed to fetch latest dashboard updates", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTransaction(id);
      addToast("Transaction deleted", "info");
      triggerRefresh();
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to delete transaction", "error");
    }
  }

  return (
    <div className="dashboard-container">
      {/* 1. Stat Summary Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Income"
          value={summary.totalIncome}
          type="income"
          icon={ArrowDownRight}
          metaText="Current monthly inflow"
        />

        <StatCard
          label="Total Expenses"
          value={summary.totalExpense}
          type="expense"
          icon={ArrowUpRight}
          metaText={`${summary.categoryBreakdown?.length || 0} categories active`}
        />

        <StatCard
          label="Net Savings"
          value={summary.netSavings}
          type="balance"
          icon={Wallet}
          metaText={summary.netSavings >= 0 ? "Surplus remaining" : "Deficit warning"}
        />

        <StatCard
          label="Savings Rate"
          value={`${summary.savingsRate}%`}
          type="rate"
          icon={PiggyBank}
          prefix=""
          metaText="Target benchmark: 20%"
        />
      </div>

      {/* 2. AI Insights & Health Banner */}
      <AiInsightsBanner insights={insights} onOpenAdvisor={onOpenAdvisor} />

      {/* 3. Visual Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Cashflow Dynamics</h3>
            <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>Monthly Overview</span>
          </div>
          <div className="chart-body">
            <CashflowBarChart
              income={summary.totalIncome}
              expense={summary.totalExpense}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Expense Breakdown</h3>
            <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>By Category</span>
          </div>
          <div className="chart-body">
            <CategoryDonutChart
              data={summary.categoryBreakdown}
              total={summary.totalExpense}
            />
          </div>
        </div>
      </div>

      {/* 4. Category Budget Health (if budgets exist) */}
      {budgets.length > 0 && (
        <div className="chart-card">
          <div className="chart-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={18} color="#818cf8" />
              <h3 className="chart-card-title">Active Budget Limits</h3>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
              {budgets.length} Targets Tracked
            </span>
          </div>

          <div className="budgets-summary-grid">
            {budgets.slice(0, 4).map((b) => (
              <div key={b.id} className="budget-progress-card">
                <div className="budget-progress-header">
                  <span className="budget-cat-name">
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: b.categoryColor,
                      }}
                    />
                    {b.categoryName}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color:
                        b.status === "exceeded"
                          ? "var(--expense)"
                          : b.status === "warning"
                          ? "var(--warning)"
                          : "var(--income)",
                    }}
                  >
                    {b.percentage}%
                  </span>
                </div>

                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${Math.min(100, b.percentage)}%`,
                      backgroundColor:
                        b.status === "exceeded"
                          ? "var(--expense)"
                          : b.status === "warning"
                          ? "var(--warning)"
                          : b.categoryColor || "var(--primary)",
                    }}
                  />
                </div>

                <div className="budget-meta-row">
                  <span>Spent: ₹{b.spent.toLocaleString("en-IN")}</span>
                  <span>Limit: ₹{b.monthlyLimit.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Complete Transaction Management Table */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        onEdit={onEditTx}
        onDelete={handleDelete}
        onOpenAdd={onOpenAddTx}
      />
    </div>
  );
}