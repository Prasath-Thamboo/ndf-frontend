import { useState } from "react";
import API from "../api";

export default function CreateExpense() {
  const [mode, setMode] = useState("manual"); // manual | scan
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: "autre",
    description: "",
  });

  // YYYY-MM-DD (pour input type="date")
  const todayISO = () => new Date().toISOString().slice(0, 10);

  // =========================
  // Création MANUELLE (finale)
  // =========================
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (receipt) {
        formData.append("receipt", receipt);
      }

      // ✅ évite le timeout 10s si la réponse prend plus de temps
      await API.post("/expenses", formData, { timeout: 60000 });

      alert("Note de frais enregistrée");

      // reset
      setForm({
        title: "",
        amount: "",
        date: "",
        category: "autre",
        description: "",
      });
      setReceipt(null);
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

  // =========================
  // Scan IA → pré-remplissage
  // =========================
  const handleScanPreview = async () => {
    if (!receipt) {
      alert("Veuillez sélectionner un justificatif");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("receipt", receipt);

      const res = await API.post("/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      // Règles demandées :
      // 1) Date = aujourd'hui (toujours)
      // 2) Titre = nom société (merchant) si disponible, sinon title, sinon fallback
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

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-6">Créer une note de frais</h1>

      {/* Sélecteur de mode */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded ${
            mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          disabled={loading}
        >
          Création manuelle
        </button>

        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`px-4 py-2 rounded ${
            mode === "scan" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
          disabled={loading}
        >
          Scan IA
        </button>
      </div>

      {/* ================= MODE MANUEL ================= */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <input
            className="input"
            placeholder="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="Montant"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />

          <input
            className="input"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />

          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="transport">Transport</option>
            <option value="repas">Repas</option>
            <option value="hébergement">Hébergement</option>
            <option value="autre">Autre</option>
          </select>

          <textarea
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Valider la note"}
          </button>
        </form>
      )}

      {/* ================= MODE SCAN IA ================= */}
      {mode === "scan" && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={loading}
          />

          <button
            type="button"
            onClick={handleScanPreview}
            disabled={loading || !receipt}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Analyse en cours..." : "Scanner le justificatif"}
          </button>
        </div>
      )}
    </div>
  );
}
