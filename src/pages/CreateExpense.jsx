import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  FileText,
  ImageUp,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Alert, CATEGORY_META, PageHeader, Spinner } from "../components/ui";

const SCAN_MIME = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED = [...SCAN_MIME, "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

const EMPTY_FORM = {
  title: "",
  amount: "",
  date: "",
  category: "autre",
  description: "",
};

export default function CreateExpense() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false); // enregistrement
  const [scanning, setScanning] = useState(false); // analyse IA
  const [scanned, setScanned] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // manager: employé ciblé (obligatoire)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [uiError, setUiError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const isManager = useMemo(() => {
    return (
      user?.accountType === "company" &&
      (user?.role === "manager" || user?.role === "admin")
    );
  }, [user]);

  const busy = loading || scanning;

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
          setUiError("Aucun employé actif disponible. Invitez un employé depuis l’espace manager pour créer une note.");
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

  // aperçu de l'image sélectionnée
  useEffect(() => {
    if (!receipt || !receipt.type.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(receipt);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  const resetAll = () => {
    setForm(EMPTY_FORM);
    setReceipt(null);
    setScanned(false);
    setSelectedEmployeeId("");
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // contrainte UX: manager doit sélectionner un employé
    if (isManager && !selectedEmployeeId) {
      setUiError("Sélectionnez un employé avant de créer une note.");
      return;
    }

    setLoading(true);

    try {
      setUiError("");

      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));

      // manager: obligatoire
      if (isManager) formData.append("userId", selectedEmployeeId);

      if (receipt) formData.append("receipt", receipt);

      await API.post("/expenses", formData, { timeout: 60000 });

      toast.success("Note de frais enregistrée.");
      resetAll();
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        toast.error(
          "Réponse trop lente. La note a peut-être été enregistrée : vérifiez le tableau de bord."
        );
        return;
      }

      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleScanPreview = async () => {
    // manager: doit choisir l’employé même pour le scan IA (car ça termine en création)
    if (isManager && !selectedEmployeeId) {
      setUiError("Sélectionnez un employé avant d'utiliser le scan IA.");
      return;
    }

    if (!receipt) {
      toast.error("Ajoutez d’abord un justificatif.");
      return;
    }

    setScanning(true);

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
        // date lue sur le justificatif, sinon aujourd'hui
        date: res.data.date || todayISO(),
        category: res.data.category || "autre",
        description: res.data.description || "Données extraites automatiquement",
      });

      setScanned(true);
      toast.success("Justificatif analysé. Vérifiez les champs puis validez.");
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        toast.error("Analyse trop lente. Réessayez.");
        return;
      }

      toast.error(err.response?.data?.message || "Erreur lors de l'analyse IA");
    } finally {
      setScanning(false);
    }
  };

  const pickFile = (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format non supporté. Formats acceptés : JPG, PNG, WEBP, PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Fichier trop volumineux (5 Mo maximum).");
      return;
    }
    setReceipt(file);
    setScanned(false);
  };

  const handleFileChange = (e) => {
    pickFile(e.target.files?.[0] || null);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    pickFile(e.dataTransfer.files?.[0] || null);
  };

  const canSubmitManual = useMemo(() => {
    if (busy) return false;
    if (isManager && !selectedEmployeeId) return false;
    return true;
  }, [busy, isManager, selectedEmployeeId]);

  const receiptIsImage = receipt && SCAN_MIME.includes(receipt.type);

  const canScan = useMemo(() => {
    if (busy) return false;
    if (!receipt || !SCAN_MIME.includes(receipt.type)) return false;
    if (isManager && !selectedEmployeeId) return false;
    return true;
  }, [busy, receipt, isManager, selectedEmployeeId]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" />
          Tableau de bord
        </Link>
        <PageHeader
          title="Nouvelle note de frais"
          description="Déposez un justificatif pour un pré-remplissage automatique, ou saisissez la dépense à la main."
        />
      </div>

      {uiError && <Alert>{uiError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ===== Justificatif + IA ===== */}
        <aside className="space-y-4 lg:order-2 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Justificatif</h2>
              <span className="text-xs text-slate-400">JPG, PNG, WEBP, PDF · 5 Mo</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={handleFileChange}
              disabled={busy}
              className="hidden"
            />

            {!receipt ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                disabled={busy}
                className={`mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragOver
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/40"
                }`}
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
                  <ImageUp className="size-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Glissez votre ticket ici
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  ou <span className="font-semibold text-brand-600">parcourez vos fichiers</span>
                </p>
              </button>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                {previewUrl ? (
                  <div className="relative bg-slate-100">
                    <img src={previewUrl} alt="Aperçu du justificatif" className="max-h-72 w-full object-contain" />
                    {scanning && (
                      <div className="absolute inset-0 overflow-hidden bg-brand-900/10">
                        <div className="absolute inset-x-0 h-16 animate-scan bg-linear-to-b from-transparent via-brand-400/40 to-transparent" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid place-items-center bg-slate-50 py-10">
                    <FileText className="size-10 text-slate-400" />
                  </div>
                )}
                <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{receipt.name}</p>
                    <p className="text-xs text-slate-500">{(receipt.size / 1024).toFixed(0)} Ko</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      setScanned(false);
                    }}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Retirer le fichier"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carte IA */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-brand-600 to-violet-600 p-5 text-white shadow-lg shadow-brand-600/20 sm:p-6">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5" />
                <h2 className="font-semibold">Remplissage automatique</h2>
              </div>
              <p className="mt-2 text-sm text-brand-100">
                L’IA lit votre ticket et remplit le montant, la date, l’enseigne et la catégorie. Vous
                vérifiez avant de valider.
              </p>

              {scanned ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-medium">
                  <Check className="size-4" />
                  Champs pré-remplis, vérifiez-les
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleScanPreview}
                  disabled={!canScan}
                  className="btn mt-4 w-full bg-white text-brand-700 shadow-sm hover:bg-brand-50 disabled:opacity-60"
                >
                  {scanning ? (
                    <>
                      <Spinner className="size-4" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Analyser le justificatif
                    </>
                  )}
                </button>
              )}

              {!scanned && (
                <p className="mt-2.5 text-xs text-brand-100/90">
                  {isManager && !selectedEmployeeId
                    ? "Sélectionnez d’abord un employé."
                    : !receipt
                      ? "Ajoutez une photo du justificatif pour commencer."
                      : !receiptIsImage
                        ? "L’analyse IA accepte uniquement les images (JPG, PNG, WEBP)."
                        : "Prêt à analyser."}
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* ===== Formulaire ===== */}
        <form onSubmit={handleManualSubmit} className="card space-y-6 p-5 sm:p-6 lg:order-1 lg:col-span-3">
          {/* Manager: employé ciblé (obligatoire) */}
          {isManager && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <label htmlFor="employee" className="label flex items-center gap-2">
                <UserRound className="size-4 text-slate-500" />
                Pour quel employé ?
              </label>
              <select
                id="employee"
                className="input"
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setUiError("");
                }}
                disabled={busy || loadingEmployees}
                required
              >
                <option value="">{loadingEmployees ? "Chargement..." : "Sélectionner un employé"}</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              <p className="hint">
                En tant que manager, la note sera <strong className="font-semibold text-slate-700">validée automatiquement</strong>.
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="label">
                Titre
              </label>
              <input
                id="title"
                className="input"
                value={form.title}
                onChange={setField("title")}
                placeholder="Ex : Déjeuner client, Train Paris-Lyon..."
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="label">
                Montant
              </label>
              <div className="relative">
                <input
                  id="amount"
                  className="input tabular pr-10"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={setField("amount")}
                  placeholder="0,00"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-medium text-slate-400">
                  €
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="date" className="label">
                Date
              </label>
              <input
                id="date"
                className="input"
                type="date"
                value={form.date}
                onChange={setField("date")}
                required
              />
            </div>
          </div>

          <div>
            <p className="label">Catégorie</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(CATEGORY_META).map(([value, meta]) => {
                const Icon = meta.icon;
                const active = form.category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, category: value })}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-sm font-medium transition ${
                      active
                        ? "border-brand-500 bg-brand-50/60 text-brand-700 ring-4 ring-brand-500/10"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`grid size-9 place-items-center rounded-lg ${meta.className}`}>
                      <Icon className="size-[18px]" />
                    </div>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              id="description"
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={setField("description")}
              placeholder="Contexte, participants, projet..."
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetAll} disabled={busy} className="btn btn-secondary">
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={!canSubmitManual}
              className="btn btn-primary"
              title={isManager && !selectedEmployeeId ? "Sélectionnez un employé" : undefined}
            >
              {loading ? (
                <>
                  <Spinner className="size-4" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Enregistrer la note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
