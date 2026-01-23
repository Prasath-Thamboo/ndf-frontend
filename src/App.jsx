import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import CreateExpense from "./pages/CreateExpense";
import ManagerDashboard from "./pages/ManagerDashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="p-6">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Redirect / -> /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protégées */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/expenses/new"
            element={
              <PrivateRoute>
                <CreateExpense />
              </PrivateRoute>
            }
          />

          {/* Manager */}
          <Route
            path="/manager"
            element={
              <PrivateRoute>
                <ManagerDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
