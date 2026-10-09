import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

export default function PrivateRoute({ children }) {
  const { user, loadingAuth } = useAuth();

  // Pendant la vérification de l'auth → spinner
  if (loadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-6 text-brand-500" />
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
