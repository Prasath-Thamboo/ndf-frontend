import React, { createContext, useState, useEffect, useCallback } from "react";
import API, { setAuthToken, setOnUnauthorized } from "../api";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const nav = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setAuthToken(null);
    setUser(null);
    nav("/login");
  }, [nav]);

  useEffect(() => {
    setOnUnauthorized(() => () => logout());
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoadingAuth(false);
      return;
    }

    setAuthToken(token);

    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const login = async ({ email, password }) => {
    const res = await API.post("/auth/login", { email, password });

    const token = res.data.token;
    localStorage.setItem("accessToken", token);
    setAuthToken(token);

    // soit on prend res.data.user, soit /me (ici /me pour être sûr)
    const me = await API.get("/auth/me");
    setUser(me.data);

    nav("/"); // ✅ ton dashboard actuel est sur "/"
  };

  const register = async ({ name, email, password, accountType, companyName, inviteCode }) => {
    // ✅ register ne renvoie pas de token dans ton backend
    await API.post("/auth/register", {
      name,
      email,
      password,
      accountType,   // "solo" | "company"
      companyName,   // si création entreprise manager
      inviteCode,    // si employee rejoint entreprise
    });

    // ✅ login auto après inscription
    await login({ email, password });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loadingAuth }}>
      {loadingAuth ? <div className="p-8">Chargement...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
