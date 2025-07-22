// ===== Demo Data =====
const demoConversations = [
  {
    id: '1',
    name: 'Priya Sharma',
    avatar: '',
    initials: 'PS',
    lastMessage: 'Thank you for the update!',
    lastTimestamp: '09:15 AM',
    unread: 2,
    online: true,
    messages: [
      { sender: 'me', text: 'Hi Priya, your leave is approved.', time: '09:10 AM' },
      { sender: 'Priya Sharma', text: 'Thank you for the update!', time: '09:15 AM' },
      { sender: 'system', text: 'Leave Approved', time: '09:15 AM' },
    ],
  },
  {
    id: '2',
    name: 'Admin',
    avatar: '',
    initials: 'AD',
    lastMessage: 'Please submit your report.',
    lastTimestamp: 'Yesterday',
    unread: 0,
    online: false,
    messages: [
      { sender: 'Admin', text: 'Please submit your report.', time: 'Yesterday' },
      { sender: 'me', text: 'Will do, thanks!', time: 'Yesterday' },
      { sender: 'system', text: 'Admin joined chat', time: 'Yesterday' },
    ],
  },
  {
    id: '3',
    name: 'Rohit Kumar',
    avatar: '',
    initials: 'RK',
    lastMessage: 'Can you clarify the task?',
    lastTimestamp: 'Mon',
    unread: 1,
    online: true,
    messages: [
      { sender: 'Rohit Kumar', text: 'Can you clarify the task?', time: 'Mon' },
      { sender: 'me', text: 'Sure, let me explain...', time: 'Mon' },
    ],
  },
];

let filteredConversations = [...demoConversations];
let activeConversationId = demoConversations[0]?.id || null;

// ===== DOM Elements =====
const conversationList = document.getElementById('conversationList');
const chatHeader = document.getElementById('chatHeader');
const chatBody = document.getElementById('chatBody');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const searchInput = document.getElementById('searchInput');
const sidebarEmptyState = document.getElementById('sidebarEmptyState');

// ===== Render Functions =====
function renderConversations() {
  conversationList.innerHTML = '';
  if (filteredConversations.length === 0) {
    sidebarEmptyState.style.display = 'block';
    return;
  } else {
    sidebarEmptyState.style.display = 'none';
  }
  filteredConversations.forEach(conv => {
    const li = document.createElement('li');
    li.className = 'messages-conversation-item' + (conv.id === activeConversationId ? ' active' : '');
    li.dataset.id = conv.id;
    li.innerHTML = `
      <div class="messages-avatar">${conv.avatar ? `<img src="${conv.avatar}" alt="${conv.name}" />` : conv.initials}</div>
      <div class="messages-conversation-content">
        <span class="messages-conversation-username">${conv.name}</span>
        <span class="messages-conversation-snippet">${conv.lastMessage}</span>
      </div>
      <span class="messages-conversation-timestamp">${conv.lastTimestamp}</span>
      ${conv.unread > 0 ? `<span class="messages-notification-badge">${conv.unread}</span>` : ''}
    `;
    li.onclick = () => {
      if (activeConversationId !== conv.id) {
        activeConversationId = conv.id;
        conv.unread = 0;
        renderConversations();
        renderChatWindow();
      }
    };
    conversationList.appendChild(li);
  });
}

function renderChatWindow() {
  const conv = demoConversations.find(c => c.id === activeConversationId);
  if (!conv) {
    chatHeader.innerHTML = '';
    chatBody.innerHTML = '<div class="messages-empty-state">Select a conversation to start chatting.</div>';
    return;
  }
  // Header
  chatHeader.innerHTML = `
    <div class="messages-chat-header-info">
      <div class="messages-chat-header-avatar">${conv.avatar ? `<img src="${conv.avatar}" alt="${conv.name}" />` : conv.initials}</div>
      <span class="messages-chat-header-name">${conv.name}</span>
      <span class="messages-chat-header-status ${conv.online ? 'online' : 'offline'}">${conv.online ? '🟢 Online' : '🔴 Offline'}</span>
    </div>
  `;
  // Messages
  chatBody.innerHTML = '';
  if (!conv.messages || conv.messages.length === 0) {
    chatBody.innerHTML = '<div class="messages-empty-state">No messages yet. Say hello!</div>';
    return;
  }
  conv.messages.forEach(msg => {
    if (msg.sender === 'system') {
      const sysMsg = document.createElement('div');
      sysMsg.className = 'messages-message-system';
      sysMsg.textContent = msg.text;
      chatBody.appendChild(sysMsg);
    } else {
      const row = document.createElement('div');
      row.className = 'messages-message-row' + (msg.sender === 'me' ? ' sent' : '');
      const bubble = document.createElement('div');
      bubble.className = 'messages-message-bubble ' + (msg.sender === 'me' ? 'sent' : 'received');
      bubble.textContent = msg.text;
      row.appendChild(bubble);
      const time = document.createElement('div');
      time.className = 'messages-message-timestamp';
      time.textContent = msg.time;
      row.appendChild(time);
      chatBody.appendChild(row);
    }
  });
  // Scroll to latest
  setTimeout(() => {
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 50);
}

// ===== Event Handlers =====
messageForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  const conv = demoConversations.find(c => c.id === activeConversationId);
  if (!conv) return;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  conv.messages.push({ sender: 'me', text, time });
  conv.lastMessage = text;
  conv.lastTimestamp = time;
  messageInput.value = '';
  renderChatWindow();
  renderConversations();
});

searchInput.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  filteredConversations = demoConversations.filter(conv =>
    conv.name.toLowerCase().includes(q) ||
    conv.lastMessage.toLowerCase().includes(q)
  );
  if (!filteredConversations.some(c => c.id === activeConversationId)) {
    activeConversationId = filteredConversations[0]?.id || null;
  }
  renderConversations();
  renderChatWindow();
});

// ===== Initial Render =====
renderConversations();
renderChatWindow();
