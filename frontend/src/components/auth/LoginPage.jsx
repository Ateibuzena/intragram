import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-primary">
      <div className="bg-dark-secondary border border-white border-opacity-10 p-8 rounded-2xl shadow-dark-lg w-full max-w-md">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-dark-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Intragram
          </h1>
          <p className="text-textLight-secondary">Red social para 42 Málaga</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {/* Botón de login */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <span>Cargando...</span>
          ) : (
            <>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span>Iniciar sesión con 42</span>
            </>
          )}
        </button>

        {/* Info adicional */}
        <p className="mt-6 text-center text-sm text-textLight-tertiary">
          Al iniciar sesión, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}
