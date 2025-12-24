import api from "./axios";

/* Fetch all transactions for logged-in user */
export async function getTransactions() {
  const res = await api.get("/transactions");
  return res.data;
}

/* Add a new transaction */
export async function addTransaction(payload) {
  const res = await api.post("/transactions", payload);
  return res.data;
}

/* Delete a transaction */
export async function deleteTransaction(id) {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
}