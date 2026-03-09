import { useState } from 'react';
import Post from './Post';

export default function Feed() {
  const [posts] = useState([
    {
      id: 1,
      author: {
        login: 'petaz',
        displayName: 'Pedro Taz',
        avatar: 'https://ui-avatars.com/api/?name=PT&background=00BCD4&color=fff',
      },
      content: '¡Bienvenidos a Intragram! La red social de 42 Málaga 🚀',
      imageUrl: null,
      likes: 15,
      comments: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      author: {
        login: 'mariano',
        displayName: 'Mariano',
        avatar: 'https://ui-avatars.com/api/?name=M&background=00BCD4&color=fff',
      },
      content: 'Trabajando en el proyecto Transcendence. ¡Qué emoción! 💻',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      likes: 23,
      comments: 7,
      createdAt: '4/3/2026',
    },
  ]);

  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    console.log('Crear post:', newPostContent);
    alert('Post creado (mock)');
    setNewPostContent('');
  };

  return (
    <div className="space-y-4">
      {/* Formulario crear post - OSCURO */}
      <div className="bg-dark-secondary rounded-xl border border-white border-opacity-10 p-4">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="¿Qué está pasando?"
            className="w-full bg-transparent text-white placeholder-textLight-tertiary p-3 border-0 resize-none focus:outline-none"
            rows="3"
          />
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white border-opacity-10">
            <button
              type="button"
              className="text-textLight-secondary hover:text-primary transition"
              title="Añadir imagen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de posts */}
      <div className="space-y-4">
        {posts.map(post => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
