import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ name, email, password });
      alert('Compte créé, vous pouvez vous connecter');
      window.location.href = '/login';
    } catch (err) {
      // Gestion des erreurs renvoyées par le backend
      if (err.response?.data?.errors) {
        // express-validator renvoie un tableau d'erreurs
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l’inscription');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Inscription</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {error}
          </div>
        )}

        <input
          className="border p-2 w-full mb-2"
          placeholder="Nom"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="border p-2 w-full mb-4"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Créer un compte
        </button>
      </form>
    </div>
  );
}