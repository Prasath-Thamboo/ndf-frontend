import { useState } from 'react';
import api from '../api/axios';

export default function CreateExpense() {
  const [title,setTitle] = useState('');
  const [amount,setAmount] = useState('');
  const [date,setDate] = useState('');
  const [category,setCategory] = useState('Other');
  const [file,setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('amount', amount);
    formData.append('date', date);
    formData.append('category', category);
    if(file) formData.append('receipt', file);

    await api.post('/expenses', formData, { headers: { 'Content-Type':'multipart/form-data' } });
    alert('Note créée');
  };

  return (
    <form onSubmit={submit} className="p-6 bg-white rounded shadow max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Nouvelle note de frais</h1>
      <input className="border p-2 w-full mb-2" placeholder="Titre" value={title} onChange={e=>setTitle(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="number" placeholder="Montant" value={amount} onChange={e=>setAmount(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      <select className="border p-2 w-full mb-2" value={category} onChange={e=>setCategory(e.target.value)}>
        <option>Travel</option><option>Meals</option><option>Office</option><option>Other</option>
      </select>
      <input className="border p-2 w-full mb-2" type="file" onChange={e=>setFile(e.target.files[0])} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Créer</button>
    </form>
  );
}