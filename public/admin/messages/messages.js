let selectedBroadcastId = null;
let broadcasts = [];

function renderBroadcastsList() {
  const list = document.getElementById('broadcastsList');
  list.innerHTML = '';
  broadcasts.forEach(broadcast => {
    const item = document.createElement('div');
    item.className = 'broadcast-item' + (broadcast.id === selectedBroadcastId ? ' selected' : '');
    item.innerHTML = `
      <div class="broadcast-item-header">
        <span class="broadcast-subject">${broadcast.subject}</span>
        <span class="broadcast-date">${broadcast.date}</span>
      </div>
      <div class="broadcast-item-preview">${broadcast.content.substring(0, 60)}${broadcast.content.length > 60 ? '...' : ''}</div>
      ${broadcast.expires ? `<div class="broadcast-expires">Expires: ${broadcast.expires}</div>` : ''}
    `;
    item.onclick = () => {
      selectedBroadcastId = broadcast.id;
      renderBroadcastsList();
      renderBroadcastView(broadcast);
    };
    list.appendChild(item);
  });
  if (broadcasts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No broadcasts yet.';
    list.appendChild(empty);
  }
}

function renderBroadcastView(broadcast) {
  const view = document.getElementById('broadcastView');
  if (!broadcast) {
    view.innerHTML = '<p class="no-broadcast">Select a broadcast to view</p>';
    return;
  }
  view.innerHTML = `
    <div class="broadcast-view-header">
      <h3>${broadcast.subject}</h3>
      <div class="broadcast-view-meta">
        <span>Posted: ${broadcast.date}</span>
        ${broadcast.expires ? `<span>Expires: ${broadcast.expires}</span>` : ''}
      </div>
    </div>
    <div class="broadcast-view-content">
      ${broadcast.content}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
});

async function bootstrap() {
  await fetchBroadcasts();
  renderBroadcastsList();
  renderBroadcastView();
  installBroadcastComposer();
}

async function fetchBroadcasts() {
  try {
    const res = await fetch('/api/messages/broadcast', { method: 'GET', credentials: 'include' });
    const data = await res.json();
    const list = Array.isArray(data?.messages) ? data.messages : [];
    broadcasts = list.map(m => ({
      id: m._id,
      subject: m.subject || 'Announcement',
      date: new Date(m.createdAt).toLocaleString(),
      content: m.content || '',
      expires: m.broadcastExpiresAt ? new Date(m.broadcastExpiresAt).toLocaleString() : ''
    }));
  } catch (_) {
    broadcasts = [];
  }
}

function installBroadcastComposer() {
  const btn = document.getElementById('sendBroadcastBtn');
  if (!btn) return;
  btn.addEventListener('click', () => openBroadcastModal());
}

function openBroadcastModal() {
  const existing = document.getElementById('broadcastModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'broadcastModal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.innerHTML = `
    <div style="background:#fff; padding:20px; border-radius:8px; width: min(520px, 92vw); box-shadow:0 10px 30px rgba(0,0,0,0.2)">
      <h3 style="margin:0 0 12px 0">Send Broadcast</h3>
      <form id="broadcastForm">
        <div style="margin-bottom:10px">
          <label>Subject</label>
          <input id="bcSubject" type="text" required style="width:100%; padding:8px; margin-top:4px" placeholder="Announcement subject" />
        </div>
        <div style="margin-bottom:10px">
          <label>Content</label>
          <textarea id="bcContent" rows="5" required style="width:100%; padding:8px; margin-top:4px" placeholder="Write your announcement..."></textarea>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:10px">
          <div style="flex:1">
            <label>Expires in (minutes)</label>
            <input id="bcExpiresIn" type="number" min="1" step="1" style="width:100%; padding:8px; margin-top:4px" placeholder="e.g. 1440 for 1 day" />
          </div>
          <div style="flex:1">
            <label>Or pick exact expiry</label>
            <input id="bcExpiresAt" type="datetime-local" style="width:100%; padding:8px; margin-top:4px" />
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px">
          <button type="button" id="bcCancel" class="btn">Cancel</button>
          <button type="submit" class="btn btn-primary">Send</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('bcCancel').onclick = () => modal.remove();
  document.getElementById('broadcastForm').onsubmit = async (e) => {
    e.preventDefault();
    const subject = document.getElementById('bcSubject').value.trim();
    const content = document.getElementById('bcContent').value.trim();
    const expiresInMinutes = document.getElementById('bcExpiresIn').value;
    const expiresAt = document.getElementById('bcExpiresAt').value;
    if (!subject || !content) return;
    try {
      const res = await fetch('/api/messages/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, expiresInMinutes, expiresAt })
      });
      if (res.ok) {
        modal.remove();
        await fetchBroadcasts();
        renderBroadcastsList();
        renderBroadcastView();
      } else {
        alert('Failed to send broadcast');
      }
    } catch (_) {
      alert('Failed to send broadcast');
    }
  };
}
