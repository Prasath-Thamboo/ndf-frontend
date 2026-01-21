import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Nouveau: choix du type de compte
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

      // ✅ pas de nav ici: AuthContext gère déjà nav("/") après login auto
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Inscription
        </h1>

        {error && <p className="mb-4 text-red-600 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ✅ Type de compte */}
          <div>
            <label className="block mb-1 text-gray-700">Type de compte</label>
            <select
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              disabled={loading}
            >
              <option value="solo">Solo (auto-validation)</option>
              <option value="company">Entreprise (validation manager)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo : vos notes sont validées automatiquement. Entreprise : un manager valide les notes.
            </p>
          </div>

          {/* ✅ Mode entreprise */}
          {accountType === "company" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyMode("create")}
                  disabled={loading}
                  className={`px-3 py-2 rounded border w-1/2 ${
                    companyMode === "create"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700"
                  }`}
                >
                  Je suis manager
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyMode("join")}
                  disabled={loading}
                  className={`px-3 py-2 rounded border w-1/2 ${
                    companyMode === "join"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700"
                  }`}
                >
                  Je suis employé
                </button>
              </div>

              {companyMode === "create" ? (
                <div>
                  <label className="block mb-1 text-gray-700">Nom de l'entreprise</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ACME SARL"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Un code d’invitation sera généré pour ajouter des employés.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block mb-1 text-gray-700">Code d'invitation</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 uppercase"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ex: X7K4Q2"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block mb-1 text-gray-700">Nom complet</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Déjà un compte ?
          <Link to="/login" className="text-blue-600 hover:underline ml-1">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
