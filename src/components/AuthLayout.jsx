import { CheckCircle2, ScanLine, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "./ui";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Scan IA des justificatifs",
    text: "Photographiez un ticket, les champs se remplissent tout seuls.",
  },
  {
    icon: Zap,
    title: "Validation en un clic",
    text: "Les managers approuvent ou refusent en quelques secondes.",
  },
  {
    icon: ShieldCheck,
    title: "Historique complet",
    text: "Chaque action est tracée pour un suivi transparent.",
  },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Panneau de présentation */}
      <div className="relative hidden w-[46%] overflow-hidden bg-slate-950 lg:block">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-600/40 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 size-[420px] rounded-full bg-violet-600/30 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Logo light />

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-[44px]">
              Vos notes de frais,{" "}
              <span className="bg-linear-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">
                sans la paperasse.
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Saisissez, scannez et validez vos dépenses professionnelles au même endroit.
            </p>

            <ul className="mt-10 space-y-5">
              {FEATURES.map(({ icon: Icon, title: t, text }) => (
                <li key={t} className="flex gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="size-5 text-brand-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t}</p>
                    <p className="text-sm text-slate-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Données hébergées en toute sécurité
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-[400px] animate-slide-up">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
