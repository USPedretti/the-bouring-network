import React, { useState } from 'react';
import { loginUser, registerUser } from '../db/mockStore';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username || !password) {
      setError('Por favor, preencha as credenciais. Já é chato o suficiente sem campos vazios.');
      return;
    }

    const res = loginUser(username, password);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username || !password || !name) {
      setError('Todos os campos obrigatórios precisam ser preenchidos. Sem atalhos por aqui.');
      return;
    }

    const res = registerUser(username, password, name, bio);
    if (res.success) {
      setMessage('Registro efetuado com sucesso. Agora faça login se tiver disposição.');
      setIsRegistering(false);
      // Limpa formulário
      setBio('');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="brand-logo-editorial">The Bouring Network</h1>
        <p className="brand-tagline">A rede social mais monótona e insignificante que você irá visitar hoje.</p>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-typewriter)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isRegistering ? 'Criar Conta Entediante' : 'Identifique-se sem Entusiasmo'}
        </h2>

        {error && (
          <div style={{ border: '2px solid var(--accent-color)', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', backgroundColor: 'var(--accent-muted)', color: 'var(--accent-color)' }}>
            <strong>Alerta:</strong> {error}
          </div>
        )}

        {message && (
          <div style={{ border: '2px solid var(--border-color)', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', backgroundColor: 'var(--gray-light)' }}>
            {message}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Nome de Usuário *</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: pedro_desanimado"
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nome de Exibição *</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Pedro Silva"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">Senha *</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="bio">Biografia Curta e Monótona</label>
              <textarea
                id="bio"
                className="form-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="ex: Gosto de observar a chuva. Só isso."
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>
          )}

          <button type="submit" className="btn-boring" style={{ marginTop: '1rem' }}>
            {isRegistering ? 'Confirmar Registro Chato' : 'Entrar no Marasmo'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
          {isRegistering ? (
            <span>
              Já tem uma conta sem graça?{' '}
              <button className="btn-link" onClick={() => { setIsRegistering(false); setError(''); }}>
                Faça login aqui
              </button>
            </span>
          ) : (
            <span>
              Não tem uma conta entediante?{' '}
              <button className="btn-link" onClick={() => { setIsRegistering(true); setError(''); }}>
                Crie uma agora mesmo
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
