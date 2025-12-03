// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import API, { setAuthToken, setOnUnauthorized } from '../api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const nav = useNavigate();

  // Déconnexion centralisée
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setAuthToken(null);
    setUser(null);
    nav('/login');
  }, [nav]);

  // Intercepteur 401 → déconnexion automatique
  useEffect(() => {
    setOnUnauthorized(() => () => {
      logout();
    });
  }, [logout]);

  // Au chargement de l'app → lire token et vérifier utilisateur
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoadingAuth(false);
      return;
    }

    setAuthToken(token);

    API.get('/auth/me')
      .then(res => {
        setUser(res.data.user);
      })
      .catch(err => {
        console.warn('auth/me failed', err?.response?.data || err.message);
        localStorage.removeItem('accessToken');
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  // Connexion utilisateur
  const login = async ({ email, password }) => {
    const res = await API.post('/auth/login', { email, password });
    const token = res.data.token || res.data.accessToken || res.data.access;

    if (!token) throw new Error('No token received');

    localStorage.setItem('accessToken', token);
    setAuthToken(token);

    const me = await API.get('/auth/me');
    setUser(me.data.user);

    return me.data.user;
  };

  // Enregistrement utilisateur
  const register = async ({ name, email, password }) => {
    const res = await API.post('/auth/register', { name, email, password });

    const token = res.data.token || res.data.accessToken;

    if (token) {
      localStorage.setItem('accessToken', token);
      setAuthToken(token);

      const me = await API.get('/auth/me');
      setUser(me.data.user);

      return me.data.user;
    }

    return null;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loadingAuth }}>
      {loadingAuth ? <div className="p-8 text-center">Chargement...</div> : children}
    </AuthContext.Provider>
  );
}

// 🔥 Hook manquant — nécessaire pour importer facilement le contexte
export function useAuth() {
  return React.useContext(AuthContext);
}
