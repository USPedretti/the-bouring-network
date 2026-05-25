import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { getChatContacts, getChatHistory, sendDirectMessage } from '../db/mockStore';

export default function Chat({ currentUser, chats }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Carrega contatos ao montar o componente ou quando a lista global de chats é atualizada
  useEffect(() => {
    setContacts(getChatContacts(currentUser.username));
  }, [currentUser, chats]);

  // Carrega mensagens do contato selecionado
  useEffect(() => {
    if (selectedContact) {
      setMessages(getChatHistory(currentUser.username, selectedContact.username));
    }
  }, [selectedContact, currentUser, chats]);

  // Rola até o final das mensagens quando elas mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    sendDirectMessage(currentUser.username, selectedContact.username, messageText);
    setMessageText('');

    // Atualiza histórico local imediatamente para um feeling responsivo
    // (O resto é sincronizado via mockStore no LocalStorage + broadcast)
    setTimeout(() => {
      setMessages(getChatHistory(currentUser.username, selectedContact.username));
    }, 50);
  };

  const formatMessageTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="feed-header">
        <h1 className="feed-title">Chat Inútil</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
          Converse em tempo real com bots extremamente desinteressados ou abra outra aba para conversar consigo mesmo.
        </p>
      </div>

      <div className="chat-container">
        {/* Lista de Contatos */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span>Contatos Monótonos</span>
          </div>
          <div className="chat-contacts-list">
            {contacts.map((contact) => {
              const isSelected = selectedContact?.username === contact.username;
              return (
                <button
                  key={contact.username}
                  className={`contact-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <span className="contact-name">@{contact.username}</span>
                  <span className="contact-status" style={{ fontSize: '0.7rem' }}>
                    Tédio: {contact.boredomLevel || 5}/10
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Área de Conversa */}
        <main className="chat-area">
          {selectedContact ? (
            <>
              <header className="chat-area-header">
                <span>Conversando com @{selectedContact.username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1rem', fontStyle: 'italic' }}>
                  — {selectedContact.bio.substring(0, 45)}...
                </span>
              </header>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Nenhuma mensagem enviada. O silêncio é a melhor resposta.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === currentUser.username;
                    return (
                      <div
                        key={msg.id}
                        className={`message-bubble ${isMe ? 'sent' : 'received'}`}
                      >
                        <div>{msg.text}</div>
                        <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input
                  type="text"
                  className="form-input"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escreva algo que ninguém queira ler..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem' }}
                />
                <button type="submit" className="btn-boring" style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <div>
                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-editorial)' }}>
                  Sem conversas no momento
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Selecione um contato na barra lateral esquerda para iniciar uma troca de palavras sem propósito ou entusiasmo.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
