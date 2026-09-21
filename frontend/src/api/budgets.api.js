import api from "./axios";

export async function getBudgets() {
  const res = await api.get("/budgets");
  return res.data;
}

export async function setBudget(payload) {
  const res = await api.post("/budgets", payload);
  return res.data;
}

export async function deleteBudget(id) {
  const res = await api.delete(`/budgets/${id}`);
  return res.data;
}
