import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Le nom est requis';
    if (!email.trim()) {
      newErrors.email = 'L’email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format d’email invalide';
    }
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ name, email, password });
      alert('Compte créé, vous pouvez vous connecter');
      window.location.href = '/login';
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        const formatted = {};
        backendErrors.forEach(e => {
          formatted[e.param] = e.msg;
        });
        setErrors(formatted);
      } else {
        setErrors({ general: err.response?.data?.message || 'Erreur lors de l’inscription' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Inscription</h1>

        {errors.general && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {errors.general}
          </div>
        )}

        <input
          className="border p-2 w-full mb-1"
          placeholder="Nom"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {errors.name && <p className="text-red-600 text-sm mb-2">{errors.name}</p>}

        <input
          className="border p-2 w-full mb-1"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-600 text-sm mb-2">{errors.email}</p>}

        <input
          type="password"
          className="border p-2 w-full mb-1"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-red-600 text-sm mb-4">{errors.password}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded w-full text-white ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
              </svg>
              Création...
            </span>
          ) : (
            'Créer un compte'
          )}
        </button>
      </form>
    </div>
  );
}