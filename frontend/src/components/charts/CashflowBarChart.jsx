import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle } from "lucide-react";

export default function CashflowBarChart({ income = 0, expense = 0, currency = "₹" }) {
  const maxVal = Math.max(income, expense, 1);
  const incomePercent = Math.min(100, Math.round((income / maxVal) * 100));
  const expensePercent = Math.min(100, Math.round((expense / maxVal) * 100));
  const net = income - expense;
  const isPositive = net >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px", width: "100%" }}>
      {/* Cashflow Status Pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: isPositive ? "var(--income-bg)" : "var(--expense-bg)",
          border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isPositive ? (
            <TrendingUp size={18} color="var(--income)" />
          ) : (
            <AlertCircle size={18} color="var(--expense)" />
          )}
          <span style={{ fontSize: "13px", fontWeight: 600, color: isPositive ? "var(--income)" : "var(--expense)" }}>
            {isPositive ? "Net Cashflow Surplus" : "Net Cashflow Deficit"}
          </span>
        </div>
        <span style={{ fontSize: "15px", fontWeight: 800, color: isPositive ? "var(--income)" : "var(--expense)" }}>
          {isPositive ? "+" : "-"}
          {currency}
          {Math.abs(net).toLocaleString("en-IN")}
        </span>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Income Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--income)", fontWeight: 600 }}>
              <ArrowDownRight size={15} /> Total Income
            </span>
            <span style={{ fontWeight: 700 }}>
              {currency}
              {income.toLocaleString("en-IN")}
            </span>
          </div>
          <div style={{ width: "100%", height: "12px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div
              style={{
                width: `${incomePercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                borderRadius: "var(--radius-full)",
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        {/* Expense Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--expense)", fontWeight: 600 }}>
              <ArrowUpRight size={15} /> Total Expenses
            </span>
            <span style={{ fontWeight: 700 }}>
              {currency}
              {expense.toLocaleString("en-IN")}
            </span>
          </div>
          <div style={{ width: "100%", height: "12px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div
              style={{
                width: `${expensePercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)",
                borderRadius: "var(--radius-full)",
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
