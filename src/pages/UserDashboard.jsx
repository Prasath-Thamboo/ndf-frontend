// src/pages/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import API, { openReceipt } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Alert,
  CATEGORY_META,
  CategoryIcon,
  EmptyState,
  LoadingBlock,
  Modal,
  PageHeader,
  Segmented,
  Spinner,
  StatCard,
  StatusBadge,
  categoryMeta,
} from "../components/ui";
import { formatDate, formatEUR } from "../utils/format";

// ---------- Helpers de période ----------
const pad2 = (n) => String(n).padStart(2, "0");

const monthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

// ISO week: YYYY-Www
const getISOWeekKey = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad2(weekNo)}`;
};

function ChartTooltip({ active, payload }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-xl shadow-slate-900/10">
      <p className="font-semibold text-slate-900">{p.title}</p>
      <p className="tabular mt-1 text-base font-bold text-brand-600">{formatEUR(p.y)}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span>{p.date}</span>
        <span>·</span>
        <span>{categoryMeta(p.category).label}</span>
      </div>
      <div className="mt-2">
        <StatusBadge status={p.status} />
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState("all"); // "all" | "2025" | ...
  const [mode, setMode] = useState("monthly"); // "monthly" | "weekly"

  // on choisit explicitement quel mois/semaine afficher dans le graphe
  const [selectedMonth, setSelectedMonth] = useState("all"); // "all" | "YYYY-MM"
  const [selectedWeek, setSelectedWeek] = useState("all"); // "all" | "YYYY-Www"

  // liste : recherche + filtre de statut
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // suppression (confirmation)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ===== Export Email (batch) =====
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTo, setExportTo] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportSending, setExportSending] = useState(false);

  const canExportEmail = useMemo(() => {
    if (!user) return false;
    if (user.accountType === "solo") return true;
    if (
      user.accountType === "company" &&
      (user.role === "manager" || user.role === "admin")
    )
      return true;
    return false;
  }, [user]);

  const exportHint = useMemo(() => {
    if (!user) return "";
    if (user.accountType === "solo") return "Toutes vos notes de frais seront envoyées.";
    return "Seules les notes approuvées de l’entreprise seront envoyées.";
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await API.get("/expenses");
      setExpenses(res.data);
    } catch (e) {
      console.error(e);
      setError("Erreur lors du chargement des notes de frais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;

    try {
      setDeleting(true);
      await API.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
      toast.success("Note de frais supprimée.");
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      toast.error(
        e.response?.data?.message ||
          "Erreur lors de la suppression de la note de frais."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenReceipt = async (id) => {
    try {
      await openReceipt(id);
    } catch (e) {
      console.error(e);
      toast.error("Impossible d'ouvrir le justificatif.");
    }
  };

  const sendAllExpensesByEmail = async (e) => {
    e?.preventDefault();
    try {
      setExportSending(true);

      await API.post("/expenses/email", {
        to: exportTo.trim(),
        message: exportMessage.trim(),
      });

      toast.success("Email envoyé avec succès.");
      setExportTo("");
      setExportMessage("");
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de l'envoi des notes par email."
      );
    } finally {
      setExportSending(false);
    }
  };

  // ---------- Helpers ----------
  const formatMonthLabel = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const formatWeekLabel = (yw) => {
    const [y, w] = yw.split("-W");
    return `Semaine ${Number(w)} · ${y}`;
  };

  // ---------- Années disponibles ----------
  const availableYears = useMemo(() => {
    const years = new Set();
    for (const e of expenses) {
      if (!e?.date) continue;
      const d = new Date(e.date);
      if (!Number.isNaN(d.getTime())) years.add(String(d.getFullYear()));
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [expenses]);

  // ---------- Filtre année ----------
  const filteredByYear = useMemo(() => {
    if (selectedYear === "all") return expenses;
    return expenses.filter((e) => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return false;
      return String(d.getFullYear()) === selectedYear;
    });
  }, [expenses, selectedYear]);

  // ---------- Options de mois / semaine (selon année filtrée) ----------
  const availableMonths = useMemo(() => {
    const set = new Set();
    for (const e of filteredByYear) {
      if (!e?.date) continue;
      const d = new Date(e.date);
      if (!Number.isNaN(d.getTime())) set.add(monthKey(d));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredByYear]);

  const availableWeeks = useMemo(() => {
    const set = new Set();
    for (const e of filteredByYear) {
      if (!e?.date) continue;
      const d = new Date(e.date);
      if (!Number.isNaN(d.getTime())) set.add(getISOWeekKey(d));
    }
    return Array.from(set).sort((a, b) => {
      const [ya, wa] = a.split("-W").map(Number);
      const [yb, wb] = b.split("-W").map(Number);
      return ya !== yb ? ya - yb : wa - wb;
    });
  }, [filteredByYear]);

  // si l’utilisateur change mode/année, on force une sélection cohérente
  useEffect(() => {
    if (mode === "monthly") {
      if (selectedMonth === "all" && availableMonths.length) {
        setSelectedMonth(availableMonths[availableMonths.length - 1]); // dernier mois
      }
    } else {
      if (selectedWeek === "all" && availableWeeks.length) {
        setSelectedWeek(availableWeeks[availableWeeks.length - 1]); // dernière semaine
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, availableMonths.length, availableWeeks.length, selectedYear]);

  // ---------- Données SCATTER (1 point = 1 dépense) ----------
  const scatterData = useMemo(() => {
    const items = filteredByYear
      .filter((e) => e?.date && Number.isFinite(Number(e.amount)))
      .map((e) => ({
        ...e,
        _d: new Date(e.date),
        amountNum: Number(e.amount),
      }))
      .filter((e) => !Number.isNaN(e._d.getTime()));

    if (mode === "monthly") {
      if (!selectedMonth || selectedMonth === "all") return [];

      return items
        .filter((e) => monthKey(e._d) === selectedMonth)
        .map((e, idx) => ({
          x: e._d.getDate(),
          y: e.amountNum,
          id: e._id || `${idx}`,
          title: e.title,
          date: e._d.toLocaleDateString("fr-FR"),
          category: e.category,
          status: e.status,
        }));
    }

    if (!selectedWeek || selectedWeek === "all") return [];

    return items
      .filter((e) => getISOWeekKey(e._d) === selectedWeek)
      .map((e, idx) => ({
        x: ((e._d.getDay() + 6) % 7) + 1,
        y: e.amountNum,
        id: e._id || `${idx}`,
        title: e.title,
        date: e._d.toLocaleDateString("fr-FR"),
        category: e.category,
        status: e.status,
      }));
  }, [filteredByYear, mode, selectedMonth, selectedWeek]);

  // Axe X (mensuel): jours 1..31, limité au nb de jours du mois choisi
  const monthDays = useMemo(() => {
    if (mode !== "monthly" || !selectedMonth || selectedMonth === "all") return 31;
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [mode, selectedMonth]);

  const totalVisible = useMemo(() => {
    return scatterData.reduce((s, p) => s + (Number(p.y) || 0), 0);
  }, [scatterData]);

  // ---------- KPIs ----------
  const stats = useMemo(() => {
    const sum = (list) => list.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const now = new Date();
    const currentMonth = monthKey(now);
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e?.date);
      return !Number.isNaN(d.getTime()) && monthKey(d) === currentMonth;
    });
    const pending = filteredByYear.filter((e) => e.status === "pending");
    const approved = filteredByYear.filter((e) => e.status === "approved");
    return {
      total: sum(filteredByYear),
      count: filteredByYear.length,
      month: sum(thisMonth),
      monthCount: thisMonth.length,
      pending: sum(pending),
      pendingCount: pending.length,
      approved: sum(approved),
      approvedCount: approved.length,
    };
  }, [expenses, filteredByYear]);

  const byCategory = useMemo(() => {
    const totals = Object.fromEntries(Object.keys(CATEGORY_META).map((k) => [k, 0]));
    for (const e of filteredByYear) {
      const key = CATEGORY_META[e.category] ? e.category : "autre";
      totals[key] += Number(e.amount) || 0;
    }
    const max = Math.max(...Object.values(totals), 0);
    return Object.entries(totals)
      .map(([key, amount]) => ({ key, amount, pct: max > 0 ? (amount / max) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredByYear]);

  // ---------- Liste (filtrée année + recherche + statut) ----------
  const tableList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredByYear
      .filter((e) => e?.date)
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter(
        (e) =>
          !q ||
          String(e.title || "").toLowerCase().includes(q) ||
          String(e.description || "").toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredByYear, search, statusFilter]);

  const firstName = (user?.name || "").trim().split(/\s+/)[0];
  const periodLabel = selectedYear === "all" ? "Toutes les années" : selectedYear;

  const chartMessage =
    mode === "monthly" && (!selectedMonth || selectedMonth === "all")
      ? "Sélectionnez un mois pour afficher vos dépenses."
      : mode === "weekly" && (!selectedWeek || selectedWeek === "all")
        ? "Sélectionnez une semaine pour afficher vos dépenses."
        : scatterData.length === 0
          ? "Aucune dépense sur la période sélectionnée."
          : null;

  const renderActions = (exp) => (
    <div className="flex items-center justify-end gap-1">
      {exp.receipt?.path && (
        <button
          type="button"
          onClick={() => handleOpenReceipt(exp._id)}
          className="btn btn-ghost btn-sm"
          title="Voir le justificatif"
        >
          <FileText className="size-4" />
          <span className="hidden xl:inline">Justificatif</span>
        </button>
      )}
      {exp.status === "pending" && (
        <button
          type="button"
          onClick={() => setDeleteTarget(exp)}
          className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          title="Supprimer"
          aria-label="Supprimer"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour${firstName ? `, ${firstName}` : ""} 👋`}
        description="Voici un aperçu de vos notes de frais."
        actions={
          <>
            <select
              className="input w-auto py-2"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth("all");
                setSelectedWeek("all");
              }}
              disabled={loading}
              aria-label="Filtrer par année"
            >
              <option value="all">Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchExpenses}
              className="btn btn-secondary px-3"
              disabled={loading}
              title="Actualiser"
              aria-label="Actualiser"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {canExportEmail && (
              <button type="button" onClick={() => setExportOpen(true)} className="btn btn-secondary">
                <Mail className="size-4" />
                Envoyer par email
              </button>
            )}
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total des dépenses"
          value={formatEUR(stats.total)}
          sub={`${stats.count} note${stats.count > 1 ? "s" : ""} · ${periodLabel}`}
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label="Ce mois-ci"
          value={formatEUR(stats.month)}
          sub={`${stats.monthCount} note${stats.monthCount > 1 ? "s" : ""}`}
          icon={CalendarDays}
          tone="sky"
        />
        <StatCard
          label="En attente"
          value={formatEUR(stats.pending)}
          sub={`${stats.pendingCount} à valider`}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Validées"
          value={formatEUR(stats.approved)}
          sub={`${stats.approvedCount} note${stats.approvedCount > 1 ? "s" : ""}`}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      {/* ===== Graphique + catégories ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Évolution des dépenses</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                1 point = 1 dépense ·{" "}
                <span className="tabular font-semibold text-slate-700">{formatEUR(totalVisible)}</span>{" "}
                sur la période
              </p>
            </div>
            <Segmented
              value={mode}
              onChange={setMode}
              disabled={loading}
              options={[
                { value: "monthly", label: "Mois" },
                { value: "weekly", label: "Semaine" },
              ]}
            />
          </div>

          <div className="mt-4">
            {mode === "monthly" ? (
              <select
                className="input w-full py-2 sm:w-64"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={loading || availableMonths.length === 0}
                aria-label="Choisir un mois"
              >
                <option value="all">Choisir un mois</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="input w-full py-2 sm:w-64"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                disabled={loading || availableWeeks.length === 0}
                aria-label="Choisir une semaine"
              >
                <option value="all">Choisir une semaine</option>
                {availableWeeks.map((w) => (
                  <option key={w} value={w}>
                    {formatWeekLabel(w)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-4 h-72">
            {loading ? (
              <LoadingBlock />
            ) : chartMessage ? (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
                {chartMessage}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={mode === "monthly" ? [1, monthDays] : [1, 7]}
                    allowDecimals={false}
                    tickCount={mode === "monthly" ? Math.min(monthDays, 16) : 7}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(v) => {
                      if (mode === "monthly") return String(v);
                      return ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"][v - 1] || v;
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(v) => `${Number(v).toFixed(0)} €`}
                  />
                  <Tooltip cursor={{ stroke: "#c7d2fe", strokeDasharray: "4 4" }} content={<ChartTooltip />} />
                  <Scatter data={scatterData} fill="url(#dot)" stroke="#fff" strokeWidth={2} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900">Par catégorie</h2>
          <p className="mt-0.5 text-sm text-slate-500">{periodLabel}</p>

          <ul className="mt-6 space-y-5">
            {byCategory.map(({ key, amount, pct }) => {
              const meta = categoryMeta(key);
              return (
                <li key={key}>
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={key} size="sm" />
                    <span className="flex-1 text-sm font-medium text-slate-700">{meta.label}</span>
                    <span className="tabular text-sm font-semibold text-slate-900">{formatEUR(amount)}</span>
                  </div>
                  <div className="ml-11 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* ===== Liste ===== */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Mes notes de frais</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {tableList.length} résultat{tableList.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input py-2 pl-9 sm:w-56"
                aria-label="Rechercher une note"
              />
            </div>
            <div className="overflow-x-auto">
              <Segmented
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Toutes" },
                  { value: "pending", label: "En attente" },
                  { value: "approved", label: "Validées" },
                  { value: "rejected", label: "Refusées" },
                ]}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : tableList.length === 0 ? (
          expenses.length === 0 ? (
            <EmptyState
              title="Aucune note de frais"
              description="Créez votre première note en quelques secondes, ou laissez l’IA lire votre ticket."
              action={
                <Link to="/expenses/new" className="btn btn-primary">
                  <Plus className="size-4" />
                  Nouvelle note
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="Aucun résultat"
              description="Essayez de modifier la recherche ou les filtres."
            />
          )
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Note</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableList.map((exp) => (
                    <tr key={exp._id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={exp.category} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{exp.title}</p>
                            <p className="text-xs text-slate-500">{categoryMeta(exp.category).label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={exp.status} />
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-3.5 text-right font-semibold text-slate-900">
                        {formatEUR(exp.amount)}
                      </td>
                      <td className="px-6 py-3.5">{renderActions(exp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {tableList.map((exp) => (
                <li key={exp._id} className="flex items-center gap-3 px-5 py-4">
                  <CategoryIcon category={exp.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{exp.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">{formatDate(exp.date)}</span>
                      <StatusBadge status={exp.status} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular font-semibold text-slate-900">{formatEUR(exp.amount)}</span>
                    {renderActions(exp)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ===== Modale export email ===== */}
      <Modal
        open={exportOpen}
        onClose={() => !exportSending && setExportOpen(false)}
        title="Envoyer mes notes par email"
        description={exportHint}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setExportOpen(false)}
              disabled={exportSending}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="export-form"
              className="btn btn-primary"
              disabled={exportSending || !exportTo.trim()}
            >
              {exportSending ? <Spinner className="size-4" /> : <Mail className="size-4" />}
              {exportSending ? "Envoi..." : "Envoyer"}
            </button>
          </>
        }
      >
        <form id="export-form" onSubmit={sendAllExpensesByEmail} className="space-y-4">
          <div>
            <label htmlFor="export-to" className="label">
              Destinataire
            </label>
            <input
              id="export-to"
              type="email"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              placeholder="comptabilite@entreprise.com"
              className="input"
              disabled={exportSending}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="export-msg" className="label">
              Message <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              id="export-msg"
              rows={3}
              value={exportMessage}
              onChange={(e) => setExportMessage(e.target.value)}
              placeholder="Bonjour, voici mes notes de frais du mois..."
              className="input resize-none"
              disabled={exportSending}
            />
          </div>
        </form>
      </Modal>

      {/* ===== Modale suppression ===== */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Supprimer cette note ?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
              Supprimer
            </button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-slate-600">
            La note <span className="font-semibold text-slate-900">« {deleteTarget.title} »</span> de{" "}
            <span className="tabular font-semibold text-slate-900">{formatEUR(deleteTarget.amount)}</span> sera
            définitivement supprimée.
          </p>
        )}
      </Modal>
    </div>
  );
}
