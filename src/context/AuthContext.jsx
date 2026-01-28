// frontend/src/context/AuthContext.jsx
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password }) => {
    const res = await API.post("/auth/login", { email, password });

    const token = res.data.token;
    localStorage.setItem("accessToken", token);
    setAuthToken(token);

    const me = await API.get("/auth/me");
    setUser(me.data);

    nav("/");
  };

  const register = async ({
    name,
    email,
    password,
    accountType,
    companyName,
    inviteCode,
  }) => {
    await API.post("/auth/register", {
      name,
      email,
      password,
      accountType,
      companyName,
      inviteCode,
    });

    await login({ email, password });
  };

  // ✅ AJOUT : helper pour mettre à jour l’utilisateur en mémoire
  // (utile après PATCH /auth/me pour refléter le nouveau nom dans la navbar)
  const refreshMe = async () => {
    const me = await API.get("/auth/me");
    setUser(me.data);
    return me.data;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loadingAuth, refreshMe }}
    >
      {loadingAuth ? <div className="p-8">Chargement...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
