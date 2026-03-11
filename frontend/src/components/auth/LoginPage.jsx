export default function LoginPage() {
  // Al pulsar el botón, redirigimos al usuario al backend.
  // El backend luego lo redirige a la intra de 42 para que se loguee.
  // Cuando la intra acepta, vuelve al backend que nos manda a /?token=...
  const handleLogin42 = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/42/login`;
    // import.meta.env.VITE_API_URL lee la variable de tu archivo .env
  };

  return (
    // min-h-screen = alto mínimo de toda la pantalla
    // flex items-center justify-center = centra el contenido vertical y horizontal
    <div className="min-h-screen bg-ft-bg flex items-center justify-center px-4 overflow-hidden">

      {/* Círculo difuminado de fondo para dar profundidad */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ft-cyan/5 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor principal, max-w-sm = ancho máximo de 384px */}
      <div className="relative w-full max-w-sm animate-fade-in-up">

        {/* LOGO + TÍTULO */}
        <div className="text-center mb-10">
          {/* El cuadrado con "42" */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ft-card border border-ft-border shadow-ft-glow mb-5 relative">
            <span className="text-2xl font-black text-ft-cyan">42</span>
            <div className="absolute inset-0 rounded-2xl bg-ft-cyan/5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Intra<span className="text-ft-cyan">gram</span>
          </h1>
          <p className="text-ft-muted text-sm mt-2">
            La red social de los estudiantes de 42
          </p>
        </div>

        {/* CARD del login */}
        <div className="bg-ft-card border border-ft-border rounded-2xl p-8 shadow-card">
          <h2 className="text-lg font-bold text-white mb-1">Bienvenido de vuelta</h2>
          <p className="text-ft-muted text-sm mb-8">
            Accede con tu cuenta de la Intra para continuar
          </p>

          {/* BOTÓN PRINCIPAL con múltiples efectos:
              - group: permite que los hijos reaccionen al hover del padre (group-hover:)
              - hover:-translate-y-0.5: sube 2px al hacer hover (efecto "flota")
              - hover:shadow-ft-glow: aparece el glow de 42 al hacer hover
              - active:scale-[0.99]: se encoge ligeramente al hacer click
              - btn-ripple: efecto ripple de nuestro CSS custom */}
          <button
            onClick={handleLogin42}
            className="w-full group relative flex items-center justify-center space-x-3 bg-ft-cyan hover:bg-ft-cyan-light text-black font-bold py-3.5 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ft-glow active:translate-y-0 active:scale-[0.99] overflow-hidden btn-ripple"
          >
            <span className="text-xl font-black">42</span>
            <span className="text-base">Continuar con la Intra</span>
            {/* La flecha se mueve a la derecha al hacer hover gracias a group-hover: */}
            <svg
              className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Separador decorativo */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-ft-faint" />
            <span className="text-ft-faint text-xs px-3">ft_transcendence</span>
            <div className="flex-1 h-px bg-ft-faint" />
          </div>

          <p className="text-center text-xs text-ft-muted">
            Al acceder aceptas los{' '}
            <a href="/terms" className="text-ft-cyan hover:underline">Términos de uso</a>
            {' '}y la{' '}
            <a href="/privacy" className="text-ft-cyan hover:underline">Política de privacidad</a>
          </p>
        </div>

        <p className="text-center text-xs text-ft-faint mt-6">
          ft_transcendence · 42 Common Core
        </p>
      </div>
    </div>
  );
}
