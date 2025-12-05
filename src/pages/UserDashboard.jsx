import React, { useEffect, useState } from "react";
import API from "../api";

export default function UserDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: "transport",
    description: "",
  });
  const [error, setError] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/expenses");
      setExpenses(res.data);
    } catch (e) {
      console.error(e);
      setError("Erreur lors du chargement des notes de frais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.amount || !form.date) {
      setError("Titre, montant et date sont obligatoires.");
      return;
    }

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      const res = await API.post("/expenses", payload);
      setExpenses((prev) => [res.data, ...prev]);

      setForm({
        title: "",
        amount: "",
        date: "",
        category: "transport",
        description: "",
      });
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Erreur lors de la création.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette note de frais ?")) return;

    try {
      await API.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message ||
          "Erreur lors de la suppression de la note de frais."
      );
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Nouvelle note de frais
        </h2>

        {error && (
          <p className="mb-4 text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Ex : Déplacement client Paris"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Montant (€)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Catégorie</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="transport">Transport</option>
              <option value="repas">Repas</option>
              <option value="hébergement">Hébergement</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Détails complémentaires du déplacement, repas, etc."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Ajouter
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Mes notes de frais
        </h2>

        {loading ? (
          <p>Chargement...</p>
        ) : expenses.length === 0 ? (
          <p>Aucune note de frais pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Titre</th>
                  <th className="py-2">Montant</th>
                  <th className="py-2">Catégorie</th>
                  <th className="py-2">Statut</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{exp.title}</td>
                    <td className="py-2">{exp.amount.toFixed(2)} €</td>
                    <td className="py-2 capitalize">{exp.category}</td>
                    <td className="py-2 capitalize">
                      {exp.status === "pending" && (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                      {exp.status === "approved" && (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          Validée
                        </span>
                      )}
                      {exp.status === "rejected" && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          Refusée
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {exp.status === "pending" && (
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
