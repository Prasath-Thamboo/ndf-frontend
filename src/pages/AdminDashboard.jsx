import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [users,setUsers] = useState([]);

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data));
  }, []);

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}/role`, { role });
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const toggleStatus = async (id, isActive) => {
    await api.patch(`/users/${id}/status`, { isActive });
    setUsers(users.map(u => u.id === id ? { ...u, isActive } : u));
  };

  const deleteUser = async (id) => {
    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Nom</th>
            <th className="p-2">Email</th>
            <th className="p-2">Rôle</th>
            <th className="p-2">Statut</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)} className="border p-1">
                  <option>user</option>
                  <option>manager</option>
                  <option>admin</option>
                </select>
              </td>
              <td className="p-2">
                <button onClick={()=>toggleStatus(u.id,!u.isActive)} className={`px-2 py-1 rounded ${u.isActive?'bg-green-500':'bg-red-500'} text-white`}>
                  {u.isActive ? 'Actif' : 'Inactif'}
                </button>
              </td>
              <td className="p-2">
                <button onClick={()=>deleteUser(u.id)} className="bg-gray-700 text-white px-2 py-1 rounded">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}