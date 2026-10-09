// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  // 30 s : laisse le temps au serveur gratuit de se réveiller
  timeout: 30000,
});

export function setAuthToken(token) {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
}

let onUnauthorized = null;

API.interceptors.response.use(
  res => res,
  async err => {
    if (err.response && err.response.status === 401) {
      if (typeof onUnauthorized === 'function') onUnauthorized(err);
    }
    return Promise.reject(err);
  }
);

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

// Ouvre le justificatif d'une note dans un nouvel onglet.
// L'onglet est ouvert avant la requête pour ne pas être bloqué par le navigateur.
export async function openReceipt(expenseId) {
  const tab = window.open("", "_blank");
  try {
    const res = await API.get(`/expenses/${expenseId}/receipt`, {
      responseType: "blob",
      timeout: 30000,
    });
    const url = URL.createObjectURL(res.data);
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

export default API;
