import { createContext, useContext, useState } from "react";
import { loginApi } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const isAuthenticated = !!token;

  async function login(credentials) {
    const data = await loginApi(credentials);
    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.clear();   // IMPORTANT
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}