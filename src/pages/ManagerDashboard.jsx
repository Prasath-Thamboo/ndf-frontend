import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ManagerDashboard() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    api.get('/expenses/pending').then(res => setExpenses(res.data));
  }, []);

  const decide = async (id, action, comment) => {
    await api.post(`/expenses/${id}/decision`, { action, comment });
    setExpenses(expenses.filter(e => e._id !== id)); // retirer de la liste
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notes de frais en attente</h1>
      {expenses.length === 0 ? (
        <p>Aucune note en attente</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Employé</th>
              <th className="p-2">Titre</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Date</th>
              <th className="p-2">Justificatif</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e._id} className="border-t">
                <td className="p-2">{e.user?.name} ({e.user?.email})</td>
                <td className="p-2">{e.title}</td>
                <td className="p-2">{e.amount} {e.currency}</td>
                <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
                <td className="p-2">
                  {e.receiptUrl && (
                    <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Voir
                    </a>
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => decide(e._id, 'approve', 'Validé')}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    ✅ Approuver
                  </button>
                  <button
                    onClick={() => decide(e._id, 'reject', 'Non conforme')}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    ❌ Rejeter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}