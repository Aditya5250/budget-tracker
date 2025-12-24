import { useState } from "react";

export default function TransactionItem({ tx, onDelete }) {
  const [removing, setRemoving] = useState(false);
  const isIncome = tx.type === "income";

  function handleDeleteClick() {
    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;

    setRemoving(true);

    // wait for animation, then delete
    setTimeout(() => {
      onDelete(tx.id);
    }, 220);
  }

  return (
    <div
      className={`tx-item ${isIncome ? "income" : "expense"} ${
        removing ? "tx-removing" : ""
      }`}
    >
      <div className="tx-left">
        <strong>{tx.note || "No description"}</strong>
        <span className="tx-type">{tx.type}</span>
      </div>

      <div className="tx-right">
        <span className="tx-amount">
          ₹{Number(tx.amount).toFixed(2)}
        </span>

        <button className="tx-delete" onClick={handleDeleteClick}>
          ✕
        </button>
      </div>
    </div>
  );
}