import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loadingAuth } = useAuth();

  // Pendant la vérification de l'auth → spinner
  if (loadingAuth) {
    return (
      <div className="p-8 text-center text-gray-500">
        Chargement...
      </div>
    );
  }

  // Si pas connecté → redirection
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Sinon → afficher la page
  return children;
}
