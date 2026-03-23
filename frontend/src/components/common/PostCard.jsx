import { useState } from 'react';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);

  const handleLike = () => {
    setAnimatingLike(true);
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    setTimeout(() => setAnimatingLike(false), 400);
  };

  const handleSave = () => {
    setAnimatingSave(true);
    setSaved(!saved);
    setTimeout(() => setAnimatingSave(false), 400);
  };

  return (
    <article className="bg-ft-card border border-ft-border rounded-2xl p-5 mb-3 hover:border-ft-cyan/20 transition-all duration-200">
      {/* Header del post */}
      <div className="flex items-center space-x-3 mb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black uppercase flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${getGradient(post.user.login)})` }}
        >
          {post.user.login[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {post.user.login}
            <span className="ml-2 text-xs bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/20 px-1.5 py-0.5 rounded-md">
              Lvl {post.user.level}
            </span>
          </p>
          <p className="text-xs text-ft-muted">{post.time}</p>
        </div>
        {/* Botón opciones */}
        <button className="text-ft-muted hover:text-white transition-colors p-1 flex-shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Contenido */}
      <p className="text-sm text-ft-text leading-relaxed mb-4">{post.content}</p>

      {/* Footer con botones */}
      <div className="flex items-center gap-3 pt-3 border-t border-ft-border">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`
            flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-150 active:scale-95
            ${liked
              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
              : 'text-ft-muted hover:text-red-400 hover:bg-red-500/5 border border-transparent'
            }
          `}
        >
          <svg
            className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''} ${animatingLike ? 'animate-heartbeat' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likes}</span>
        </button>

        {/* Comentarios */}
        <button className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ft-muted hover:text-ft-cyan hover:bg-ft-cyan/5 border border-transparent hover:border-ft-cyan/20 transition-all duration-150 active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments}</span>
        </button>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className={`
            ml-auto flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-150 active:scale-95
            ${saved
              ? 'bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30'
              : 'text-ft-muted hover:text-ft-cyan hover:bg-ft-cyan/5 border border-transparent'
            }
          `}
        >
          <svg
            className={`w-3.5 h-3.5 ${saved ? 'fill-ft-cyan' : ''} ${animatingSave ? 'animate-heartbeat' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
        </button>

        {/* Compartir */}
        <button className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ft-muted hover:text-white hover:bg-ft-hover border border-transparent hover:border-ft-border transition-all duration-150 active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>
    </article>
  );
}

function getGradient(login) {
  const colors = [
    '#00BABC, #0891B2',
    '#F472B6, #EC4899',
    '#FB923C, #F97316',
    '#A78BFA, #8B5CF6',
    '#34D399, #10B981',
    '#FBBF24, #F59E0B',
  ];
  const hash = login.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
