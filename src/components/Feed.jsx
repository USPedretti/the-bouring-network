import React, { useState } from 'react';
import { Heart, MessageSquare, Image, Loader } from 'lucide-react';
import { createPost, toggleLike, addComment, fetchPosts } from '../db/mockStore';

// Imagens intencionalmente monótonas
const BORING_IMAGES = [
  'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80', // Parede cinza
  'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80', // Asfalto cinza
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80', // Cimento molhado
  'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80', // Estrada vazia nublada
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80', // Escritório cinza vazio
];

export default function Feed({ posts, setPosts, currentUser }) {
  const [postContent, setPostContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [isBoringImageLoading, setIsBoringImageLoading] = useState(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !imageUrl) return;

    await createPost(currentUser.username, postContent, imageUrl);
    
    // Atualiza estado local recarregando do Supabase
    const updatedPosts = await fetchPosts();
    setPosts(updatedPosts);

    // Reseta inputs
    setPostContent('');
    setImageUrl('');
  };

  const handleGenerateBoringImage = () => {
    setIsBoringImageLoading(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * BORING_IMAGES.length);
      setImageUrl(BORING_IMAGES[randomIndex]);
      setIsBoringImageLoading(false);
    }, 600);
  };

  const handleLike = async (postId) => {
    await toggleLike(postId, currentUser.username);
    const updatedPosts = await fetchPosts();
    setPosts(updatedPosts);
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    await addComment(postId, currentUser.username, commentText);

    // Atualiza posts
    const updatedPosts = await fetchPosts();
    setPosts(updatedPosts);

    // Limpa input
    setCommentInputs({
      ...commentInputs,
      [postId]: ''
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div className="feed-header">
        <h1 className="feed-title">Feed Monótono</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
          Onde pessoas comuns compartilham a total ausência de emoção em suas vidas diárias.
        </p>
      </div>

      {/* Caixa de Criação de Post */}
      <form onSubmit={handleCreatePost} className="post-composer">
        <textarea
          className="post-composer-textarea"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="Escreva algo entediante que aconteceu hoje... ou simplesmente descreva uma parede cinza."
        />

        {imageUrl && (
          <div className="image-upload-preview">
            <img src={imageUrl} alt="Preview do Tédio" />
            <button
              type="button"
              className="btn-link"
              onClick={() => setImageUrl('')}
              style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--accent-color)', fontWeight: 'bold' }}
            >
              Remover
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-boring-secondary"
            onClick={handleGenerateBoringImage}
            disabled={isBoringImageLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isBoringImageLoading ? <Loader size={14} className="animate-spin" /> : <Image size={14} />}
            <span>Anexar Imagem Sem Graça</span>
          </button>

          <button
            type="submit"
            className="btn-boring"
            style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            disabled={!postContent.trim() && !imageUrl}
          >
            Postar Algo Irrelevante
          </button>
        </div>
      </form>

      {/* Lista de Posts */}
      <div className="posts-list">
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Nenhum post publicado. Excelente, nada de poluição visual.
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likes.includes(currentUser.username);
            const isCommentsOpen = activeCommentPostId === post.id;

            return (
              <article key={post.id} className="post-card">
                <header className="post-header">
                  <div className="post-meta">
                    <span className="post-author">@{post.username}</span>
                    <span className="post-time">• {formatTime(post.createdAt)}</span>
                  </div>
                </header>

                <div className="post-body">
                  <p>{post.content}</p>
                </div>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Imagem Sem Graça" className="post-image" />
                )}

                {/* Métricas Ocultas: Apenas o coração e o texto da curtida sem números */}
                <div className="post-actions">
                  <button
                    className={`post-action-btn ${hasLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart size={16} fill={hasLiked ? 'var(--accent-color)' : 'none'} />
                    <span>{hasLiked ? '[Você achou isso Ok]' : 'Achei Ok'}</span>
                  </button>

                  <button
                    className="post-action-btn"
                    onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                  >
                    <MessageSquare size={16} />
                    <span>Comentários ({post.comments.length})</span>
                  </button>
                </div>

                {/* Aba de Comentários */}
                {isCommentsOpen && (
                  <div className="comments-section">
                    {post.comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                              <span className="comment-author">@{comment.username}</span>
                              <span className="comment-time">{formatTime(comment.createdAt)}</span>
                            </div>
                            <div className="comment-body">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="comment-composer">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Escreva um comentário desinteressado..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({
                          ...commentInputs,
                          [post.id]: e.target.value
                        })}
                      />
                      <button type="submit" className="btn-boring-secondary" style={{ padding: '0.4rem 1rem' }}>
                        Enviar
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}

        {/* Fim de Feed Sarcástico */}
        <div className="end-of-feed">
          <h2 className="end-of-feed-title">Você chegou ao fim do feed.</h2>
          <p className="end-of-feed-text">
            Nada de novo sob o sol. Pare de rolar a tela, desligue o monitor e vá ler um livro ou olhar para o teto.
          </p>
        </div>
      </div>
    </div>
  );
}
