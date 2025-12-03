// src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, roles = [] }) {
  const { user, loadingAuth } = useContext(AuthContext);
  if (loadingAuth) return null; // ou loader
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
