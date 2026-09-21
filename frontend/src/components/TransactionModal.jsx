import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { addTransaction, updateTransaction } from "../api/transactions.api";
import { useToast } from "../context/ToastContext";
import { Loader2, Plus, Edit2, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function TransactionModal({
  isOpen,
  onClose,
  transaction = null,
  categories = [],
  onSaved,
}) {
  const isEdit = Boolean(transaction);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "expense");
      setAmount(transaction.amount ? String(transaction.amount) : "");
      setCategoryId(transaction.category_id ? String(transaction.category_id) : "");
      setNote(transaction.note || "");
      if (transaction.occurred_at) {
        setOccurredAt(new Date(transaction.occurred_at).toISOString().slice(0, 10));
      }
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("");
      setNote("");
      setOccurredAt(new Date().toISOString().slice(0, 10));
    }
  }, [transaction, isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast("Please enter a valid amount", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type,
        amount: Number(amount),
        categoryId: categoryId ? Number(categoryId) : null,
        note: note.trim(),
        occurredAt: new Date(occurredAt).toISOString(),
      };

      if (isEdit) {
        await updateTransaction(transaction.id, payload);
        addToast("Transaction updated successfully", "success");
      } else {
        await addTransaction(payload);
        addToast("Transaction added successfully", "success");
      }

      onSaved();
      onClose();
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to save transaction", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isEdit ? <Edit2 size={18} /> : <Plus size={18} />}
          <span>{isEdit ? "Edit Transaction" : "Add Transaction"}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Type Toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            className={`btn ${type === "expense" ? "btn-danger" : "btn-secondary"}`}
            onClick={() => setType("expense")}
            style={{ padding: "10px" }}
          >
            <ArrowUpRight size={16} /> Expense
          </button>
          <button
            type="button"
            className={`btn ${type === "income" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setType("income")}
            style={{
              padding: "10px",
              background: type === "income" ? "var(--income)" : undefined,
              borderColor: type === "income" ? "var(--income)" : undefined,
            }}
          >
            <ArrowDownRight size={16} /> Income
          </button>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <div className="form-input-wrapper">
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="form-input-wrapper">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category (Optional)</option>
              {categories
                .filter((c) => c.type === type || !c.type)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">Note / Description</label>
          <div className="form-input-wrapper">
            <input
              type="text"
              placeholder="e.g. Grocery run at Blinkit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Date</label>
          <div className="form-input-wrapper">
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !amount}
            style={{ flex: 2 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Transaction"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
