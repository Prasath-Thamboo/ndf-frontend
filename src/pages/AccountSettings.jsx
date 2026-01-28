// src/pages/AccountSettings.jsx
import { useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // PROFIL (nom uniquement)
  // =========================
  const [name, setName] = useState(user?.name || "");
  const canSaveName = useMemo(() => name.trim().length >= 2, [name]);

  const handleSaveProfile = async () => {
    try {
      setError("");
      setSuccess("");

      await API.patch("/auth/me", { name: name.trim() });

      setSuccess("Profil mis à jour.");
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de la sauvegarde.");
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

      setPasswordSuccess(res.data?.message || "Mot de passe modifié.");

      // 🔐 sécurité : logout forcé après succès
      setTimeout(() => logout(), 1200);
    } catch (e) {
      setPasswordError(
        e.response?.data?.message ||
          "Erreur lors du changement de mot de passe."
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================= HEADER ========================= */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold">Paramètres du compte</h1>
        <p className="text-gray-600 mt-1">
          Gérer les informations de votre profil et votre sécurité.
        </p>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {success && <p className="mt-4 text-green-600">{success}</p>}
      </div>

      {/* ========================= PROFIL ========================= */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profil</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              value={user?.email || ""}
              disabled
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!canSaveName}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* ========================= MOT DE PASSE ========================= */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Sécurité</h2>

        {passwordError && <p className="text-red-600">{passwordError}</p>}
        {passwordSuccess && <p className="text-green-600">{passwordSuccess}</p>}

        <form onSubmit={handleChangePassword} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loadingPassword}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loadingPassword ? "Modification..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500">
          Après le changement, vous serez automatiquement déconnecté.
        </p>
      </div>

      {/* ========================= SESSION ========================= */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold">Session</h2>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
