// ===== Data (fetched) =====
let broadcasts = [];
let filteredBroadcasts = [];
let activeBroadcastId = null;

// ===== DOM Elements =====
const broadcastsGrid = document.getElementById('broadcastsGrid');
const searchInput = document.getElementById('searchInput');
const broadcastsEmpty = document.getElementById('broadcastsEmpty');

// ===== Render Functions =====
function renderBroadcasts() {
  broadcastsGrid.innerHTML = '';
  if (filteredBroadcasts.length === 0) {
    broadcastsEmpty.style.display = 'block';
    return;
  } else {
    broadcastsEmpty.style.display = 'none';
  }
  
  filteredBroadcasts.forEach(item => {
    const card = document.createElement('div');
    card.className = 'broadcast-card';
    card.innerHTML = `
      <div class="broadcast-header">
        <div class="broadcast-icon">📢</div>
        <div class="broadcast-meta">
          <div class="broadcast-title">${item.subject}</div>
          <div class="broadcast-time">${item.timestamp}</div>
        </div>
        <div class="broadcast-status">${item.expiresLabel}</div>
      </div>
      <div class="broadcast-content">
        <div class="broadcast-text">${item.content}</div>
      </div>
    `;
    broadcastsGrid.appendChild(card);
  });
}



// ===== Event Handlers =====


searchInput.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  filteredBroadcasts = broadcasts.filter(item =>
    item.subject.toLowerCase().includes(q) ||
    item.content.toLowerCase().includes(q)
  );
  renderBroadcasts();
});

// ===== Initial Render =====
async function fetchBroadcasts() {
  try {
    const res = await fetch('/api/messages/broadcast', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    const list = Array.isArray(data?.messages) ? data.messages : [];
    broadcasts = list.map(m => {
      const created = new Date(m.createdAt);
      const ts = created.toLocaleString();
      let expiresLabel = 'Active';
      let expiresSuffix = '';
      if (m.broadcastExpiresAt) {
        const exp = new Date(m.broadcastExpiresAt);
        const rel = exp.toLocaleString();
        expiresLabel = `Expires ${rel}`;
        expiresSuffix = ` · Expires ${rel}`;
      }
      return {
        id: m._id,
        subject: m.subject || 'Announcement',
        content: m.content || '',
        timestamp: ts,
        expiresLabel,
        expiresSuffix
      };
    });
    filteredBroadcasts = [...broadcasts];
    renderBroadcasts();
  } catch (_) {
    // fallback empty state
    broadcasts = [];
    filteredBroadcasts = [];
    renderBroadcasts();
  }
}

fetchBroadcasts();
