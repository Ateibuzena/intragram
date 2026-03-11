// onClose es una función que viene de HomePage: () => setShowSettings(false)
// Al llamarla, cerramos el modal desde el hijo
export default function SettingsModal({ onClose }) {
  return (
    // fixed inset-0: cubre toda la pantalla
    // bg-black/80 backdrop-blur-sm: fondo oscuro semitransparente + blur
    // z-50: por encima de todo lo demás
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in-up">
      <div className="bg-ft-card border border-ft-border rounded-2xl p-6 w-full max-w-md shadow-2xl">

        {/* CABECERA del modal */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Configuración</h2>
            <p className="text-xs text-ft-muted mt-0.5">Gestiona tu perfil y preferencias</p>
          </div>
          {/* Botón de cerrar: llama a onClose que viene de HomePage */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-ft-muted hover:text-white hover:bg-ft-hover border border-transparent hover:border-ft-border transition-all duration-150 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SECCIÓN AVATAR */}
        <div className="flex items-center gap-4 p-4 bg-ft-hover rounded-xl border border-ft-border mb-5">
          <div className="w-12 h-12 rounded-2xl bg-ft-cyan flex items-center justify-center text-lg font-black text-black shadow-ft-glow-sm">
            T
          </div>
          <div>
            <p className="text-sm font-semibold text-white">petazz</p>
            <button className="text-xs text-ft-cyan hover:text-ft-cyan-light transition-colors mt-0.5">
              Cambiar avatar
            </button>
          </div>
        </div>

        {/* CAMPOS DEL FORMULARIO
            Usamos un array de objetos para no repetir código.
            Cada campo solo varía en label, type, placeholder y value */}
        <div className="space-y-3.5">
          {[
            { label: 'Nombre de usuario', type: 'text',     placeholder: 'tu_login_42',        value: 'petazz' },
            { label: 'Email',             type: 'email',    placeholder: 'tu@student.42.fr',   value: 'petazz@student.42.fr' },
            { label: 'Nueva contraseña',  type: 'password', placeholder: '••••••••',           value: '' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-ft-muted mb-1.5 uppercase tracking-wide">
                {field.label}
              </label>
              {/* focus:border-ft-cyan/50: el borde se vuelve cyan al hacer focus en el input */}
              <input
                type={field.type}
                placeholder={field.placeholder}
                defaultValue={field.value}
                className="w-full bg-ft-hover border border-ft-border focus:border-ft-cyan/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-ft-muted focus:outline-none transition-all duration-200"
              />
            </div>
          ))}
        </div>

        {/* BOTONES de acción */}
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-ft-hover hover:bg-ft-faint border border-ft-border text-ft-text text-sm font-semibold py-2.5 rounded-xl transition-all duration-150 active:scale-95"
          >
            Cancelar
          </button>
          <button className="flex-1 bg-ft-cyan hover:bg-ft-cyan-light text-black text-sm font-bold py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ft-glow active:scale-[0.99] btn-ripple">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
