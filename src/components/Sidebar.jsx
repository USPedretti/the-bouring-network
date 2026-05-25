import React from 'react';
import { Newspaper, MessageSquare, Bell, User, LogOut, Sun, Moon } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, notifications = [], theme, toggleTheme }) {
  // Conta notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-logo">
          The Bouring<br />Network
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-link ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Newspaper size={18} />
            <span>Feed Monótono</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={18} />
            <span>Chat Inútil</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '50%',
                right: '1rem',
                transform: 'translateY(-50%)',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Seu Perfil</span>
          </button>
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Toggle de Tema Sarcástico */}
        <button 
          className="btn-boring-secondary" 
          onClick={toggleTheme}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'light' ? 'Escurecer o Marasmo' : 'Clarear o Tédio'}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-username">@{currentUser.username}</div>
          <div className="sidebar-user-boredom">
            <span>Tédio:</span>
            <span style={{ fontWeight: 'bold' }}>{currentUser.boredomLevel || 5}/10</span>
          </div>
          <button 
            onClick={onLogout} 
            className="btn-link" 
            style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)' }}
          >
            <LogOut size={12} />
            <span>Desconectar-se</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
