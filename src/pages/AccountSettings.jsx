// src/pages/AccountSettings.jsx
import { useMemo, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Exemple minimal: changement de nom (pas de supposition de feature côté backend)
  const [name, setName] = useState(user?.name || "");
  const canSaveName = useMemo(() => name.trim().length >= 2, [name]);

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      // ⚠️ nécessite un endpoint backend (voir section 3)
      await API.patch("/auth/me", { name: name.trim() });

      setSuccess("Paramètres enregistrés.");
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold">Paramètres du compte</h1>
        <p className="text-gray-600 mt-1">Gérer les informations de votre profil.</p>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {success && <p className="mt-4 text-green-600">{success}</p>}
      </div>

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
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!canSaveName}
          >
            Enregistrer
          </button>
        </div>
      </div>

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
