import { useEffect, useState, useRef } from 'react';
// Removed 'User' and 'Menu' from the import
import { Send, Search, MessageSquare } from 'lucide-react';
import api from '../services/api';
import PublicNavbar from '../components/PublicNavbar';

function MessagesPage() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('art_gallery_user') || 'null'));
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [search, setSearch] = useState('');
  
  const messagesEndRef = useRef(null);

  // 1. Fetch Contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/messages/contacts');
        setContacts(res.data.contacts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, []);

  // 2. Fetch Messages for Active Chat (Auto-polling every 3 seconds)
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeChat.user_id}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages(); // Fetch immediately
    const interval = setInterval(fetchMessages, 3000); // Then poll every 3s

    return () => clearInterval(interval);
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const text = newMessage;
    setNewMessage(''); // Clear input immediately

    try {
      await api.post('/messages', {
        receiver_id: activeChat.user_id,
        message_text: text
      });
      // Optimistically add message to UI
      const res = await api.get(`/messages/${activeChat.user_id}`);
      setMessages(res.data.messages);
    } catch (err) {
      // Fixed: Using 'err' to show the actual backend error message
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
        
        {/* LEFT SIDE: CONTACTS LIST */}
        <div style={{ width: '300px', background: 'white', borderRadius: '12px', border: '1px solid #e8e3da', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e8e3da' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', margin: '0 0 15px 0' }}>Messages</h2>
            <div className="search-box" style={{ width: '100%' }}>
              <Search size={16} style={{ color: '#a47745' }} />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingContacts ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading...</p>
            ) : filteredContacts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No contacts found.</p>
            ) : (
              filteredContacts.map(contact => (
                <div 
                  key={contact.user_id} 
                  onClick={() => setActiveChat(contact)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', cursor: 'pointer',
                    background: activeChat?.user_id === contact.user_id ? '#f0ede6' : 'transparent',
                    borderBottom: '1px solid #f8f6f2', transition: 'background 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#a47745', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {contact.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#25231f' }}>{contact.full_name}</strong>
                    <span style={{ fontSize: '12px', color: '#777168' }}>{contact.role_name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE: CHAT WINDOW */}
        <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e8e3da', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid #e8e3da', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#a47745', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {activeChat.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#25231f' }}>{activeChat.full_name}</strong>
                  <span style={{ fontSize: '12px', color: '#3f7d3c' }}>Online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#faf9f6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                    <MessageSquare size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p>Start a conversation with {activeChat.full_name}.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.user_id;
                    return (
                      <div key={msg.message_id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px',
                          background: isMe ? '#a47745' : 'white',
                          color: isMe ? 'white' : '#25231f',
                          border: isMe ? 'none' : '1px solid #e8e3da',
                          borderBottomRightRadius: isMe ? '2px' : '12px',
                          borderBottomLeftRadius: isMe ? '12px' : '2px'
                        }}>
                          {msg.message_text}
                          <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7, textAlign: isMe ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #e8e3da', display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', border: '1px solid #e8e3da', borderRadius: '25px', outline: 'none', background: '#faf9f6' }}
                />
                <button type="submit" className="primary-button" style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, flexShrink: 0 }}>
                  <Send size={18} style={{ marginLeft: '-2px' }} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <MessageSquare size={50} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '24px' }}>Your Messages</h3>
              <p>Select a contact from the left to start chatting.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MessagesPage;