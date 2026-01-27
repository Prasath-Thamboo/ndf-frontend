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

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
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
      setMode("manual");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        alert(
          "Temps de réponse trop long. La note a peut-être été enregistrée."
        );
        return;
      }
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleScanPreview = async () => {
    if (!receipt) return alert("Sélectionne un justificatif");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", receipt);

      const res = await API.post("/scan", formData, { timeout: 60000 });

      const merchant = res.data?.merchant?.trim() || "";
      const aiTitle = res.data?.title?.trim() || "";

      setForm({
        title: merchant || aiTitle || "Note de frais",
        amount: res.data.amount ?? "",
        date: todayISO(),
        category: res.data.category || "autre",
        description:
          res.data.description || "Données extraites automatiquement",
      });

      setMode("manual");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur analyse IA");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setReceipt(e.target.files?.[0] || null);
    e.target.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold">Créer une note de frais</h1>
        <p className="text-gray-600 mt-1">
          Ajoute une dépense manuellement ou scanne un justificatif.
        </p>
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

      {/* ================= MANUAL ================= */}
      {mode === "manual" && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Titre</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label">Montant (€)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label">Catégorie</label>
              <select
                className="input"
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
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Justificatif</label>
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
              disabled={loading}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
            Téléverse un justificatif, l’IA pré-remplira la note automatiquement.
          </p>

          <div>
            <label className="label">Justificatif</label>
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
              disabled={loading || !receipt}
              className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Analyse en cours..." : "Scanner le justificatif"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
