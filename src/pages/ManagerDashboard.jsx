import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState("");

  const isManager = useMemo(() => {
    return user?.accountType === "company" && (user?.role === "manager" || user?.role === "admin");
  }, [user]);

  const fetchCompany = async () => {
    try {
      setError("");
      const res = await API.get("/company/me");
      setCompany(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du chargement de l'entreprise.");
    }
  };

  const fetchEmployees = async () => {
    try {
      setError("");
      setLoadingEmployees(true);
      const res = await API.get("/company/employees");
      setEmployees(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du chargement des employés.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (!isManager) return;
    fetchCompany();
    fetchEmployees();
  }, [isManager]);

  const handleCopy = async () => {
    if (!company?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(company.inviteCode);
    } catch {
      // fallback simple
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
      setError(e.response?.data?.message || "Erreur lors de la régénération du code.");
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleEmployee = async (employeeId, nextIsActive) => {
    try {
      setError("");
      await API.patch(`/company/employees/${employeeId}`, { isActive: nextIsActive });
      setEmployees((prev) =>
        prev.map((u) => (u._id === employeeId ? { ...u, isActive: nextIsActive } : u))
      );
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de la mise à jour de l'employé.");
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
              Les employés s’inscrivent avec ce code (mode entreprise &gt; employé).
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
    </div>
  );
}
