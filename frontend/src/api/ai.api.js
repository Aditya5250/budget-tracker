import api from "./axios";

export async function parseTransactionWithAi(text) {
  const res = await api.post("/ai/parse-transaction", { text });
  return res.data;
}

export async function askAiAdvisor(question, history = []) {
  const res = await api.post("/ai/advisor", { question, history });
  return res.data;
}

export async function getAiInsights() {
  const res = await api.get("/ai/insights");
  return res.data;
}

export async function getAiBudgetRecommendations() {
  const res = await api.get("/ai/budget-recommendations");
  return res.data;
}

export async function getAiStatus() {
  const res = await api.get("/ai/status");
  return res.data;
}
