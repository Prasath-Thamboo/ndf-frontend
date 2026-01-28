// src/pages/ManagerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // onglet notes
  const [activeStatus, setActiveStatus] = useState("pending"); // pending | approved | rejected
  const [expensesByStatus, setExpensesByStatus] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [error, setError] = useState("");

  // actions approve/reject (sur pending)
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ====== MODAL HISTORIQUE ======
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyExpense, setHistoryExpense] = useState(null); // expense objet (optionnel)
  const [historyLogs, setHistoryLogs] = useState([]); // AuditLog[]

  const isManager = useMemo(() => {
    return (
      user?.accountType === "company" &&
      (user?.role === "manager" || user?.role === "admin")
    );
  }, [user]);

  const fetchCompany = async () => {
    try {
      setError("");
      const res = await API.get("/company/me");
      setCompany(res.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors du chargement de l'entreprise."
      );
    }
  };

  const fetchEmployees = async () => {
    try {
      setError("");
      setLoadingEmployees(true);
      const res = await API.get("/company/employees");
      setEmployees(res.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors du chargement des employés."
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchExpensesByStatus = async (status) => {
    try {
      setError("");
      setLoadingExpenses(true);

      const res = await API.get("/expenses", { params: { status } });
      setExpensesByStatus((prev) => ({ ...prev, [status]: res.data }));
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors du chargement des notes de frais."
      );
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (!isManager) return;
    fetchCompany();
    fetchEmployees();
    fetchExpensesByStatus("pending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  useEffect(() => {
    if (!isManager) return;
    fetchExpensesByStatus(activeStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, isManager]);

  const handleCopy = async () => {
    if (!company?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(company.inviteCode);
    } catch {
      window.prompt("Copie ce code :", company.inviteCode);
    }
  };

  const handleRegenerate = async () => {
    try {
      setInviteLoading(true);
      setError("");
      const res = await API.post("/company/invite/regenerate");
      setCompany((prev) => ({ ...prev, inviteCode: res.data.inviteCode }));
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors de la régénération du code."
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleEmployee = async (employeeId, nextIsActive) => {
    try {
      setError("");
      await API.patch(`/company/employees/${employeeId}`, {
        isActive: nextIsActive,
      });
      setEmployees((prev) =>
        prev.map((u) =>
          u._id === employeeId ? { ...u, isActive: nextIsActive } : u
        )
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors de la mise à jour de l'employé."
      );
    }
  };

  const approveExpense = async (expenseId) => {
    try {
      setError("");
      setActingId(expenseId);

      await API.patch(`/expenses/${expenseId}/approve`);

      setExpensesByStatus((prev) => {
        const pending = prev.pending.filter((x) => x._id !== expenseId);
        const moved = prev.pending.find((x) => x._id === expenseId);
        const approved = moved
          ? [{ ...moved, status: "approved" }, ...prev.approved]
          : prev.approved;
        return { ...prev, pending, approved };
      });
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'approbation.");
    } finally {
      setActingId(null);
    }
  };

  const openReject = (expenseId) => {
    setRejectingId(expenseId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  const rejectExpense = async () => {
    if (!rejectingId) return;
    try {
      setError("");
      setActingId(rejectingId);

      await API.patch(`/expenses/${rejectingId}/reject`, {
        reason: rejectReason.trim(),
      });

      setExpensesByStatus((prev) => {
        const pending = prev.pending.filter((x) => x._id !== rejectingId);
        const moved = prev.pending.find((x) => x._id === rejectingId);
        const rejected = moved
          ? [
              {
                ...moved,
                status: "rejected",
                rejectionReason: rejectReason.trim(),
              },
              ...prev.rejected,
            ]
          : prev.rejected;
        return { ...prev, pending, rejected };
      });

      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du refus.");
    } finally {
      setActingId(null);
    }
  };

  const statusLabel = (s) => {
    if (s === "pending") return "En attente";
    if (s === "approved") return "Approuvées";
    if (s === "rejected") return "Refusées";
    return s;
  };

  const statusBadge = (status) => {
    if (status === "pending") {
      return (
        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
          En attente
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
          Validée
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
        Refusée
      </span>
    );
  };

  // ====== HISTORIQUE (modal) ======
  const actionLabel = (action) => {
    const map = {
      "expense.created": "Création de la note",
      "expense.approved": "Validation",
      "expense.rejected": "Refus",
      "expense.deleted": "Suppression",
      "expenses.emailed": "Envoi par email",
    };
    return map[action] || action || "Action";
  };

  const openHistory = async (expense) => {
    try {
      setHistoryError("");
      setHistoryExpense(expense);
      setHistoryLogs([]);
      setHistoryOpen(true);
      setHistoryLoading(true);

      const res = await API.get(`/audit/expenses/${expense._id}`);
      setHistoryLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setHistoryError(
        e.response?.data?.message || "Erreur lors du chargement de l'historique."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryLoading(false);
    setHistoryError("");
    setHistoryExpense(null);
    setHistoryLogs([]);
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("fr-FR");
  };

  const currentList = expensesByStatus[activeStatus] || [];

  if (!isManager) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-2">Accès refusé</h1>
        <p className="text-gray-600">Cette page est réservée aux managers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Inviter, gérer les employés et suivre les notes de frais.
        </p>
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>

      {/* Invitation */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Invitation</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="border rounded p-4">
            <p className="text-sm text-gray-500">Entreprise</p>
            <p className="font-medium">{company?.name || "-"}</p>
          </div>

          <div className="border rounded p-4">
            <p className="text-sm text-gray-500">Code d’invitation</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="px-2 py-1 bg-gray-100 rounded font-semibold">
                {company?.inviteCode || "—"}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={!company?.inviteCode}
              >
                Copier
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                disabled={inviteLoading}
              >
                {inviteLoading ? "..." : "Régénérer"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Les employés s’inscrivent avec ce code (mode entreprise &gt;
              employé).
            </p>
          </div>
        </div>
      </div>

      {/* Employés */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Employés</h2>
          <button
            type="button"
            onClick={fetchEmployees}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loadingEmployees}
          >
            Rafraîchir
          </button>
        </div>

        {loadingEmployees ? (
          <p className="mt-4">Chargement...</p>
        ) : employees.length === 0 ? (
          <p className="mt-4 text-gray-600">Aucun employé pour le moment.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Nom</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Rôle</th>
                  <th className="py-2">Statut</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{emp.name}</td>
                    <td className="py-2">{emp.email}</td>
                    <td className="py-2 capitalize">{emp.role}</td>
                    <td className="py-2">
                      {emp.isActive ? (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          Actif
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {emp.role === "employee" ? (
                        <button
                          type="button"
                          onClick={() => toggleEmployee(emp._id, !emp.isActive)}
                          className="text-blue-600 hover:underline"
                        >
                          {emp.isActive ? "Désactiver" : "Réactiver"}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Notes de frais — {statusLabel(activeStatus)}
          </h2>
          <button
            type="button"
            onClick={() => fetchExpensesByStatus(activeStatus)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loadingExpenses}
          >
            Rafraîchir
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-1 rounded text-sm ${
                activeStatus === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              disabled={loadingExpenses}
            >
              {statusLabel(s)} ({(expensesByStatus[s] || []).length})
            </button>
          ))}
        </div>

        {loadingExpenses ? (
          <p>Chargement...</p>
        ) : currentList.length === 0 ? (
          <p className="text-gray-600">Aucune note dans cette catégorie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Titre</th>
                  <th className="py-2">Montant</th>
                  <th className="py-2">Catégorie</th>
                  <th className="py-2">Employé</th>
                  <th className="py-2">Statut</th>

                  {/* Colonnes supplémentaires (approved/rejected) */}
                  {activeStatus !== "pending" && (
                    <th className="py-2">Validé par</th>
                  )}
                  {activeStatus !== "pending" && (
                    <th className="py-2">Validé le</th>
                  )}
                  {activeStatus === "rejected" && (
                    <th className="py-2">Motif</th>
                  )}

                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentList.map((ex) => {
                  const isActing = actingId === ex._id;
                  const isRejecting = rejectingId === ex._id;

                  const validatedByLabel =
                    ex.validatedBy?.name ||
                    ex.validatedBy?.email ||
                    (typeof ex.validatedBy === "string" ? ex.validatedBy : "—");

                  return (
                    <tr key={ex._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        {ex.date
                          ? new Date(ex.date).toLocaleDateString("fr-FR")
                          : "-"}
                      </td>
                      <td className="py-2">{ex.title}</td>
                      <td className="py-2">{Number(ex.amount).toFixed(2)} €</td>
                      <td className="py-2 capitalize">{ex.category || "—"}</td>
                      <td className="py-2">
                        {ex.user?.name || ex.user?.email || "—"}
                      </td>
                      <td className="py-2">{statusBadge(ex.status)}</td>

                      {activeStatus !== "pending" && (
                        <td className="py-2">{validatedByLabel}</td>
                      )}
                      {activeStatus !== "pending" && (
                        <td className="py-2">
                          {ex.validatedAt
                            ? new Date(ex.validatedAt).toLocaleString("fr-FR")
                            : "—"}
                        </td>
                      )}
                      {activeStatus === "rejected" && (
                        <td className="py-2">
                          {ex.rejectionReason?.trim()
                            ? ex.rejectionReason
                            : "—"}
                        </td>
                      )}

                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openHistory(ex)}
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                            disabled={isActing}
                          >
                            Historique
                          </button>

                          {activeStatus !== "pending" ? (
                            <span className="text-gray-400">—</span>
                          ) : isRejecting ? (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                placeholder="Motif (optionnel)"
                                className="w-64 max-w-full border rounded px-2 py-1 text-sm"
                                disabled={isActing}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={cancelReject}
                                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                  disabled={isActing}
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={rejectExpense}
                                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                  disabled={isActing}
                                >
                                  {isActing ? "..." : "Refuser"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => approveExpense(ex._id)}
                                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                disabled={isActing}
                              >
                                {isActing ? "..." : "Approuver"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openReject(ex._id)}
                                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                disabled={isActing}
                              >
                                Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          MODAL HISTORIQUE
          ========================= */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeHistory}
          />

          {/* modal */}
          <div className="relative z-10 w-[92vw] max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b p-4">
              <div>
                <h3 className="text-lg font-semibold">Historique</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {historyExpense ? (
                    <>
                      <span className="font-medium">{historyExpense.title}</span>{" "}
                      · {Number(historyExpense.amount).toFixed(2)} € ·{" "}
                      {historyExpense.date
                        ? new Date(historyExpense.date).toLocaleDateString(
                            "fr-FR"
                          )
                        : "-"}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Fermer
              </button>
            </div>

            <div className="p-4">
              {historyError && (
                <p className="mb-3 text-red-600">{historyError}</p>
              )}

              {historyLoading ? (
                <p>Chargement...</p>
              ) : historyLogs.length === 0 ? (
                <p className="text-gray-600">Aucun évènement enregistré.</p>
              ) : (
                <ol className="relative border-l pl-6 space-y-4">
                  {historyLogs.map((log) => {
                    const actor =
                      log.actor?.name ||
                      log.actor?.email ||
                      "Utilisateur";

                    const action = actionLabel(log.action);
                    const dt = formatDateTime(log.createdAt);

                    // petites infos utiles issues de metadata
                    const meta = log.metadata || {};
                    const reason =
                      typeof meta.reason === "string" && meta.reason.trim()
                        ? meta.reason.trim()
                        : "";

                    return (
                      <li key={log._id} className="relative">
                        <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-gray-900" />

                        <div className="rounded border p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="font-medium">{action}</div>
                            <div className="text-xs text-gray-500">{dt}</div>
                          </div>

                          <div className="mt-1 text-sm text-gray-700">
                            <span className="text-gray-500">Par :</span>{" "}
                            {actor}
                            {log.actor?.role ? (
                              <span className="text-gray-500">
                                {" "}
                                · {log.actor.role}
                              </span>
                            ) : null}
                          </div>

                          {reason && (
                            <div className="mt-2 text-sm">
                              <div className="text-gray-500">Motif :</div>
                              <div className="whitespace-pre-wrap">{reason}</div>
                            </div>
                          )}

                          {"to" in meta && meta.to ? (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="text-gray-500">Destinataire :</span>{" "}
                              {String(meta.to)}
                            </div>
                          ) : null}

                          {"amount" in meta && Number.isFinite(Number(meta.amount)) ? (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="text-gray-500">Montant :</span>{" "}
                              {Number(meta.amount).toFixed(2)} €
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
