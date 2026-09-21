import { useState } from "react";
import {
  ShoppingBag,
  UtensilsCrossed,
  Home,
  Zap,
  Car,
  Film,
  HeartPulse,
  ShoppingCart,
  Wallet,
  Briefcase,
  TrendingUp,
  CircleDollarSign,
  Tag,
  Trash2,
  Edit2,
} from "lucide-react";

export default function TransactionItem({ tx, onEdit, onDelete, currency = "₹" }) {
  const [removing, setRemoving] = useState(false);
  const isIncome = tx.type === "income";

  const iconMap = {
    ShoppingBag,
    UtensilsCrossed,
    Home,
    Zap,
    Car,
    Film,
    HeartPulse,
    ShoppingCart,
    Wallet,
    Briefcase,
    TrendingUp,
    CircleDollarSign,
    Tag,
  };

  const IconComp = iconMap[tx.category_icon] || Tag;
  const categoryColor = tx.category_color || "#64748b";

  function handleDeleteClick() {
    const ok = window.confirm(`Delete transaction "${tx.note || "Transaction"}" of ${currency}${tx.amount}?`);
    if (!ok) return;

    setRemoving(true);
    setTimeout(() => {
      onDelete(tx.id);
    }, 200);
  }

  const formattedDate = tx.occurred_at
    ? new Date(tx.occurred_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  return (
    <div
      className="tx-item-row"
      style={{
        opacity: removing ? 0 : 1,
        transform: removing ? "translateX(20px)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      {/* Left Details */}
      <div className="tx-item-left">
        <div
          className="tx-icon-badge"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          <IconComp size={18} />
        </div>

        <div className="tx-details">
          <span className="tx-note">{tx.note || "Untitled Transaction"}</span>
          <div className="tx-submeta">
            <span
              className="tx-category-badge"
              style={{
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
                border: `1px solid ${categoryColor}30`,
              }}
            >
              {tx.category || "General"}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Right Details */}
      <div className="tx-item-right">
        <span className={`tx-amount-display ${isIncome ? "income" : "expense"}`}>
          {isIncome ? "+" : "-"}
          {currency}
          {Number(tx.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>

        <div className="tx-actions">
          {onEdit && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit(tx)}
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            onClick={handleDeleteClick}
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}