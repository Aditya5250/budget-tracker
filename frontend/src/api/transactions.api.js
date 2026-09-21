import api from "./axios";

/* Fetch all transactions with optional filter queries */
export async function getTransactions(params = {}) {
  const res = await api.get("/transactions", { params });
  return res.data;
}

/* Get aggregated statistics and category breakdown */
export async function getTransactionSummary(period = "month") {
  const res = await api.get("/transactions/summary", { params: { period } });
  return res.data;
}

/* Add a new transaction */
export async function addTransaction(payload) {
  const res = await api.post("/transactions", payload);
  return res.data;
}

/* Update an existing transaction */
export async function updateTransaction(id, payload) {
  const res = await api.put(`/transactions/${id}`, payload);
  return res.data;
}

/* Delete a transaction */
export async function deleteTransaction(id) {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
}