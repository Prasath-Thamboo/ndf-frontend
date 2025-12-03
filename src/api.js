// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
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

export default API;
