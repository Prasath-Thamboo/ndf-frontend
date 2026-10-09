import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, Logo, Spinner } from "./ui";

function roleLabel(user) {
  if (user?.accountType === "solo") return "Compte solo";
  if (user?.role === "admin") return "Administrateur";
  if (user?.role === "manager") return "Manager";
  return "Employé";
}

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`size-[18px] transition ${
              isActive ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          {children}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ user, isManager, logout }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="px-2">
        <Logo light />
      </Link>

      <Link to="/expenses/new" className="btn btn-primary mt-8 w-full py-3">
        <Plus className="size-4" strokeWidth={2.5} />
        Nouvelle note
      </Link>

      <nav className="mt-8 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </p>
        <NavItem to="/dashboard" icon={LayoutDashboard}>
          Tableau de bord
        </NavItem>
        {isManager && (
          <NavItem to="/manager" icon={Users}>
            Espace manager
          </NavItem>
        )}
        <NavItem to="/settings" icon={Settings}>
          Paramètres
        </NavItem>
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel(user)}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isManager =
    user?.accountType === "company" &&
    (user?.role === "manager" || user?.role === "admin");

  // ferme le menu mobile à chaque navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col bg-slate-950 px-4 py-6 lg:flex">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-brand-600/20 to-transparent" />
        <div className="relative h-full">
          <SidebarContent user={user} isManager={isManager} logout={logout} />
        </div>
      </aside>

      {/* Barre du haut mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Link to="/dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/expenses/new" className="btn btn-primary btn-sm" aria-label="Nouvelle note">
            <Plus className="size-4" strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>

      {/* Tiroir mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-up flex-col bg-slate-950 px-4 py-6">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent user={user} isManager={isManager} logout={logout} />
          </aside>
        </div>
      )}

      <main className="lg:pl-68">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {/* garde la barre latérale visible pendant le chargement d'une page */}
          <Suspense
            fallback={
              <div className="grid min-h-[50vh] place-items-center">
                <Spinner className="size-6 text-brand-500" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
