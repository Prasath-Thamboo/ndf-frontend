import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Building2, KeyRound, User, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { Alert, Spinner } from "../components/ui";

function ChoiceCard({ active, onClick, icon: Icon, title, text, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
          active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="size-[18px]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{text}</p>
      </div>
    </button>
  );
}

export default function Register() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accountType, setAccountType] = useState("solo"); // solo | company
  const [companyMode, setCompanyMode] = useState("create"); // create | join
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (accountType === "company") {
      if (companyMode === "create" && !companyName.trim()) {
        setError("Veuillez renseigner le nom de l'entreprise.");
        return;
      }
      if (companyMode === "join" && !inviteCode.trim()) {
        setError("Veuillez renseigner le code d'invitation.");
        return;
      }
    }

    try {
      setLoading(true);

      await register({
        name,
        email,
        password,
        accountType,
        companyName: accountType === "company" && companyMode === "create" ? companyName : undefined,
        inviteCode: accountType === "company" && companyMode === "join" ? inviteCode : undefined,
      });

      // pas de nav ici: AuthContext gère déjà nav("/") après login auto
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Quelques secondes suffisent pour commencer."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Se connecter
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5">
          <Alert>{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type de compte */}
        <div>
          <p className="label">Type de compte</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ChoiceCard
              active={accountType === "solo"}
              onClick={() => setAccountType("solo")}
              disabled={loading}
              icon={User}
              title="Solo"
              text="Vos notes sont validées automatiquement."
            />
            <ChoiceCard
              active={accountType === "company"}
              onClick={() => setAccountType("company")}
              disabled={loading}
              icon={Building2}
              title="Entreprise"
              text="Un manager valide les notes."
            />
          </div>
        </div>

        {/* Mode entreprise */}
        {accountType === "company" && (
          <div className="animate-fade-in space-y-4 rounded-2xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1">
              {[
                { value: "create", label: "Je suis manager", icon: Briefcase },
                { value: "join", label: "Je suis employé", icon: UserRound },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompanyMode(value)}
                  disabled={loading}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                    companyMode === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            {companyMode === "create" ? (
              <div>
                <label htmlFor="companyName" className="label">
                  Nom de l'entreprise
                </label>
                <input
                  id="companyName"
                  type="text"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ACME SARL"
                  disabled={loading}
                />
                <p className="hint">Un code d’invitation sera généré pour ajouter vos employés.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="inviteCode" className="label">
                  Code d'invitation
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="inviteCode"
                    type="text"
                    className="input pl-10 font-mono uppercase tracking-widest"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="X7K4Q2"
                    disabled={loading}
                  />
                </div>
                <p className="hint">Demandez ce code à votre manager.</p>
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="name" className="label">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 caractères minimum"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? (
            <>
              <Spinner className="size-4" />
              Création...
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
