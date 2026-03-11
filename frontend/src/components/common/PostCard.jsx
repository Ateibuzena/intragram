import { useState } from 'react';

// Cada usuario tendrá un gradiente diferente según la primera letra de su login.
// charCodeAt(0) devuelve el código ASCII de la letra → % 4 da 0, 1, 2 o 3
const GRADIENT_COLORS = [
  'from-ft-cyan to-teal-500',
  'from-purple-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-indigo-500',
];

// El componente recibe un "post" como prop (dato del post a mostrar)
export default function PostCard({ post }) {
  // Estado local del like y contador de likes
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  // animating controla si el corazón está en animación heartbeat
  const [animating, setAnimating] = useState(false);

  // Calculamos qué color de gradiente le toca a este usuario
  const colorIndex = post.user.login.charCodeAt(0) % GRADIENT_COLORS.length;

  const handleLike = () => {
    // Activamos la animación heartbeat
    setAnimating(true);
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    // Después de 400ms (duración de la animación) la desactivamos
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    // group: los botones internos usan opacity-0 group-hover:opacity-100
    // para aparecer solo cuando el usuario pasa el ratón por la card
    <article className="bg-ft-card border border-ft-border rounded-2xl p-5 mb-3 hover:border-ft-cyan/25 transition-all duration-200 group shadow-card">

      {/* CABECERA: avatar + nombre + nivel + tiempo */}
      <div className="flex items-center space-x-3 mb-3.5">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENT_COLORS[colorIndex]} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`}>
          {post.user.login[0].toUpperCase()} {/* Primera letra del login en mayúscula */}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-white hover:text-ft-cyan cursor-pointer transition-colors">
              {post.user.login}
            </p>
            {/* Badge de nivel */}
            <span className="text-[10px] bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/20 px-1.5 py-0.5 rounded-md font-semibold">
              Lvl {post.user.level}
            </span>
          </div>
          <p className="text-xs text-ft-muted">{post.time}</p>
        </div>
        {/* Botón de opciones: solo aparece al hacer hover en la card (opacity-0 group-hover:opacity-100) */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ft-muted opacity-0 group-hover:opacity-100 hover:text-white hover:bg-ft-hover transition-all duration-150">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
          </svg>
        </button>
      </div>

      {/* CONTENIDO del post */}
      <p className="text-sm text-ft-text leading-relaxed mb-4">{post.content}</p>

      {/* ACCIONES: like, comentarios, compartir */}
      <div className="flex items-center gap-1 pt-3 border-t border-ft-border">

        {/* BOTÓN LIKE */}
        <button
          onClick={handleLike}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            transition-all duration-200 active:scale-95
            ${liked
              ? 'bg-red-500/10 text-red-400 border border-red-500/20' // estado: likeado
              : 'text-ft-muted border border-transparent hover:bg-ft-hover hover:text-white' // sin like
            }
          `}
        >
          {/* El SVG del corazón: se rellena si liked=true, late si animating=true */}
          <svg
            className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''} ${animating ? 'animate-heartbeat' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likes}
        </button>

        {/* BOTÓN COMENTARIOS */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ft-muted border border-transparent hover:bg-ft-hover hover:text-white transition-all duration-150 active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments}
        </button>

        {/* BOTÓN COMPARTIR: ml-auto lo empuja al extremo derecho */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ft-muted border border-transparent hover:bg-ft-hover hover:text-ft-cyan transition-all duration-150 active:scale-95 ml-auto">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir
        </button>
      </div>
    </article>
  );
}
