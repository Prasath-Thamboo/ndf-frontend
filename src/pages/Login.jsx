import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      window.location.href = '/';
    } catch {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Connexion</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <label className="block mb-2">
          <span>Email</span>
          <input className="mt-1 w-full border p-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block mb-4">
          <span>Mot de passe</span>
          <input type="password" className="mt-1 w-full border p-2 rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Se connecter</button>
      </form>
    </div>
  );
}