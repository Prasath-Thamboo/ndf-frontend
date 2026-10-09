import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <Logo className="justify-center" withText={false} />
        <p className="mt-8 text-sm font-semibold text-brand-600">Erreur 404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Page introuvable
        </h1>
        <p className="mt-3 text-slate-500">
          La page que vous cherchez n’existe pas ou a été déplacée.
        </p>
        <Link to="/dashboard" className="btn btn-primary mt-8">
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
