import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <h1 className="text-white font-bold text-lg">Note de Frais</h1>

      {user ? (
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Bonjour, {user.name}</span>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Déconnexion
          </button>
        </div>
      ) : (
        <div className="space-x-4">
          <a href="/login" className="text-gray-300 hover:text-white">Connexion</a>
          <a href="/register" className="text-gray-300 hover:text-white">Inscription</a>
        </div>
      )}
    </nav>
  );
}