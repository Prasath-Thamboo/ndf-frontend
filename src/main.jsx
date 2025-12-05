import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import App from "./App";                     // Layout avec Navbar + Outlet
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";

import PrivateRoute from "./components/PrivateRoute"; // Protection des routes privées

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>

        {/* Routes publiques (pas de navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Layout global avec Navbar */}
        <Route element={<App />}>

          {/* Routes privées */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />

        </Route>

      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
