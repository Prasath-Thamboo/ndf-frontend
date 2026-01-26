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

  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // évite de bloquer toute la page pour un seul chargement
  const [error, setError] = useState("");

  // états UI pour actions approve/reject
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  const fetchPendingExpenses = async () => {
    try {
      setError("");
      setLoadingPending(true);
      const res = await API.get("/expenses", { params: { status: "pending" } });
      setPendingExpenses(res.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors du chargement des notes à valider."
      );
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (!isManager) return;
    fetchCompany();
    fetchEmployees();
    fetchPendingExpenses();
  }, [isManager]);

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

  // ✅ APPROUVER une note
  const approveExpense = async (expenseId) => {
    try {
      setError("");
      setActingId(expenseId);
      await API.patch(`/expenses/${expenseId}/approve`);
      // retire la note de la liste pending (optimiste)
      setPendingExpenses((prev) => prev.filter((x) => x._id !== expenseId));
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'approbation.");
    } finally {
      setActingId(null);
    }
  };

  // ✅ ouvrir le mode refus
  const openReject = (expenseId) => {
    setRejectingId(expenseId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  // ✅ REFUSER une note
  const rejectExpense = async () => {
    if (!rejectingId) return;
    try {
      setError("");
      setActingId(rejectingId);
      await API.patch(`/expenses/${rejectingId}/reject`, {
        reason: rejectReason.trim(),
      });
      setPendingExpenses((prev) => prev.filter((x) => x._id !== rejectingId));
      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du refus.");
    } finally {
      setActingId(null);
    }
  };

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
        <p className="text-gray-600 mt-1">Inviter et gérer les employés.</p>
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>

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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Notes en attente</h2>
          <button
            type="button"
            onClick={fetchPendingExpenses}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loadingPending}
          >
            Rafraîchir
          </button>
        </div>

        {loadingPending ? (
          <p className="mt-4">Chargement...</p>
        ) : pendingExpenses.length === 0 ? (
          <p className="mt-4 text-gray-600">Aucune note en attente.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Titre</th>
                  <th className="py-2">Montant</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Catégorie</th>
                  <th className="py-2">Employé</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingExpenses.map((ex) => {
                  const isActing = actingId === ex._id;
                  const isRejecting = rejectingId === ex._id;

                  return (
                    <tr key={ex._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{ex.title}</td>
                      <td className="py-2">{Number(ex.amount).toFixed(2)} €</td>
                      <td className="py-2">
                        {new Date(ex.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 capitalize">{ex.category || "—"}</td>
                      <td className="py-2">
                        {ex.user?.name || ex.user?.email || "—"}
                      </td>

                      <td className="py-2 text-right">
                        {isRejecting ? (
                          <div className="flex flex-col items-end gap-2">
                            <input
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
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
                          <div className="flex items-center justify-end gap-2">
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
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
