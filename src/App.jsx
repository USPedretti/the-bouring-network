import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import { getStorageData, subscribeToSync, triggerLocalSync, saveStorageData } from './db/mockStore';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('bn_current_user')) || null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bn_theme') || 'light';
    }
    return 'light';
  });

  // Carrega dados iniciais
  useEffect(() => {
    const data = getStorageData();
    setPosts(data.posts);
    setChats(data.chats);
    setNotifications(data.notifications);
  }, []);

  // Sincroniza Tema com o elemento HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bn_theme', theme);
  }, [theme]);

  // Sincronização em tempo real entre abas usando a BroadcastChannel API
  useEffect(() => {
    const handleSync = (payload) => {
      const data = getStorageData();
      
      // Atualiza o estado adequado conforme a chave modificada
      if (payload.key === 'bn_posts') setPosts(data.posts);
      if (payload.key === 'bn_chats') setChats(data.chats);
      if (payload.key === 'bn_notifications') setNotifications(data.notifications);
      if (payload.key === 'bn_users' && currentUser) {
        const freshUser = data.users.find(u => u.username === currentUser.username);
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem('bn_current_user', JSON.stringify(freshUser));
        }
      }
    };

    const unsubscribe = subscribeToSync(handleSync);
    return () => unsubscribe();
  }, [currentUser]);

  // Captura eventos de Toast para alertas irritantes/sarcásticos em tempo real
  useEffect(() => {
    const handleNewToast = (e) => {
      const newNotif = e.detail;
      
      // Apenas mostra toast se for para o usuário logado e não for sobre chat (chat já tem sua própria interface de feedback)
      if (currentUser && newNotif.username === currentUser.username && newNotif.type !== 'chat') {
        const toastId = `toast-${Date.now()}`;
        const newToast = {
          id: toastId,
          content: newNotif.content,
          type: newNotif.type
        };

        setToasts((prev) => [...prev, newToast]);

        // Remove o toast automaticamente após 4.5 segundos
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 4500);
      }
    };

    window.addEventListener('bn_toast_alert', handleNewToast);
    return () => window.removeEventListener('bn_toast_alert', handleNewToast);
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('bn_current_user', JSON.stringify(user));
    
    // Atualiza estados locais ao fazer login
    const data = getStorageData();
    setPosts(data.posts);
    setChats(data.chats);
    setNotifications(data.notifications);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bn_current_user');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Se não estiver logado, exibe tela de login brutalista
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar de Navegação */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={notifications.filter(n => n.username === currentUser.username)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Conteúdo Principal */}
      <main className="main-content">
        {activeTab === 'feed' && (
          <Feed
            posts={posts}
            setPosts={(newPosts) => {
              setPosts(newPosts);
              triggerLocalSync('POSTS_UPDATE', 'bn_posts', newPosts);
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'chat' && (
          <Chat
            currentUser={currentUser}
            chats={chats}
          />
        )}

        {activeTab === 'notifications' && (
          <Notifications
            notifications={notifications}
            setNotifications={(newNotifs) => {
              setNotifications(newNotifs);
              triggerLocalSync('NOTIFICATIONS_UPDATE', 'bn_notifications', newNotifs);
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            currentUser={currentUser}
            setCurrentUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('bn_current_user', JSON.stringify(updatedUser));
              triggerLocalSync('USERS_UPDATE', 'bn_users', updatedUser);
            }}
          />
        )}
      </main>

      {/* Toasts Container para Popups Irritantes / Notificações de Tédio em tempo real */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-item">
            <div className="toast-header">
              Alerta Irrelevante
            </div>
            <div className="toast-body">
              {toast.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
