import React from 'react';
import { Bell, Trash2, CheckSquare } from 'lucide-react';
import { saveStorageData } from '../db/mockStore';

export default function Notifications({ notifications, setNotifications, currentUser }) {
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveStorageData('bn_notifications', updated, 'NOTIFICATIONS_UPDATE');
  };

  const handleClearAll = () => {
    // Mantém apenas notificações de outros usuários se houver, ou esvazia
    setNotifications([]);
    saveStorageData('bn_notifications', [], 'NOTIFICATIONS_UPDATE');
  };

  const handleMarkOneRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveStorageData('bn_notifications', updated, 'NOTIFICATIONS_UPDATE');
  };

  const formatNotificationTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  // Filtra notificações do usuário atual
  const myNotifications = notifications.filter(n => n.username === currentUser.username || !n.username);

  return (
    <div>
      <div className="feed-header">
        <h1 className="feed-title">Notificações Irrelevantes</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
          Alertas sem importância sobre eventos de baixíssimo impacto emocional.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className="btn-boring-secondary"
          onClick={handleMarkAllRead}
          disabled={myNotifications.every(n => n.read)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
        >
          <CheckSquare size={14} />
          <span>Marcar todas como lidas (tanto faz)</span>
        </button>

        <button
          className="btn-boring-secondary"
          onClick={handleClearAll}
          disabled={myNotifications.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
        >
          <Trash2 size={14} />
          <span>Limpar Histórico (se tiver disposição)</span>
        </button>
      </div>

      <div className="notifications-list">
        {myNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Nenhuma notificação por enquanto. Absolutamente ninguém se importa. E isso é ótimo.
          </div>
        ) : (
          myNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${!notif.read ? 'unread' : ''}`}
            >
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: !notif.read ? 'bold' : 'normal' }}>
                  {notif.content}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatNotificationTime(notif.createdAt)}
                </span>
              </div>

              {!notif.read && (
                <button
                  className="btn-link"
                  onClick={() => handleMarkOneRead(notif.id)}
                  style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  OK, Li
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
