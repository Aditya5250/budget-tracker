import { useState, useMemo } from "react";
import TransactionItem from "./TransactionItem";
import { Search, Filter, Download, ArrowUpDown, Receipt, Plus } from "lucide-react";

export default function TransactionList({
  transactions = [],
  categories = [],
  onEdit,
  onDelete,
  onOpenAdd,
}) {
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // Filtering & Sorting
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Filter Type
    if (filterType !== "all") {
      list = list.filter((t) => t.type === filterType);
    }

    // Filter Category
    if (filterCategory !== "all") {
      list = list.filter((t) => String(t.category_id) === String(filterCategory));
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "date_asc") {
      list.sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
    } else if (sortBy === "amount_desc") {
      list.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (sortBy === "amount_asc") {
      list.sort((a, b) => Number(a.amount) - Number(b.amount));
    } else {
      list.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
    }

    return list;
  }, [transactions, filterType, filterCategory, searchQuery, sortBy]);

  // CSV Export
  function exportToCSV() {
    if (filteredTransactions.length === 0) return;

    const headers = ["ID", "Type", "Category", "Amount", "Note", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.note || "").replace(/"/g, '""')}"`,
      t.occurred_at ? new Date(t.occurred_at).toISOString().slice(0, 10) : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="transactions-section">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Transactions</h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          title="Download filtered transactions as CSV"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Type pills */}
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === "expense" ? "active" : ""}`}
            onClick={() => setFilterType("expense")}
          >
            Expenses
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === "income" ? "active" : ""}`}
            onClick={() => setFilterType("income")}
          >
            Income
          </button>
        </div>

        {/* Inputs */}
        <div className="filter-inputs-group">
          {/* Search box */}
          <div className="search-box">
            <Search size={15} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Search by note or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <select
            className="select-box"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            className="select-box"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="tx-table-container">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <Receipt size={28} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No transactions found</h3>
            <p style={{ fontSize: "13px", color: "var(--text-subtle)", maxWidth: "340px" }}>
              {searchQuery || filterType !== "all" || filterCategory !== "all"
                ? "Try clearing your active filters to see all recorded transactions."
                : "Get started by recording your first transaction or using the AI Quick Add bar!"}
            </p>
            {onOpenAdd && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenAdd}
                style={{ marginTop: "8px" }}
              >
                <Plus size={14} /> Add Transaction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}