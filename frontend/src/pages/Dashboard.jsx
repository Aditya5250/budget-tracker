import { useEffect, useState } from "react";
import {getTransactions,addTransaction,deleteTransaction,} from "../api/transactions.api";
import TransactionList from "../components/TransactionList";

import "../styles/layout.css";
import "../styles/global.css";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Load transactions ONCE on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();

    if (!form.amount || !form.note) {
      setError("Please fill all fields");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      await addTransaction({
        type: form.type,
        amount: Number(form.amount),
        note: form.note,
      });

      await loadTransactions();
      setForm({ type: "expense", amount: "", note: "" });
    } catch (err) {
      console.error(err);
      setError("Failed to add transaction");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete transaction");
    }
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="dashboard-layout">
      <div className="dashboard">
        <h1 className="page-title">Dashboard</h1>

        <div className="summary">
          <div className="card income">Total Income ₹{income}</div>
          <div className="card expense">Total Expense ₹{expense}</div>
          <div className="card balance">
            Balance ₹{income - expense}
          </div>
        </div>

        <form className="tx-form" onSubmit={handleAdd}>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Note"
            value={form.note}
            onChange={(e) =>
              setForm({ ...form, note: e.target.value })
            }
          />

          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Transaction"}
          </button>
        </form>

        <div className="tx-divider"></div>
        <h2>Recent Transactions</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}