// Integração com Banco de Dados Supabase (Substituindo o LocalStorage)
import { supabase } from './supabaseClient';

const BOTS = ['Aderbal_Soneca', 'Clara_Tediante', 'Robo_Entediado'];

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

// Mapper de banco de dados (snake_case) para React (camelCase)
const mapUserToUI = (dbUser) => {
  if (!dbUser) return null;
  return {
    username: dbUser.username,
    name: dbUser.name,
    bio: dbUser.bio,
    boredomLevel: dbUser.boredom_level,
    avatarColor: dbUser.avatar_color
  };
};

// Funções mock sem efeito mantidas para retrocompatibilidade provisória
export const getStorageData = () => {
  return { users: [], posts: [], chats: [], notifications: [] };
};

export const saveStorageData = () => {};
export const triggerLocalSync = () => {};

// Busca posts da tabela do Supabase (com likes e comments)
export const fetchPosts = async () => {
  const { data: dbPosts, error } = await supabase
    .from('posts')
    .select(`
      id,
      username,
      content,
      image_url,
      created_at,
      post_likes ( username ),
      post_comments ( id, username, content, created_at )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar posts:', error);
    return [];
  }

  return dbPosts.map(post => ({
    id: post.id,
    username: post.username,
    content: post.content,
    imageUrl: post.image_url || '',
    createdAt: post.created_at,
    likes: post.post_likes ? post.post_likes.map(l => l.username) : [],
    comments: post.post_comments ? post.post_comments.map(c => ({
      id: c.id,
      username: c.username,
      content: c.content,
      createdAt: c.created_at
    })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : []
  }));
};

// Registra um novo usuário no banco
export const registerUser = async (username, password, name, bio = '') => {
  const cleanUsername = username.trim();
  const lowerUsername = cleanUsername.toLowerCase();
  
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('username')
    .ilike('username', lowerUsername)
    .maybeSingle();

  if (checkError) {
    console.error('Erro detalhado ao verificar usuário no Supabase:', checkError);
    return { success: false, error: `Erro ao verificar nome de usuário: ${checkError.message}` };
  }
  if (existingUser) {
    return { success: false, error: 'Este nome de usuário incrivelmente genérico já existe.' };
  }
  
  const newUser = {
    username: cleanUsername,
    password,
    name: name.trim() || cleanUsername,
    bio: bio.trim() || 'Apenas mais um usuário comum e sem nada especial.',
    boredom_level: 5,
    avatar_color: '#7a7672'
  };
  
  const { error: insertError } = await supabase
    .from('users')
    .insert([newUser]);

  if (insertError) {
    console.error('Erro detalhado ao cadastrar usuário no Supabase:', insertError);
    return { success: false, error: `Erro ao cadastrar usuário no Supabase: ${insertError.message}` };
  }
  
  return { success: true, user: mapUserToUI(newUser) };
};

// Faz login
export const loginUser = async (username, password) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username.trim())
    .maybeSingle();
  
  if (error) {
    console.error('Erro detalhado de login no Supabase:', error);
    return { success: false, error: `Erro ao conectar com o Supabase: ${error.message}` };
  }
  if (!user) {
    return { success: false, error: 'Usuário não cadastrado nesta base entediante.' };
  }
  
  const isBot = BOTS.includes(user.username);
  if (!isBot && user.password !== password) {
    return { success: false, error: 'Senha incorreta. Tente algo menos complicado.' };
  }
  
  return { success: true, user: mapUserToUI(user) };
};

// Cria um post no Supabase
export const createPost = async (username, content, imageUrl = '') => {
  const newPost = {
    username,
    content: content.trim(),
    image_url: imageUrl || null
  };
  
  const { data: post, error } = await supabase
    .from('posts')
    .insert([newPost])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar post:', error);
    return null;
  }
  
  // Gera notificação global aleatória (para irritar/divertir)
  await triggerRandomSystemNotification(username);
  
  return {
    id: post.id,
    username: post.username,
    content: post.content,
    imageUrl: post.image_url || '',
    createdAt: post.created_at,
    likes: [],
    comments: []
  };
};

// Curte / Descurte um post
export const toggleLike = async (postId, username) => {
  const { data: existingLike, error: checkError } = await supabase
    .from('post_likes')
    .select('*')
    .eq('post_id', postId)
    .eq('username', username)
    .maybeSingle();

  if (checkError) return null;

  if (existingLike) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('username', username);
  } else {
    await supabase
      .from('post_likes')
      .insert([{ post_id: postId, username }]);
    
    // Notifica o dono do post
    const { data: post } = await supabase
      .from('posts')
      .select('username')
      .eq('id', postId)
      .single();

    if (post && post.username !== username) {
      await addNotification(post.username, `${username} marcou seu post com um "Ok". Nada de extraordinário.`, 'like');
    }
  }
  
  const { data: updatedLikes } = await supabase
    .from('post_likes')
    .select('username')
    .eq('post_id', postId);

  return updatedLikes ? updatedLikes.map(l => l.username) : [];
};

// Comenta em um post
export const addComment = async (postId, username, content) => {
  const newComment = {
    post_id: postId,
    username,
    content: content.trim()
  };
  
  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert([newComment])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar comentário:', error);
    return null;
  }
  
  const { data: post } = await supabase
    .from('posts')
    .select('username')
    .eq('id', postId)
    .single();

  if (post && post.username !== username) {
    await addNotification(post.username, `${username} comentou algo irrelevante no seu post.`, 'comment');
  }
  
  return {
    id: comment.id,
    username: comment.username,
    content: comment.content,
    createdAt: comment.created_at
  };
};

// Adiciona notificação
export const addNotification = async (targetUsername, content, type = 'system') => {
  const newNotification = {
    username: targetUsername,
    type,
    content,
    read: false
  };
  
  const { data: notif, error } = await supabase
    .from('notifications')
    .insert([newNotification])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar notificação:', error);
    return null;
  }
  
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('bn_toast_alert', { detail: {
      id: notif.id,
      username: notif.username,
      type: notif.type,
      content: notif.content,
      createdAt: notif.created_at,
      read: notif.read
    } });
    window.dispatchEvent(event);
  }

  return notif;
};

// Busca notificações do usuário
export const fetchNotifications = async (username) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }

  return data.map(n => ({
    id: n.id,
    username: n.username,
    type: n.type,
    content: n.content,
    createdAt: n.created_at,
    read: n.read
  }));
};

// Marca todas as notificações como lidas
export const markAllNotificationsRead = async (username) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('username', username);

  if (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
  }
};

// Limpa notificações do usuário
export const clearAllNotifications = async (username) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('username', username);

  if (error) {
    console.error('Erro ao limpar notificações:', error);
  }
};

// Marca uma notificação específica como lida
export const markNotificationRead = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

// Dispara uma notificação aleatória no feed de alguém
const triggerRandomSystemNotification = async (senderUsername) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('username');

  if (error || !users) return;
  
  const potentialTargets = users
    .filter(u => u.username !== senderUsername && !BOTS.includes(u.username))
    .map(u => u.username);
  
  if (potentialTargets.length === 0) return;
  
  const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
  
  const notificationsOfTension = [
    `${senderUsername} acabou de atualizar o feed dele com um post chato.`,
    `Atenção: ${senderUsername} gastou energia digital publicando algo.`,
    `Alerta irrelevante: Novo conteúdo entediante foi gerado na rede.`
  ];
  
  const content = notificationsOfTension[Math.floor(Math.random() * notificationsOfTension.length)];
  await addNotification(target, content, 'system');
};

// Verifica se um nome de usuário está disponível
export const checkUsernameAvailability = async (newUsername) => {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .ilike('username', newUsername.trim())
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar disponibilidade de username:', error);
    return false;
  }

  return data === null;
};

// Atualiza perfil de usuário
export const updateUserProfile = async (username, updatedData) => {
  const dbData = {};
  if (updatedData.name !== undefined) dbData.name = updatedData.name;
  if (updatedData.bio !== undefined) dbData.bio = updatedData.bio;
  if (updatedData.boredomLevel !== undefined) dbData.boredom_level = parseInt(updatedData.boredomLevel);
  if (updatedData.avatarColor !== undefined) dbData.avatar_color = updatedData.avatarColor;
  if (updatedData.newUsername !== undefined && updatedData.newUsername.trim().toLowerCase() !== username.toLowerCase()) {
    dbData.username = updatedData.newUsername.trim();
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(dbData)
    .eq('username', username)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    return null;
  }
  return mapUserToUI(updated);
};

// Envia mensagem direta (Chat)
export const sendDirectMessage = async (fromUser, toUser, text) => {
  const newMessage = {
    sender: fromUser,
    receiver: toUser,
    text: text.trim()
  };

  const { data: msg, error } = await supabase
    .from('messages')
    .insert([newMessage])
    .select()
    .single();

  if (error) {
    console.error('Erro ao enviar mensagem:', error);
    return null;
  }
  
  // Simula digitação e resposta de Bots
  const isBot = BOTS.includes(toUser);
  if (isBot) {
    setTimeout(async () => {
      const responses = BOT_RESPONSES[toUser] || ['Humm... tanto faz.'];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = {
        sender: toUser,
        receiver: fromUser,
        text: randomReply
      };
      
      const { data: botMsg } = await supabase
        .from('messages')
        .insert([botMessage])
        .select()
        .single();
      
      if (botMsg) {
        await addNotification(fromUser, `${toUser} te respondeu com total desdém.`, 'chat');
      }
      
    }, 1500 + Math.random() * 1500);
  } else {
    await addNotification(toUser, `Você recebeu uma mensagem privada insignificante de ${fromUser}.`, 'chat');
  }
  
  return msg;
};

// Retorna o histórico de DMs de um usuário com outro
export const getChatHistory = async (userA, userB) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender.eq.${userA},receiver.eq.${userB}),and(sender.eq.${userB},receiver.eq.${userA})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao obter histórico do chat:', error);
    return [];
  }

  return data.map(m => ({
    id: m.id,
    sender: m.sender,
    receiver: m.receiver,
    text: m.text,
    createdAt: m.created_at
  }));
};

// Retorna os contatos com quem o usuário já conversou ou pode conversar
export const getChatContacts = async (currentUsername) => {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError || !users) {
    console.error('Erro ao buscar usuários:', usersError);
    return [];
  }
  
  const { data: chats, error: chatsError } = await supabase
    .from('messages')
    .select('sender, receiver')
    .or(`sender.eq.${currentUsername},receiver.eq.${currentUsername}`);

  const messagePartners = new Set();
  if (chats) {
    chats.forEach(m => {
      if (m.sender === currentUsername) messagePartners.add(m.receiver);
      if (m.receiver === currentUsername) messagePartners.add(m.sender);
    });
  }
  
  return users
    .filter(u => u.username !== currentUsername)
    .map(u => ({
      username: u.username,
      name: u.name,
      bio: u.bio,
      boredomLevel: u.boredom_level,
      avatarColor: u.avatar_color,
      hasInteracted: messagePartners.has(u.username)
    }))
    .sort((a, b) => (b.hasInteracted ? 1 : 0) - (a.hasInteracted ? 1 : 0));
};

// Escuta por mudanças sincronizadas em tempo real via Supabase Realtime
export const subscribeToSync = (callback) => {
  // Sincroniza Posts
  const postsChannel = supabase
    .channel('public:posts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async () => {
      const posts = await fetchPosts();
      callback({ key: 'bn_posts', data: posts });
    })
    .subscribe();

  // Sincroniza Likes
  const likesChannel = supabase
    .channel('public:post_likes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, async () => {
      const posts = await fetchPosts();
      callback({ key: 'bn_posts', data: posts });
    })
    .subscribe();

  // Sincroniza Comentários
  const commentsChannel = supabase
    .channel('public:post_comments')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, async () => {
      const posts = await fetchPosts();
      callback({ key: 'bn_posts', data: posts });
    })
    .subscribe();

  // Sincroniza Mensagens de Chat
  const messagesChannel = supabase
    .channel('public:messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      callback({ key: 'bn_chats' });
    })
    .subscribe();

  // Sincroniza Notificações
  const notificationsChannel = supabase
    .channel('public:notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      callback({ key: 'bn_notifications' });
    })
    .subscribe();

  // Sincroniza Perfis de Usuários
  const usersChannel = supabase
    .channel('public:users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      callback({ key: 'bn_users' });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(postsChannel);
    supabase.removeChannel(likesChannel);
    supabase.removeChannel(commentsChannel);
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(notificationsChannel);
    supabase.removeChannel(usersChannel);
  };
};
