import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.user;
  };

  const refresh = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return;
    const { data } = await api.post('/auth/refresh', { refreshToken: rt });
    localStorage.setItem('accessToken', data.accessToken);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);