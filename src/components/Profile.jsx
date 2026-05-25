import React, { useState } from 'react';
import { User, ShieldAlert } from 'lucide-react';
import { updateUserProfile, checkUsernameAvailability } from '../db/mockStore';

const COLOR_SHADES = [
  { value: '#ffffff', label: 'Branco Clínico' },
  { value: '#f7f6f2', label: 'Papel Velho' },
  { value: '#e8e6df', label: 'Cinza Asfalto' },
  { value: '#d3d0c5', label: 'Cimento Seco' },
  { value: '#b5b2a9', label: 'Pó Acumulado' },
];

export default function Profile({ currentUser, setCurrentUser }) {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [boredomLevel, setBoredomLevel] = useState(currentUser.boredomLevel || 5);
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#e8e6df');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('O nome de usuário (@) não pode ficar vazio.');
      return;
    }

    // Validação de formato do username (letras, números e sublinhados)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError('O nome de usuário (@) deve conter apenas letras, números e sublinhados (_). Sem espaços ou caracteres especiais.');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('O nome de usuário (@) deve ter pelo menos 3 caracteres.');
      return;
    }

    // Se o username mudou, verifica disponibilidade
    if (cleanUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
      const isAvailable = await checkUsernameAvailability(cleanUsername);
      if (!isAvailable) {
        setError('Este nome de usuário (@) incrivelmente genérico já está em uso.');
        return;
      }
    }

    const updated = await updateUserProfile(currentUser.username, {
      name,
      newUsername: cleanUsername,
      bio,
      boredomLevel: parseInt(boredomLevel),
      avatarColor
    });

    if (updated) {
      setCurrentUser(updated);
      setMessage('Alterações salvas com absoluto desinteresse.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError('Ocorreu um erro ao salvar o perfil no Supabase.');
    }
  };

  const getBoredomLabel = (level) => {
    if (level <= 2) return 'Hiperativo (Procure ajuda, você está ativo demais)';
    if (level <= 5) return 'Entediado Padrão (Sem novidades, aceitável)';
    if (level <= 8) return 'Quase Cochilando (Boa! Excelente ritmo de marasmo)';
    return 'Comatoso Existencial (Tédio supremo atingido. Perfeito)';
  };

  return (
    <div>
      <div className="feed-header">
        <h1 className="feed-title">Seu Perfil</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
          Personalize sua identidade digital sem nenhuma urgência ou propósito real.
        </p>
      </div>

      {error && (
        <div style={{ border: '2px solid var(--accent-color)', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', backgroundColor: 'var(--accent-muted)', color: 'var(--accent-color)' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {message && (
        <div style={{ border: '2px solid var(--border-color)', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', backgroundColor: 'var(--gray-light)' }}>
          {message}
        </div>
      )}

      <div className="profile-card" style={{ backgroundColor: avatarColor, transition: 'background-color 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="profile-avatar" style={{ margin: 0, backgroundColor: 'var(--panel-bg)', color: 'var(--text-primary)' }}>
            <User size={36} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-editorial)', fontSize: '1.8rem' }}>@{currentUser.username}</h2>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Membro desde sempre (tempo é uma ilusão entediante)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="post-composer" style={{ border: '2px solid var(--border-color)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">Nome de Usuário (@)</label>
          <input
            type="text"
            id="username"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="displayName">Nome de Exibição</label>
          <input
            type="text"
            id="displayName"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bio">Biografia</label>
          <textarea
            id="bio"
            className="form-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Fale um pouco sobre o nada absoluto que você faz..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Entedômetro */}
        <div className="boredom-slider-container">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Nível de Tédio (Entedômetro)</span>
            <span style={{ fontWeight: 'bold' }}>{boredomLevel}/10</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            className="boredom-slider"
            value={boredomLevel}
            onChange={(e) => setBoredomLevel(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            Status: {getBoredomLabel(boredomLevel)}
          </p>
        </div>

        {/* Escolha de cor monocromática */}
        <div className="form-group">
          <label className="form-label">Tonalidade Monocromática de Fundo</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {COLOR_SHADES.map((shade) => {
              const isSelected = avatarColor === shade.value;
              return (
                <button
                  type="button"
                  key={shade.value}
                  onClick={() => setAvatarColor(shade.value)}
                  style={{
                    backgroundColor: shade.value,
                    border: isSelected ? '3px solid var(--border-color)' : '1px solid var(--border-soft)',
                    color: '#000',
                    fontSize: '0.7rem',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '2px 2px 0px #000' : 'none'
                  }}
                >
                  {shade.label}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn-boring" style={{ marginTop: '1rem' }}>
          Salvar Perfil Sem Entusiasmo
        </button>
      </form>

      <div style={{ display: 'flex', gap: '1rem', border: '1px solid var(--border-soft)', padding: '1rem', backgroundColor: 'var(--gray-light)', fontSize: '0.8rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
        <ShieldAlert size={20} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
        <span>
          Aviso: Mudar suas configurações digitais não trará mais emoção ao seu dia a dia. Pense se realmente vale a pena clicar no botão acima.
        </span>
      </div>
    </div>
  );
}
