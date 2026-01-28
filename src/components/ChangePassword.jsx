// src/components/ChangePassword.jsx
import { useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setSuccess(res.data.message || "Mot de passe modifié");

      // 🔐 sécurité : logout forcé
      setTimeout(() => logout(), 1200);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors du changement de mot de passe"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Changer le mot de passe</h2>

      {error && <p className="mb-3 text-red-600">{error}</p>}
      {success && <p className="mb-3 text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Mot de passe actuel"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border rounded px-3 py-2"
        />

        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Modification..." : "Mettre à jour"}
        </button>
      </form>

      <p className="mt-3 text-xs text-gray-500">
        Vous serez automatiquement déconnecté après le changement.
      </p>
    </div>
  );
}
