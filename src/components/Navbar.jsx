import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const isManager =
    user?.accountType === "company" &&
    (user?.role === "manager" || user?.role === "admin");

  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      {/* Logo / Titre */}
      <Link
        to="/dashboard"
        className="text-white font-bold text-lg hover:opacity-90"
      >
        Note de Frais
      </Link>

      {user && (
        <div className="flex items-center space-x-4">
          {/* Accès Dashboard */}
          <Link
            to="/dashboard"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Dashboard
          </Link>

          {/* Manager */}
          {isManager && (
            <Link
              to="/manager"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Manager
            </Link>
          )}

          {/* Nouvelle note */}
          <Link
            to="/expenses/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Nouvelle note
          </Link>

          {/* User info */}
          <span className="text-gray-300">Bonjour, {user.name}</span>

          {/* Logout */}
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
