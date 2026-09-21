import { useAuth } from "../context/AuthContext";
import { Sparkles, Plus, Menu } from "lucide-react";

export default function TopBar({ onToggleSidebar, onOpenAiQuickAdd, onOpenAddTx }) {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <header className="top-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          type="button"
          className="mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="greeting-title">Welcome back, {firstName}</h1>
          <p className="greeting-subtitle">Here is your financial pulse for this month.</p>
        </div>
      </div>

      <div className="top-bar-actions">
        <button
          type="button"
          className="btn btn-ai"
          onClick={onOpenAiQuickAdd}
          title="Add a transaction using natural language AI"
        >
          <Sparkles size={16} />
          <span>Quick AI Add</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenAddTx}
          title="Manually create a new transaction"
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
}
