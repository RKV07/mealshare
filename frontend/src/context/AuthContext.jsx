import { createContext, useContext, useEffect, useState } from "react";
import { registerAccount, loginAccount, logoutAccount, getMe } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("mealshare_token"));
  const [loading, setLoading] = useState(true);

  // On first load, if a token is already stored, fetch the profile it belongs to.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setAccount)
      .catch(() => {
        localStorage.removeItem("mealshare_token");
        setToken(null);
        setAccount(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function persistSession(data) {
    const newToken = data.token;
    const userPayload = data.user || data.student || data;
    localStorage.setItem("mealshare_token", newToken);
    setToken(newToken);
    setAccount(userPayload);
    return userPayload;
  }

  async function register(form) {
    const data = await registerAccount(form);
    return persistSession(data);
  }

  async function login(username, password) {
    const data = await loginAccount(username, password);
    return persistSession(data);
  }

  async function logout() {
    try {
      await logoutAccount();
    } catch {
      // token may already be invalid — clear local state regardless
    }
    localStorage.removeItem("mealshare_token");
    setToken(null);
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ account, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an <AuthProvider>");
  return ctx;
}
