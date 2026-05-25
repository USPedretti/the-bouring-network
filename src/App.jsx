import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import { fetchPosts, fetchNotifications, subscribeToSync } from './db/mockStore';
import { supabase } from './db/supabaseClient';

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

  // Carrega dados iniciais do Supabase
  useEffect(() => {
    async function loadInitialData() {
      const postsData = await fetchPosts();
      setPosts(postsData);
      
      if (currentUser) {
        const notifsData = await fetchNotifications(currentUser.username);
        setNotifications(notifsData);
      }
    }
    loadInitialData();
  }, [currentUser]);

  // Sincroniza Tema com o elemento HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bn_theme', theme);
  }, [theme]);

  // Sincronização em tempo real via Supabase Realtime
  useEffect(() => {
    const handleSync = async (payload) => {
      if (payload.key === 'bn_posts') {
        if (payload.data) {
          setPosts(payload.data);
        } else {
          const postsData = await fetchPosts();
          setPosts(postsData);
        }
      }
      if (payload.key === 'bn_chats') {
        setChats(prev => [...prev, {}]); // Dispara recarregamento no componente de Chat
      }
      if (payload.key === 'bn_notifications' && currentUser) {
        const notifsData = await fetchNotifications(currentUser.username);
        setNotifications(notifsData);
      }
      if (payload.key === 'bn_users' && currentUser) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('username', currentUser.username)
          .maybeSingle();
        if (dbUser) {
          const freshUser = {
            username: dbUser.username,
            name: dbUser.name,
            bio: dbUser.bio,
            boredomLevel: dbUser.boredom_level,
            avatarColor: dbUser.avatar_color
          };
          setCurrentUser(freshUser);
          localStorage.setItem('bn_current_user', JSON.stringify(freshUser));
        }
      }
    };

    const unsubscribe = subscribeToSync(handleSync);
    return () => unsubscribe();
  }, [currentUser]);

  // Captura eventos de Toast em tempo real
  useEffect(() => {
    const handleNewToast = (e) => {
      const newNotif = e.detail;
      
      // Apenas mostra toast se for para o usuário logado e não for sobre chat
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

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    localStorage.setItem('bn_current_user', JSON.stringify(user));
    
    // Atualiza estados locais ao fazer login
    const postsData = await fetchPosts();
    setPosts(postsData);
    const notifsData = await fetchNotifications(user.username);
    setNotifications(notifsData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bn_current_user');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
            setPosts={setPosts}
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
            setNotifications={setNotifications}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}
      </main>

      {/* Toasts Container */}
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
