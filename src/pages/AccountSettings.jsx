// src/pages/AccountSettings.jsx
import { useMemo, useState } from "react";
import { KeyRound, LogOut, Save, UserRound } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Alert, Avatar, PageHeader, Spinner } from "../components/ui";

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="card grid gap-6 p-5 sm:p-6 lg:grid-cols-3 lg:gap-10">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="size-[18px] text-slate-400" />
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

export default function AccountSettings() {
  const { user, logout, refreshMe } = useAuth();
  const toast = useToast();

  // =========================
  // PROFIL (nom uniquement)
  // =========================
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const canSaveName = useMemo(
    () => name.trim().length >= 2 && name.trim() !== (user?.name || ""),
    [name, user]
  );

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await API.patch("/auth/me", { name: name.trim() });
      await refreshMe(); // met à jour le nom affiché dans la barre latérale
      toast.success("Profil mis à jour.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================
  // MOT DE PASSE
  // =========================
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoadingPassword(true);

      const res = await API.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(
        (res.data?.message || "Mot de passe modifié.") + " Vous allez être déconnecté."
      );

      // sécurité : logout forcé après succès
      setTimeout(() => logout(), 1200);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Erreur lors du changement de mot de passe."
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  const accountLabel =
    user?.accountType === "solo"
      ? "Compte solo"
      : user?.role === "manager" || user?.role === "admin"
        ? "Manager"
        : "Employé";

  return (
    <div className="space-y-8">
      <PageHeader title="Paramètres" description="Gérez votre profil et la sécurité de votre compte." />

      {/* Carte identité */}
      <div className="card flex items-center gap-4 p-5 sm:p-6">
        <Avatar name={user?.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900">{user?.name}</p>
          <p className="truncate text-sm text-slate-500">{user?.email}</p>
        </div>
        <span className="badge ml-auto bg-brand-50 text-brand-700 ring-brand-600/20">{accountLabel}</span>
      </div>

      <Section icon={UserRound} title="Profil" description="Votre nom apparaît sur vos notes de frais.">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Nom complet
              </label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">
                Adresse email
              </label>
              <input id="email" value={user?.email || ""} disabled className="input" />
              <p className="hint">L’adresse email ne peut pas être modifiée.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={!canSaveName || savingProfile} className="btn btn-primary">
              {savingProfile ? <Spinner className="size-4" /> : <Save className="size-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Section>

      <Section
        icon={KeyRound}
        title="Mot de passe"
        description="Après le changement, vous serez automatiquement déconnecté."
      >
        <form onSubmit={handleChangePassword} className="space-y-5">
          {passwordError && <Alert>{passwordError}</Alert>}
          {passwordSuccess && <Alert tone="success">{passwordSuccess}</Alert>}

          <div>
            <label htmlFor="current-password" className="label">
              Mot de passe actuel
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className="label">
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="input"
              />
              <p className="hint">8 caractères minimum.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">
                Confirmation
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loadingPassword} className="btn btn-primary">
              {loadingPassword ? <Spinner className="size-4" /> : <KeyRound className="size-4" />}
              Changer le mot de passe
            </button>
          </div>
        </form>
      </Section>

      <Section icon={LogOut} title="Session" description="Déconnectez-vous de cet appareil.">
        <div className="flex justify-end">
          <button type="button" onClick={logout} className="btn btn-secondary text-rose-600 hover:text-rose-700">
            <LogOut className="size-4" />
            Se déconnecter
          </button>
        </div>
      </Section>
    </div>
  );
}
