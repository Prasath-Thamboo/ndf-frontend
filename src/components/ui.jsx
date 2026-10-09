import { useEffect } from "react";
import {
  AlertCircle,
  BedDouble,
  CarFront,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  UtensilsCrossed,
  X,
  XCircle,
} from "lucide-react";
import { initials } from "../utils/format";

/* ---------- Logo ---------- */

export function Logo({ className = "", withText = true, light = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/30">
        <ReceiptText className="size-5 text-white" strokeWidth={2.25} />
      </div>
      {withText && (
        <span
          className={`text-[15px] font-bold tracking-tight ${
            light ? "text-white" : "text-slate-900"
          }`}
        >
          Note de frais
        </span>
      )}
    </div>
  );
}

/* ---------- En-tête de page ---------- */

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Carte KPI ---------- */

const TONES = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
};

export function StatCard({ label, value, sub, icon: Icon, tone = "brand" }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className={`grid size-9 place-items-center rounded-xl ring-1 ${TONES[tone]}`}>
            <Icon className="size-[18px]" />
          </div>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/* ---------- Statuts & catégories ---------- */

export const STATUS_META = {
  pending: {
    label: "En attente",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  approved: {
    label: "Validée",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  rejected: {
    label: "Refusée",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return <span className="text-slate-400">—</span>;
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.className}`}>
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}

export const CATEGORY_META = {
  transport: { label: "Transport", icon: CarFront, className: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  repas: { label: "Repas", icon: UtensilsCrossed, className: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  "hébergement": { label: "Hébergement", icon: BedDouble, className: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  autre: { label: "Autre", icon: ReceiptText, className: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
};

export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.autre;
}

export function CategoryIcon({ category, size = "md" }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  const box = size === "sm" ? "size-8 rounded-lg" : "size-10 rounded-xl";
  return (
    <div className={`grid shrink-0 place-items-center ${box} ${meta.className}`}>
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}

/* ---------- Avatar ---------- */

const AVATAR_COLORS = [
  "from-brand-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export function Avatar({ name, size = "md" }) {
  const sum = String(name || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[sum % AVATAR_COLORS.length];
  const dims = size === "lg" ? "size-14 text-lg" : size === "sm" ? "size-8 text-xs" : "size-10 text-sm";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold text-white ${color} ${dims}`}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- États ---------- */

export function Spinner({ className = "size-5" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function LoadingBlock({ label = "Chargement..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <Spinner className="size-5 text-brand-500" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = ReceiptText, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-7" />
      </div>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ children, tone = "error" }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "info"
        ? "border-brand-200 bg-brand-50 text-brand-800"
        : "border-rose-200 bg-rose-50 text-rose-800";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ---------- Modale ---------- */

export function Modal({ open, onClose, title, description, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-md" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full ${width} animate-slide-up flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <div className="mt-0.5 text-sm text-slate-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Onglets segmentés ---------- */

export function Segmented({ value, onChange, options, disabled }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={`tabular rounded-full px-1.5 text-xs ${
                value === opt.value ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"
              }`}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
