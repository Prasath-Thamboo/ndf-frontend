// src/pages/AdminDashboard.jsx
// Espace super-administrateur : tous les comptes et entreprises du site.
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, ReceiptText, Search, Trash2, Users, Wallet } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Alert,
  Avatar,
  EmptyState,
  LoadingBlock,
  Modal,
  PageHeader,
  Segmented,
  Spinner,
  StatCard,
  Switch,
} from "../components/ui";
import { formatDate, formatEUR } from "../utils/format";

const ROLE_LABELS = { employee: "Employé", manager: "Manager", admin: "Admin" };

const ROLE_FILTERS = [
  { value: "", label: "Tous les rôles" },
  { value: "employee", label: "Employés" },
  { value: "manager", label: "Managers" },
  { value: "admin", label: "Admins" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState("users"); // users | companies
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [actingId, setActingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isAdmin = user?.role === "admin";

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du chargement des statistiques.");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await API.get("/admin/companies");
      setCompanies(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du chargement des entreprises.");
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
    fetchUsers();
    fetchCompanies();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!roleFilter || u.role === roleFilter) &&
        (!q ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.company?.name?.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const updateUser = async (target, patch, successMessage) => {
    try {
      setActingId(target._id);
      const res = await API.patch(`/admin/users/${target._id}`, patch);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === target._id ? { ...u, isActive: res.data.isActive, role: res.data.role } : u
        )
      );
      toast.success(successMessage);
      fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setActingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActingId(deleteTarget._id);
      await API.delete(`/admin/users/${deleteTarget._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toast.success("Compte supprimé.");
      setDeleteTarget(null);
      fetchStats();
      fetchCompanies();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setActingId(null);
    }
  };

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Gérez l’ensemble des comptes et entreprises du site."
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={stats ? stats.users : "—"}
          sub={stats ? `${stats.activeUsers} actifs` : null}
          icon={Users}
        />
        <StatCard
          label="Entreprises"
          value={stats ? stats.companies : "—"}
          icon={Building2}
          tone="sky"
        />
        <StatCard
          label="Notes de frais"
          value={stats ? stats.expenses.total : "—"}
          sub={stats ? `${stats.expenses.pending} en attente` : null}
          icon={ReceiptText}
          tone="amber"
        />
        <StatCard
          label="Montant total"
          value={stats ? formatEUR(stats.expenses.amount) : "—"}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "users", label: "Utilisateurs", count: users.length },
          { value: "companies", label: "Entreprises", count: companies.length },
        ]}
      />

      {tab === "users" ? (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un nom, un email, une entreprise…"
                className="input pl-10"
                aria-label="Rechercher"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input sm:w-48"
              aria-label="Filtrer par rôle"
            >
              {ROLE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {loadingUsers ? (
            <LoadingBlock />
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={Users} title="Aucun utilisateur trouvé" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelf = String(u._id) === String(user?._id || user?.id);
                const locked = isSelf || u.role === "admin";
                const busy = actingId === u._id;
                return (
                  <li
                    key={u._id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Avatar name={u.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-slate-900">{u.name}</p>
                          {u.accountType === "solo" ? (
                            <span className="badge bg-slate-50 text-slate-600 ring-slate-200">
                              {u.role === "admin" ? "Admin" : "Solo"}
                            </span>
                          ) : (
                            <span className="badge bg-brand-50 text-brand-700 ring-brand-100">
                              {u.company?.name || "Entreprise"}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-500">
                          {u.email} · {u.expenseCount} note{u.expenseCount > 1 ? "s" : ""} · inscrit le{" "}
                          {formatDate(u.createdAt)}
                        </p>
                      </div>
                    </div>

                    {locked ? (
                      <span className="text-sm text-slate-400">
                        {isSelf ? "Vous" : ROLE_LABELS[u.role]}
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        {u.accountType === "company" ? (
                          <select
                            value={u.role}
                            disabled={busy}
                            onChange={(e) =>
                              updateUser(u, { role: e.target.value }, "Rôle mis à jour.")
                            }
                            className="input w-auto py-1.5"
                            aria-label={`Rôle de ${u.name}`}
                          >
                            <option value="employee">Employé</option>
                            <option value="manager">Manager</option>
                          </select>
                        ) : null}
                        <Switch
                          checked={!!u.isActive}
                          disabled={busy}
                          onChange={() =>
                            updateUser(
                              u,
                              { isActive: !u.isActive },
                              u.isActive ? "Compte désactivé." : "Compte réactivé."
                            )
                          }
                          label={u.isActive ? `Désactiver ${u.name}` : `Réactiver ${u.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          disabled={busy}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Supprimer le compte"
                          aria-label={`Supprimer ${u.name}`}
                        >
                          {busy ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="card overflow-hidden">
          {loadingCompanies ? (
            <LoadingBlock />
          ) : companies.length === 0 ? (
            <EmptyState icon={Building2} title="Aucune entreprise" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {companies.map((c) => (
                <li
                  key={c._id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">{c.name}</p>
                      <span className="badge tabular bg-slate-50 text-slate-600 ring-slate-200">
                        {c.inviteCode}
                      </span>
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      Créée le {formatDate(c.createdAt)}
                      {c.createdBy ? ` par ${c.createdBy.name} (${c.createdBy.email})` : ""}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <span>
                      <span className="tabular font-semibold text-slate-900">{c.memberCount}</span>{" "}
                      membre{c.memberCount > 1 ? "s" : ""}
                    </span>
                    <span>
                      <span className="tabular font-semibold text-slate-900">{c.expenseCount}</span>{" "}
                      note{c.expenseCount > 1 ? "s" : ""}
                    </span>
                    <span className="tabular font-semibold text-slate-900">
                      {formatEUR(c.expenseTotal)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => !actingId && setDeleteTarget(null)}
        title="Supprimer le compte"
        description={deleteTarget ? `${deleteTarget.name} · ${deleteTarget.email}` : null}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="btn btn-secondary"
              disabled={!!actingId}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="btn btn-danger"
              disabled={!!actingId}
            >
              {actingId ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
              Supprimer définitivement
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Le compte et ses{" "}
          <span className="font-semibold">{deleteTarget?.expenseCount ?? 0} note(s) de frais</span>{" "}
          (avec leurs justificatifs) seront supprimés. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
