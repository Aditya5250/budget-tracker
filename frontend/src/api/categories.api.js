import api from "./axios";

export async function getCategories() {
  const res = await api.get("/categories");
  return res.data;
}

export async function createCategory(payload) {
  const res = await api.post("/categories", payload);
  return res.data;
}

export async function deleteCategory(id) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}
