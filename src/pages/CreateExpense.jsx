import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function CreateExpense() {
  const { user } = useAuth();

  const [mode, setMode] = useState("manual"); // manual | scan
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // manager: employé ciblé (obligatoire)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // feedback UI (sans changer logique backend)
  const [uiError, setUiError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: "autre",
    description: "",
  });

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const isManager = useMemo(() => {
    return (
      user?.accountType === "company" &&
      (user?.role === "manager" || user?.role === "admin")
    );
  }, [user]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isManager) return;

      try {
        setLoadingEmployees(true);
        setUiError("");

        const res = await API.get("/company/employees");

        // On ne propose que les employés actifs
        const list = (res.data || []).filter(
          (u) => u.role === "employee" && u.isActive !== false
        );

        setEmployees(list);

        // si aucun employé: bloque la création côté UX (le backend bloquera aussi)
        if (list.length === 0) {
          setUiError("Aucun employé actif disponible. Impossible de créer une note.");
        }
      } catch (e) {
        setUiError(
          e.response?.data?.message || "Erreur lors du chargement des employés."
        );
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [isManager]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // ✅ contrainte UX: manager doit sélectionner un employé
    if (isManager && !selectedEmployeeId) {
      setUiError("Sélectionne un employé avant de créer une note.");
      return;
    }

    setLoading(true);

    try {
      setUiError("");

      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));

      // ✅ manager: obligatoire
      if (isManager) formData.append("userId", selectedEmployeeId);

      if (receipt) formData.append("receipt", receipt);

      await API.post("/expenses", formData, { timeout: 60000 });

      alert("Note de frais enregistrée");

      setForm({
        title: "",
        amount: "",
        date: "",
        category: "autre",
        description: "",
      });
      setReceipt(null);
      setSelectedEmployeeId("");
      setMode("manual");
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        alert(
          "Réponse trop lente (timeout). La note a peut-être été enregistrée. Recharge le dashboard pour vérifier."
        );
        return;
      }

      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleScanPreview = async () => {
    // ✅ manager: doit choisir l’employé même pour scan IA (car ça termine en création manuelle)
    if (isManager && !selectedEmployeeId) {
      setUiError("Sélectionne un employé avant d'utiliser le scan IA.");
      return;
    }

    if (!receipt) {
      alert("Veuillez sélectionner un justificatif");
      return;
    }

    setLoading(true);

    try {
      setUiError("");

      const formData = new FormData();
      formData.append("receipt", receipt);

      const res = await API.post("/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const merchant =
        typeof res.data?.merchant === "string" ? res.data.merchant.trim() : "";

      const aiTitle =
        typeof res.data?.title === "string" ? res.data.title.trim() : "";

      const computedTitle = merchant || aiTitle || "Note de frais";

      setForm({
        title: computedTitle,
        amount: res.data.amount ?? "",
        date: todayISO(),
        category: res.data.category || "autre",
        description: res.data.description || "Données extraites automatiquement",
      });

      // bascule vers le mode manuel pour validation humaine
      setMode("manual");
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        alert("Analyse trop lente (timeout). Réessaie.");
        return;
      }

      alert(err.response?.data?.message || "Erreur lors de l'analyse IA");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setReceipt(file);
    e.target.value = "";
  };

  const canSubmitManual = useMemo(() => {
    if (loading) return false;
    if (isManager && !selectedEmployeeId) return false;
    return true;
  }, [loading, isManager, selectedEmployeeId]);

  const canScan = useMemo(() => {
    if (loading) return false;
    if (!receipt) return false;
    if (isManager && !selectedEmployeeId) return false;
    return true;
  }, [loading, receipt, isManager, selectedEmployeeId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold">Créer une note de frais</h1>
        <p className="text-gray-600 mt-1">
          Ajoute une dépense manuellement ou scanne un justificatif.
        </p>

        {uiError && <p className="mt-4 text-red-600">{uiError}</p>}
      </div>

      {/* Mode selector */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-3">
        <button
          type="button"
          onClick={() => setMode("manual")}
          disabled={loading}
          className={`flex-1 py-2 rounded font-medium transition ${
            mode === "manual"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Création manuelle
        </button>

        <button
          type="button"
          onClick={() => setMode("scan")}
          disabled={loading}
          className={`flex-1 py-2 rounded font-medium transition ${
            mode === "scan"
              ? "bg-green-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Scan IA
        </button>
      </div>

      {/* Manager: select employee (obligatoire) */}
      {isManager && (
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <h2 className="text-lg font-semibold">Pour quel employé ?</h2>
          <p className="text-sm text-gray-600">
            En mode entreprise, un manager doit sélectionner un employé. La note
            sera <strong>validée automatiquement</strong>.
          </p>

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Employé (obligatoire)
          </label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedEmployeeId}
            onChange={(e) => {
              setSelectedEmployeeId(e.target.value);
              setUiError("");
            }}
            disabled={loading || loadingEmployees}
            required
          >
            <option value="">— Sélectionner un employé —</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>

          {loadingEmployees && (
            <p className="text-sm text-gray-500">Chargement des employés...</p>
          )}
        </div>
      )}

      {/* ================= MANUAL ================= */}
      {mode === "manual" && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (€)
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="transport">Transport</option>
                <option value="repas">Repas</option>
                <option value="hébergement">Hébergement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificatif (optionnel)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={loading}
            />
            {receipt && (
              <p className="text-sm text-gray-500 mt-1">
                Fichier sélectionné : {receipt.name}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmitManual}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              title={
                isManager && !selectedEmployeeId
                  ? "Sélectionne un employé"
                  : undefined
              }
            >
              {loading ? "Enregistrement..." : "Valider la note"}
            </button>
          </div>
        </form>
      )}

      {/* ================= SCAN IA ================= */}
      {mode === "scan" && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Téléverse un justificatif, l’IA pré-remplira la note automatiquement
            (la création finale se fait en mode manuel).
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificatif
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={loading}
            />
            {receipt && (
              <p className="text-sm text-gray-500 mt-1">
                Fichier sélectionné : {receipt.name}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleScanPreview}
              disabled={!canScan}
              className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              title={
                isManager && !selectedEmployeeId
                  ? "Sélectionne un employé"
                  : !receipt
                    ? "Ajoute un justificatif"
                    : undefined
              }
            >
              {loading ? "Analyse en cours..." : "Scanner le justificatif"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
