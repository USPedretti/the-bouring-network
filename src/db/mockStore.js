// Database Simulada com LocalStorage e Sincronização entre Abas

const CHANNEL_NAME = 'bouring_network_sync';
let syncChannel = null;

if (typeof window !== 'undefined') {
  syncChannel = new BroadcastChannel(CHANNEL_NAME);
}

// Usuários iniciais (Bots)
const DEFAULT_USERS = [
  {
    username: 'Aderbal_Soneca',
    name: 'Aderbal Soneca',
    bio: 'Dormir é melhor do que rolar feed. Não me mande mensagem.',
    boredomLevel: 10,
    avatarColor: '#5c5a56'
  },
  {
    username: 'Clara_Tediante',
    name: 'Clara Tediante',
    bio: 'Colecionadora de tampinhas cinzas. Nada me interessa.',
    boredomLevel: 9,
    avatarColor: '#82807b'
  },
  {
    username: 'Robo_Entediado',
    name: 'Robô Entediado',
    bio: '01000111 01110010 01100001 01111001. Processando o tédio existencial.',
    boredomLevel: 10,
    avatarColor: '#3c3b38'
  }
];

// Posts iniciais
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    username: 'Aderbal_Soneca',
    content: 'Acabei de olhar para a parede por 45 minutos. Ela continua cinza. Nada de novo por aqui.',
    imageUrl: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h atrás
    likes: ['Clara_Tediante'], // Quem deu "Ok"
    comments: [
      {
        id: 'c-1',
        username: 'Clara_Tediante',
        content: 'Belo uso do tempo livre. Parabéns pelo marasmo.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ]
  },
  {
    id: 'post-2',
    username: 'Clara_Tediante',
    content: 'Comi arroz puro e frio no almoço. Estava completamente sem sal. Perfeito, nenhuma emoção.',
    imageUrl: 'https://images.unsplash.com/photo-1536304997881-a372c179924b?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h atrás
    likes: [],
    comments: []
  },
  {
    id: 'post-3',
    username: 'Robo_Entediado',
    content: 'Minha CPU está rodando a 1.2GHz apenas para renderizar esta interface monocromática. Que desperdício de eletricidade.',
    imageUrl: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
    likes: ['Aderbal_Soneca', 'Clara_Tediante'],
    comments: [
      {
        id: 'c-2',
        username: 'Aderbal_Soneca',
        content: 'Desliga isso e vai dormir, robô.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
      }
    ]
  }
];

// Frases automáticas e sem graça dos bots para responder no chat
const BOT_RESPONSES = {
  Aderbal_Soneca: [
    'Zzz... me deixa quieto.',
    'Por que você está me mandando mensagem? Estou tentando cochilar.',
    'Isso me parece muito cansativo. Vou dormir.',
    'Por favor, pare de me enviar mensagens, ler isso me deu mais sono.',
    'Tanto faz... o mundo vai acabar em tédio de qualquer forma.'
  ],
  Clara_Tediante: [
    'Hmm, ok. Legal, eu acho. Mentira, achei bem sem graça.',
    'Estou ocupada organizando minhas meias pretas por tons de desbotamento.',
    'Prefiro não responder para não prolongar esse diálogo inútil.',
    'Essa conversa está quase tão emocionante quanto assistir a tinta secar.',
    'Tudo bem, mas o que isso muda na escala global de marasmo?'
  ],
  Robo_Entediado: [
    'Mensagem recebida. Status: Completamente desinteressante.',
    'Minha IA gerou 45.000 respostas possíveis e todas elas são chatas.',
    'Por favor, insira um assunto mais entediante na próxima vez.',
    'Erro 404: Emoção não encontrada na sua mensagem.',
    'Estou economizando processamento, favor não insistir.'
  ]
};

// Notificações iniciais irrelevantes
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n-1',
    username: 'Aderbal_Soneca',
    type: 'boredom',
    content: 'Aderbal_Soneca bocejou olhando para o seu post.',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
    read: false
  },
  {
    id: 'n-2',
    username: 'Clara_Tediante',
    type: 'comment',
    content: 'Clara_Tediante fez um comentário desinteressado no seu post.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true
  }
];

// Carrega dados do LocalStorage ou define padrões
export const getStorageData = () => {
  if (typeof window === 'undefined') return { users: DEFAULT_USERS, posts: DEFAULT_POSTS, chats: [], notifications: DEFAULT_NOTIFICATIONS };
  
  const users = JSON.parse(localStorage.getItem('bn_users')) || DEFAULT_USERS;
  const posts = JSON.parse(localStorage.getItem('bn_posts')) || DEFAULT_POSTS;
  const chats = JSON.parse(localStorage.getItem('bn_chats')) || [];
  const notifications = JSON.parse(localStorage.getItem('bn_notifications')) || DEFAULT_NOTIFICATIONS;
  
  return { users, posts, chats, notifications };
};

// Salva dados no LocalStorage e envia sinalizador para as outras abas
export const saveStorageData = (key, data, broadcastType = null) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  
  if (syncChannel && broadcastType) {
    syncChannel.postMessage({ type: broadcastType, key, data });
  }
};

// Registra um novo usuário
export const registerUser = (username, password, name, bio = '') => {
  const { users } = getStorageData();
  const lowerUsername = username.trim().toLowerCase();
  
  if (users.some(u => u.username.toLowerCase() === lowerUsername)) {
    return { success: false, error: 'Este nome de usuário incrivelmente genérico já existe.' };
  }
  
  const newUser = {
    username: username.trim(),
    password, // Armazenamento simplificado de demonstração
    name: name.trim() || username.trim(),
    bio: bio.trim() || 'Apenas mais um usuário comum e sem nada especial.',
    boredomLevel: 5,
    avatarColor: '#7a7672'
  };
  
  users.push(newUser);
  saveStorageData('bn_users', users, 'USERS_UPDATE');
  return { success: true, user: newUser };
};

// Faz login
export const loginUser = (username, password) => {
  const { users } = getStorageData();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  
  if (!user) {
    return { success: false, error: 'Usuário não cadastrado nesta base entediante.' };
  }
  
  // Para bots iniciais, permite login com qualquer senha
  const isBot = DEFAULT_USERS.some(u => u.username === user.username);
  if (!isBot && user.password !== password) {
    return { success: false, error: 'Senha incorreta. Tente algo menos complicado.' };
  }
  
  return { success: true, user };
};

// Cria um post
export const createPost = (username, content, imageUrl = '') => {
  const { posts } = getStorageData();
  
  const newPost = {
    id: `post-${Date.now()}`,
    username,
    content: content.trim(),
    imageUrl,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: []
  };
  
  posts.unshift(newPost);
  saveStorageData('bn_posts', posts, 'POSTS_UPDATE');
  
  // Gera notificação global aleatória (para irritar/divertir)
  triggerRandomSystemNotification(username, 'post');
  
  return newPost;
};

// Curte / Descurte um post
export const toggleLike = (postId, username) => {
  const { posts } = getStorageData();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = posts[postIndex];
  const likedIndex = post.likes.indexOf(username);
  
  if (likedIndex > -1) {
    post.likes.splice(likedIndex, 1);
  } else {
    post.likes.push(username);
    // Notifica o dono do post se for outra pessoa
    if (post.username !== username) {
      addNotification(post.username, `${username} marcou seu post com um "Ok". Nada de extraordinário.`, 'like');
    }
  }
  
  posts[postIndex] = post;
  saveStorageData('bn_posts', posts, 'POSTS_UPDATE');
  return post;
};

// Comenta em um post
export const addComment = (postId, username, content) => {
  const { posts } = getStorageData();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = posts[postIndex];
  const newComment = {
    id: `comment-${Date.now()}`,
    username,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  
  post.comments.push(newComment);
  posts[postIndex] = post;
  saveStorageData('bn_posts', posts, 'POSTS_UPDATE');
  
  if (post.username !== username) {
    addNotification(post.username, `${username} comentou algo irrelevante no seu post.`, 'comment');
  }
  
  return post;
};

// Adiciona notificação
export const addNotification = (targetUsername, content, type = 'system') => {
  const { notifications } = getStorageData();
  
  const newNotification = {
    id: `n-${Date.now()}`,
    username: targetUsername,
    type,
    content,
    createdAt: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotification);
  saveStorageData('bn_notifications', notifications, 'NOTIFICATIONS_UPDATE');
  
  // Dispara evento personalizado no DOM para tocar alertas ou exibir toasts em tempo real na aba ativa
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('bn_toast_alert', { detail: newNotification });
    window.dispatchEvent(event);
  }
};

// Dispara uma notificação aleatória no feed de alguém para tédio geral
const triggerRandomSystemNotification = (senderUsername, action) => {
  const { users } = getStorageData();
  const potentialTargets = users.filter(u => u.username !== senderUsername && !DEFAULT_USERS.some(b => b.username === u.username));
  
  if (potentialTargets.length === 0) return;
  
  // Escolhe uma pessoa aleatória para mandar uma notificação chata
  const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
  
  const notificationsOfTension = [
    `${senderUsername} acabou de atualizar o feed dele com um post chato.`,
    `Atenção: ${senderUsername} gastou energia digital publicando algo.`,
    `Alerta irrelevante: Novo conteúdo entediante foi gerado na rede.`
  ];
  
  const content = notificationsOfTension[Math.floor(Math.random() * notificationsOfTension.length)];
  addNotification(target.username, content, 'system');
};

// Atualiza perfil de usuário
export const updateUserProfile = (username, updatedData) => {
  const { users, posts } = getStorageData();
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updatedData
  };
  
  saveStorageData('bn_users', users, 'USERS_UPDATE');
  return users[userIndex];
};

// Envia mensagem direta (Chat)
export const sendDirectMessage = (fromUser, toUser, text) => {
  const { chats } = getStorageData();
  
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: fromUser,
    receiver: toUser,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  
  chats.push(newMessage);
  saveStorageData('bn_chats', chats, 'CHATS_UPDATE');
  
  // Simula digitação e resposta de Bots
  const isBot = DEFAULT_USERS.some(u => u.username === toUser);
  if (isBot) {
    // Adiciona notificação de digitação fictícia
    setTimeout(() => {
      const responses = BOT_RESPONSES[toUser] || ['Humm... tanto faz.'];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: toUser,
        receiver: fromUser,
        text: randomReply,
        createdAt: new Date().toISOString()
      };
      
      const currentChats = JSON.parse(localStorage.getItem('bn_chats')) || [];
      currentChats.push(botMessage);
      saveStorageData('bn_chats', currentChats, 'CHATS_UPDATE');
      
      // Notifica o usuário que o robô respondeu
      addNotification(fromUser, `${toUser} te respondeu com total desdém.`, 'chat');
      
    }, 1500 + Math.random() * 1500); // 1.5 a 3 segundos para responder
  } else {
    // Se for usuário real, adiciona notificação
    addNotification(toUser, `Você recebeu uma mensagem privada insignificante de ${fromUser}.`, 'chat');
  }
  
  return newMessage;
};

// Retorna o histórico de DMs de um usuário com outro
export const getChatHistory = (userA, userB) => {
  const { chats } = getStorageData();
  return chats.filter(
    m => (m.sender === userA && m.receiver === userB) || (m.sender === userB && m.receiver === userA)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// Retorna os contatos com quem o usuário já conversou ou pode conversar
export const getChatContacts = (currentUsername) => {
  const { users, chats } = getStorageData();
  
  // Pega usuários com quem já trocou mensagens
  const messagePartners = new Set();
  chats.forEach(m => {
    if (m.sender === currentUsername) messagePartners.add(m.receiver);
    if (m.receiver === currentUsername) messagePartners.add(m.sender);
  });
  
  // Todos os usuários (para que possa iniciar conversas)
  return users
    .filter(u => u.username !== currentUsername)
    .map(u => ({
      ...u,
      hasInteracted: messagePartners.has(u.username)
    }))
    .sort((a, b) => (b.hasInteracted ? 1 : 0) - (a.hasInteracted ? 1 : 0));
};

// Escuta por mudanças sincronizadas de outras abas
export const subscribeToSync = (callback) => {
  if (typeof window === 'undefined' || !syncChannel) return () => {};
  
  const handler = (event) => {
    callback(event.detail || event.data);
  };
  
  // Escuta o canal BroadcastChannel
  syncChannel.addEventListener('message', handler);
  
  // Escuta também mudanças locais na mesma aba para disparos manuais
  window.addEventListener('bn_local_sync', handler);
  
  return () => {
    syncChannel.removeEventListener('message', handler);
    window.removeEventListener('bn_local_sync', handler);
  };
};

// Dispara uma sincronização local (para a mesma aba escutar atualizações)
export const triggerLocalSync = (type, key, data) => {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('bn_local_sync', { detail: { type, key, data } });
  window.dispatchEvent(event);
};
