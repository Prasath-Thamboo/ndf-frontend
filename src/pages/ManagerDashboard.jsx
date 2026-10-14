// src/pages/ManagerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Clock3,
  Copy,
  FileText,
  History,
  Inbox,
  RefreshCw,
  ShieldAlert,
  Users,
  Wallet,
  X,
} from "lucide-react";
import API, { openReceipt } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Alert,
  Avatar,
  CategoryIcon,
  EmptyState,
  LoadingBlock,
  Modal,
  PageHeader,
  Segmented,
  Spinner,
  StatCard,
  Switch,
  StatusBadge,
  categoryMeta,
} from "../components/ui";
import { formatDate, formatDateTime, formatEUR } from "../utils/format";

const ROLE_LABELS = { employee: "Employé", manager: "Manager", admin: "Admin" };

export default function ManagerDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [company, setCompany] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ====== MODAL HISTORIQUE ======
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyExpense, setHistoryExpense] = useState(null);
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
  }, [isManager]);

  useEffect(() => {
    if (!isManager) return;
    fetchExpensesByStatus(activeStatus);
  }, [activeStatus, isManager]);

  const refreshAll = () => {
    fetchCompany();
    fetchEmployees();
    fetchExpensesByStatus(activeStatus);
  };

  const handleCopy = async () => {
    if (!company?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(company.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce code :", company.inviteCode);
    }
  };

  const handleRegenerate = async () => {
    try {
      setInviteLoading(true);
      const res = await API.post("/company/invite/regenerate");
      setCompany((prev) => ({ ...prev, inviteCode: res.data.inviteCode }));
      toast.success("Nouveau code d’invitation généré.");
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "Erreur lors de la régénération du code."
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleEmployee = async (employeeId, nextIsActive) => {
    try {
      await API.patch(`/company/employees/${employeeId}`, {
        isActive: nextIsActive,
      });
      setEmployees((prev) =>
        prev.map((u) =>
          u._id === employeeId ? { ...u, isActive: nextIsActive } : u
        )
      );
      toast.success(nextIsActive ? "Employé réactivé." : "Employé désactivé.");
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "Erreur lors de la mise à jour de l'employé."
      );
    }
  };

  const approveExpense = async (expenseId) => {
    try {
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
      toast.success("Note approuvée.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l'approbation.");
    } finally {
      setActingId(null);
    }
  };

  const handleOpenReceipt = async (expenseId) => {
    try {
      await openReceipt(expenseId);
    } catch {
      toast.error("Impossible d'ouvrir le justificatif.");
    }
  };

  const openReject = (expense) => {
    setRejectTarget(expense);
    setRejectReason("");
  };

  const cancelReject = () => {
    if (actingId) return;
    setRejectTarget(null);
    setRejectReason("");
  };

  const rejectExpense = async () => {
    if (!rejectTarget) return;
    const rejectingId = rejectTarget._id;
    try {
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

      setRejectTarget(null);
      setRejectReason("");
      toast.success("Note refusée.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors du refus.");
    } finally {
      setActingId(null);
    }
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

  const actionDot = (action) => {
    if (action === "expense.approved") return "bg-emerald-500 ring-emerald-100";
    if (action === "expense.rejected" || action === "expense.deleted") return "bg-rose-500 ring-rose-100";
    return "bg-brand-500 ring-brand-100";
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

  const currentList = expensesByStatus[activeStatus] || [];
  const pendingTotal = expensesByStatus.pending.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.isActive).length;
  const totalEmployees = employees.filter((e) => e.role === "employee").length;

  if (!isManager) {
    return (
      <div className="card">
        <EmptyState
          icon={ShieldAlert}
          title="Accès réservé"
          description="Cette page est réservée aux managers d’une entreprise."
        />
      </div>
    );
  }

  const renderActions = (ex) => {
    const isActing = actingId === ex._id;
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => openHistory(ex)}
          className="btn btn-ghost btn-sm px-2"
          disabled={isActing}
          title="Historique"
          aria-label="Historique"
        >
          <History className="size-4" />
        </button>
        {ex.receipt?.path && (
          <button
            type="button"
            onClick={() => handleOpenReceipt(ex._id)}
            className="btn btn-ghost btn-sm px-2"
            title="Justificatif"
            aria-label="Justificatif"
          >
            <FileText className="size-4" />
          </button>
        )}
        {activeStatus === "pending" && (
          <>
            <button
              type="button"
              onClick={() => openReject(ex)}
              className="btn btn-sm border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
              disabled={isActing}
            >
              <X className="size-3.5" />
              Refuser
            </button>
            <button
              type="button"
              onClick={() => approveExpense(ex._id)}
              className="btn btn-success btn-sm"
              disabled={isActing}
            >
              {isActing ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
              Approuver
            </button>
          </>
        )}
      </div>
    );
  };

  const renderValidation = (ex) => {
    if (activeStatus === "pending") return null;
    const validatedByLabel =
      ex.validatedBy?.name ||
      ex.validatedBy?.email ||
      (typeof ex.validatedBy === "string" ? ex.validatedBy : null);
    return (
      <div className="mt-1 space-y-0.5 text-xs text-slate-500">
        {(validatedByLabel || ex.validatedAt) && (
          <p>
            {activeStatus === "rejected" ? "Refusée" : "Validée"}
            {validatedByLabel ? ` par ${validatedByLabel}` : ""}
            {ex.validatedAt ? ` · ${formatDateTime(ex.validatedAt)}` : ""}
          </p>
        )}
        {activeStatus === "rejected" && ex.rejectionReason?.trim() && (
          <p className="text-rose-600">Motif : {ex.rejectionReason}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Espace manager"
        description={company?.name ? `Gérez l’équipe et les notes de frais de ${company.name}.` : "Gérez votre équipe et les notes de frais."}
        actions={
          <button
            type="button"
            onClick={refreshAll}
            className="btn btn-secondary"
            disabled={loadingExpenses || loadingEmployees}
          >
            <RefreshCw className={`size-4 ${loadingExpenses || loadingEmployees ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {/* ===== Invitation + KPIs ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white lg:row-span-2">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Building2 className="size-4" />
              {company?.name || "—"}
            </div>
            <p className="mt-6 text-sm font-medium text-slate-300">Code d’invitation</p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.2em] text-white">
              {company?.inviteCode || "······"}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Partagez ce code : vos employés le saisissent lors de leur inscription (Entreprise → Je suis employé).
            </p>
            <div className="mt-auto flex gap-2 pt-6">
              <button
                type="button"
                onClick={handleCopy}
                className="btn flex-1 bg-white text-slate-900 hover:bg-slate-100"
                disabled={!company?.inviteCode}
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copied ? "Copié !" : "Copier"}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10"
                disabled={inviteLoading}
                title="Générer un nouveau code"
              >
                <RefreshCw className={`size-4 ${inviteLoading ? "animate-spin" : ""}`} />
                Régénérer
              </button>
            </div>
          </div>
        </div>

        <StatCard
          label="À valider"
          value={expensesByStatus.pending.length}
          sub="notes en attente"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Montant en attente"
          value={formatEUR(pendingTotal)}
          sub="à approuver"
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label="Employés actifs"
          value={`${activeEmployees} / ${totalEmployees}`}
          sub="dans l’entreprise"
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label="Validées"
          value={expensesByStatus.approved.length}
          sub="notes chargées"
          icon={Check}
          tone="sky"
        />
      </div>

      {/* ===== Notes ===== */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Notes de frais</h2>
            <p className="mt-0.5 text-sm text-slate-500">Approuvez ou refusez les dépenses de l’équipe.</p>
          </div>
          <div className="overflow-x-auto">
            <Segmented
              value={activeStatus}
              onChange={setActiveStatus}
              disabled={loadingExpenses}
              options={[
                { value: "pending", label: "En attente", count: expensesByStatus.pending.length },
                { value: "approved", label: "Approuvées", count: expensesByStatus.approved.length },
                { value: "rejected", label: "Refusées", count: expensesByStatus.rejected.length },
              ]}
            />
          </div>
        </div>

        {loadingExpenses ? (
          <LoadingBlock />
        ) : currentList.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={activeStatus === "pending" ? "Tout est à jour 🎉" : "Aucune note"}
            description={
              activeStatus === "pending"
                ? "Aucune note n’attend votre validation."
                : "Aucune note dans cette catégorie."
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Note</th>
                    <th className="px-4 py-3">Employé</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentList.map((ex) => (
                    <tr key={ex._id} className="align-top transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <CategoryIcon category={ex.category} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">{ex.title}</p>
                            <p className="text-xs text-slate-500">{categoryMeta(ex.category).label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={ex.user?.name || ex.user?.email} size="sm" />
                          <span className="whitespace-nowrap text-slate-700">
                            {ex.user?.name || ex.user?.email || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(ex.date)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={ex.status} />
                        {renderValidation(ex)}
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-4 text-right font-semibold text-slate-900">
                        {formatEUR(ex.amount)}
                      </td>
                      <td className="px-6 py-4">{renderActions(ex)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablette */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {currentList.map((ex) => (
                <li key={ex._id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={ex.category} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{ex.title}</p>
                      <p className="text-xs text-slate-500">
                        {ex.user?.name || ex.user?.email || "—"} · {formatDate(ex.date)}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge status={ex.status} />
                        {renderValidation(ex)}
                      </div>
                    </div>
                    <span className="tabular font-semibold text-slate-900">{formatEUR(ex.amount)}</span>
                  </div>
                  {renderActions(ex)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ===== Employés ===== */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-slate-900">Équipe</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {employees.length} membre{employees.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loadingEmployees ? (
          <LoadingBlock />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun employé pour le moment"
            description="Partagez votre code d’invitation pour que vos employés rejoignent l’entreprise."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <li key={emp._id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <Avatar name={emp.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{emp.name}</p>
                    <span className="badge bg-slate-50 text-slate-600 ring-slate-200">
                      {ROLE_LABELS[emp.role] || emp.role}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-500">{emp.email}</p>
                </div>
                {emp.role === "employee" ? (
                  <div className="flex items-center gap-3">
                    <span className={`hidden text-sm sm:inline ${emp.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {emp.isActive ? "Actif" : "Désactivé"}
                    </span>
                    <Switch
                      checked={!!emp.isActive}
                      onChange={() => toggleEmployee(emp._id, !emp.isActive)}
                      label={emp.isActive ? `Désactiver ${emp.name}` : `Réactiver ${emp.name}`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Modale refus ===== */}
      <Modal
        open={!!rejectTarget}
        onClose={cancelReject}
        title="Refuser la note"
        description={
          rejectTarget ? (
            <>
              {rejectTarget.title} · <span className="tabular">{formatEUR(rejectTarget.amount)}</span>
            </>
          ) : null
        }
        size="sm"
        footer={
          <>
            <button type="button" onClick={cancelReject} className="btn btn-secondary" disabled={!!actingId}>
              Annuler
            </button>
            <button type="button" onClick={rejectExpense} className="btn btn-danger" disabled={!!actingId}>
              {actingId ? <Spinner className="size-4" /> : <X className="size-4" />}
              Refuser la note
            </button>
          </>
        }
      >
        <label htmlFor="reject-reason" className="label">
          Motif <span className="font-normal text-slate-400">(optionnel)</span>
        </label>
        <textarea
          id="reject-reason"
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ex : justificatif illisible, dépense non éligible..."
          className="input resize-none"
          disabled={!!actingId}
          autoFocus
        />
        <p className="hint">L’employé verra ce motif dans l’historique de la note.</p>
      </Modal>

      {/* ===== Modale historique ===== */}
      <Modal
        open={historyOpen}
        onClose={closeHistory}
        title="Historique"
        size="lg"
        description={
          historyExpense ? (
            <>
              <span className="font-medium text-slate-700">{historyExpense.title}</span> ·{" "}
              <span className="tabular">{formatEUR(historyExpense.amount)}</span> · {formatDate(historyExpense.date)}
            </>
          ) : null
        }
      >
        {historyError && (
          <div className="mb-4">
            <Alert>{historyError}</Alert>
          </div>
        )}

        {historyLoading ? (
          <LoadingBlock />
        ) : historyLogs.length === 0 ? (
          <EmptyState icon={History} title="Aucun évènement" description="Aucune action n’a été enregistrée pour cette note." />
        ) : (
          <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
            {historyLogs.map((log) => {
              const actor = log.actor?.name || log.actor?.email || "Utilisateur";
              const meta = log.metadata || {};
              const reason =
                typeof meta.reason === "string" && meta.reason.trim()
                  ? meta.reason.trim()
                  : "";

              return (
                <li key={log._id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 size-3.5 rounded-full ring-4 ${actionDot(log.action)}`}
                  />
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="font-semibold text-slate-900">{actionLabel(log.action)}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Par {actor}
                    {log.actor?.role ? (
                      <span className="text-slate-400"> · {ROLE_LABELS[log.actor.role] || log.actor.role}</span>
                    ) : null}
                  </p>

                  {(reason || ("to" in meta && meta.to) || ("amount" in meta && Number.isFinite(Number(meta.amount)))) && (
                    <div className="mt-2 space-y-1 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                      {reason && (
                        <p className="whitespace-pre-wrap">
                          <span className="text-slate-500">Motif : </span>
                          {reason}
                        </p>
                      )}
                      {"to" in meta && meta.to ? (
                        <p>
                          <span className="text-slate-500">Destinataire : </span>
                          {String(meta.to)}
                        </p>
                      ) : null}
                      {"amount" in meta && Number.isFinite(Number(meta.amount)) ? (
                        <p>
                          <span className="text-slate-500">Montant : </span>
                          <span className="tabular">{formatEUR(meta.amount)}</span>
                        </p>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Modal>
    </div>
  );
}
