// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function UserDashboard() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState("all"); // "all" | "2025" | ...
  const [mode, setMode] = useState("monthly"); // "monthly" | "weekly"

  // on choisit explicitement quel mois/semaine afficher dans le graphe
  const [selectedMonth, setSelectedMonth] = useState("all"); // "all" | "YYYY-MM"
  const [selectedWeek, setSelectedWeek] = useState("all"); // "all" | "YYYY-Www"

  // ===== Export Email (batch) =====
  const [exportTo, setExportTo] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportSending, setExportSending] = useState(false);
  const [exportSuccess, setExportSuccess] = useState("");

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
    if (user.accountType === "solo") return "Enverra toutes vos notes de frais.";
    return "Enverra uniquement les notes approuvées de l’entreprise.";
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

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette note de frais ?")) return;

    try {
      await API.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message ||
          "Erreur lors de la suppression de la note de frais."
      );
    }
  };

  const sendAllExpensesByEmail = async () => {
    try {
      setError("");
      setExportSuccess("");
      setExportSending(true);

      await API.post("/expenses/email", {
        to: exportTo.trim(),
        message: exportMessage.trim(),
      });

      setExportSuccess("Email envoyé avec succès.");
      setExportTo("");
      setExportMessage("");
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message ||
          "Erreur lors de l'envoi des notes par email."
      );
    } finally {
      setExportSending(false);
    }
  };

  // ---------- Helpers ----------
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

  const formatMonthLabel = (ym) => {
    const [y, m] = ym.split("-");
    return `${m}/${y}`;
  };

  const formatWeekLabel = (yw) => {
    const [y, w] = yw.split("-W");
    return `S${w} (${y})`;
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

  // Axe X (mensuel): jours 1..31, mais on peut limiter au nb de jours du mois choisi
  const monthDays = useMemo(() => {
    if (mode !== "monthly" || !selectedMonth || selectedMonth === "all") return 31;
    const [y, m] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return lastDay;
  }, [mode, selectedMonth]);

  const totalVisible = useMemo(() => {
    return scatterData.reduce((s, p) => s + (Number(p.y) || 0), 0);
  }, [scatterData]);

  // tooltip custom
  const tooltipFormatter = (_, __, props) => {
    const p = props?.payload;
    if (!p) return null;
    return [
      <div key="t" className="text-sm">
        <div className="font-semibold">{p.title}</div>
        <div>Date: {p.date}</div>
        <div>Montant: {Number(p.y).toFixed(2)} €</div>
        <div>Catégorie: {p.category}</div>
        <div>Statut: {p.status}</div>
      </div>,
      "",
    ];
  };

  // tableau simple (toutes les dépenses filtrées année)
  const tableList = useMemo(() => {
    return filteredByYear
      .filter((e) => e?.date)
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredByYear]);

  return (
    <div className="space-y-6">
      {/* ===== EXPORT EMAIL (solo / manager uniquement) ===== */}
      {canExportEmail && (
        <section className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold">Envoyer mes notes par email</h2>
          <p className="text-sm text-gray-600">{exportHint}</p>

          {exportSuccess && (
            <p className="text-green-600 text-sm">{exportSuccess}</p>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">Destinataire</label>
              <input
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                placeholder="email@domaine.com"
                className="mt-1 w-full border rounded px-3 py-2"
                disabled={exportSending}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Message (optionnel)</label>
              <input
                value={exportMessage}
                onChange={(e) => setExportMessage(e.target.value)}
                placeholder="Message..."
                className="mt-1 w-full border rounded px-3 py-2"
                disabled={exportSending}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={sendAllExpensesByEmail}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={exportSending || !exportTo.trim()}
            >
              {exportSending ? "Envoi..." : "Envoyer par email"}
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Le backend applique les règles d’accès (solo autorisé, company: manager/admin + notes approuvées).
          </p>
        </section>
      )}

      {/* ===== GRAPHIQUE POINTS PAR DEPENSE ===== */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tableau de bord</h2>
            <p className="text-sm text-gray-500">
              Total affiché (sélection) : {totalVisible.toFixed(2)} €
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="border rounded px-3 py-2"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth("all");
                setSelectedWeek("all");
              }}
              disabled={loading}
            >
              <option value="all">Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={loading}
            >
              <option value="monthly">Mensuel (points par dépense)</option>
              <option value="weekly">Hebdo (points par dépense)</option>
            </select>

            {mode === "monthly" ? (
              <select
                className="border rounded px-3 py-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={loading || availableMonths.length === 0}
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
                className="border rounded px-3 py-2"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                disabled={loading || availableWeeks.length === 0}
              >
                <option value="all">Choisir une semaine</option>
                {availableWeeks.map((w) => (
                  <option key={w} value={w}>
                    {formatWeekLabel(w)}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={fetchExpenses}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>

        {!canExportEmail && error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-6 h-80">
          {loading ? (
            <p>Chargement...</p>
          ) : mode === "monthly" && (!selectedMonth || selectedMonth === "all") ? (
            <p className="text-gray-500">
              Sélectionne un mois pour afficher les points (1 point = 1 dépense).
            </p>
          ) : mode === "weekly" && (!selectedWeek || selectedWeek === "all") ? (
            <p className="text-gray-500">
              Sélectionne une semaine pour afficher les points (1 point = 1 dépense).
            </p>
          ) : scatterData.length === 0 ? (
            <p className="text-gray-500">
              Aucune dépense dans la période sélectionnée.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={mode === "monthly" ? [1, monthDays] : [1, 7]}
                  allowDecimals={false}
                  tickCount={mode === "monthly" ? monthDays : 7}
                  tickFormatter={(v) => {
                    if (mode === "monthly") return String(v);
                    return ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"][v - 1] || v;
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  tickFormatter={(v) => `${Number(v).toFixed(0)}€`}
                />

                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={tooltipFormatter} />

                <Scatter data={scatterData} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ===== TABLEAU LISTE (optionnel) ===== */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Mes notes de frais</h2>

        {loading ? (
          <p>Chargement...</p>
        ) : tableList.length === 0 ? (
          <p>Aucune note de frais pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Date</th>
                  <th className="py-2 px-4">Titre</th>
                  <th className="py-2 px-4">Montant</th>
                  <th className="py-2 px-4">Catégorie</th>
                  <th className="py-2 px-4">Statut</th>
                  <th className="py-2 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableList.map((exp) => (
                  <tr key={exp._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {exp.date
                        ? new Date(exp.date).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="py-2 px-4">{exp.title}</td>
                    <td className="py-2 px-4">
                      {Number(exp.amount).toFixed(2)} €
                    </td>
                    <td className="py-2 px-4 capitalize">{exp.category}</td>
                    <td className="py-2 px-4 capitalize">
                      {exp.status === "pending" && (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                      {exp.status === "approved" && (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          Validée
                        </span>
                      )}
                      {exp.status === "rejected" && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          Refusée
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {exp.status === "pending" ? (
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Supprimer
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
