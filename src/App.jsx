import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import PrivateRoute from "./components/PrivateRoute";
import { Spinner } from "./components/ui";

// Pages chargées à la demande (le graphique du dashboard est lourd)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const CreateExpense = lazy(() => import("./pages/CreateExpense"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="size-6 text-brand-500" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Redirect / -> /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protégées : toutes partagent la barre latérale */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/expenses/new" element={<CreateExpense />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
