import api from "./axios";

export async function signupApi(data) {
  const res = await api.post("/auth/signup", data);
  return res.data;
}

export async function loginApi(data) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function googleAuthApi(data) {
  const res = await api.post("/auth/google", data);
  return res.data;
}

export async function getMeApi() {
  const res = await api.get("/auth/me");
  return res.data;
}