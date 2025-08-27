let selectedBroadcastId = null;
let broadcasts = [];
let activePopup = null;

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
    
    // Add click handler for the popup menu
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      showBroadcastPopup(broadcast, item);
    });
    
    list.appendChild(item);
  });
  if (broadcasts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No broadcasts yet.';
    list.appendChild(empty);
  }
}

function showBroadcastPopup(broadcast, element) {
  // Remove any existing popup
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
  
  // Create popup menu
  const popup = document.createElement('div');
  popup.className = 'broadcast-popup';
  
  // Get element position for popup placement
  const rect = element.getBoundingClientRect();
  popup.style.left = (rect.right + 10) + 'px';
  popup.style.top = rect.top + 'px';
  
  // Add menu items
  const menuItems = [
    { text: 'View', icon: 'fas fa-eye', action: () => viewBroadcast(broadcast) },
    { text: 'Edit', icon: 'fas fa-edit', action: () => editBroadcast(broadcast) },
    { text: 'Delete', icon: 'fas fa-trash', action: () => deleteBroadcast(broadcast) }
  ];
  
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'popup-menu-item';
    menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
    
    menuItem.addEventListener('click', () => {
      item.action();
      popup.remove();
      activePopup = null;
    });
    
    popup.appendChild(menuItem);
  });
  
  // Add popup to body
  document.body.appendChild(popup);
  activePopup = popup;
  
  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', closePopup);
  }, 100);
}

function closePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
  document.removeEventListener('click', closePopup);
}

function viewBroadcast(broadcast) {
  selectedBroadcastId = broadcast.id;
  renderBroadcastsList();
  renderBroadcastView(broadcast);
}

function editBroadcast(broadcast) {
  console.log('Editing broadcast:', broadcast);
  console.log('Broadcast ID:', broadcast.id);
  openEditBroadcastModal(broadcast);
}

function deleteBroadcast(broadcast) {
  if (confirm(`Are you sure you want to delete "${broadcast.subject}"?`)) {
    deleteBroadcastById(broadcast.id);
  }
}

async function deleteBroadcastById(broadcastId) {
  try {
    console.log('Sending DELETE request to:', `/api/messages/broadcast/${broadcastId}`);
    
    const res = await fetch(`/api/messages/broadcast/${broadcastId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (res.ok) {
      // Remove from local array
      broadcasts = broadcasts.filter(b => b.id !== broadcastId);
      
      // Clear selection if deleted broadcast was selected
      if (selectedBroadcastId === broadcastId) {
        selectedBroadcastId = null;
        renderBroadcastView(null);
      }
      
      renderBroadcastsList();
    } else {
      alert('Failed to delete broadcast');
    }
  } catch (error) {
    alert('Failed to delete broadcast');
  }
}

function openEditBroadcastModal(broadcast) {
  const existing = document.getElementById('editBroadcastModal');
  if (existing) existing.remove();
  
  // Get the original broadcast data for proper editing
  const originalBroadcast = broadcast.originalData || broadcast;
  
  const modal = document.createElement('div');
  modal.id = 'editBroadcastModal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  
  // Pre-fill expiry fields if they exist
  let expiresInMinutesValue = '';
  let expiresAtValue = '';
  
  if (originalBroadcast.broadcastExpiresAt) {
    const expiryDate = new Date(originalBroadcast.broadcastExpiresAt);
    expiresAtValue = expiryDate.toISOString().slice(0, 16); // Format for datetime-local input
  }
  
  modal.innerHTML = `
    <div style="background:#fff; padding:20px; border-radius:8px; width: min(520px, 92vw); box-shadow:0 10px 30px rgba(0,0,0,0.2)">
      <h3 style="margin:0 0 12px 0">Edit Broadcast</h3>
      <form id="editBroadcastForm">
        <div style="margin-bottom:10px">
          <label>Subject</label>
          <input id="editBcSubject" type="text" required style="width:100%; padding:8px; margin-top:4px" value="${originalBroadcast.subject || ''}" />
        </div>
        <div style="margin-bottom:10px">
          <label>Content</label>
          <textarea id="editBcContent" rows="5" required style="width:100%; padding:8px; margin-top:4px">${originalBroadcast.content || ''}</textarea>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:10px">
          <div style="flex:1">
            <label>Expires in (minutes)</label>
            <input id="editBcExpiresIn" type="number" min="1" step="1" style="width:100%; padding:8px; margin-top:4px" placeholder="e.g. 1440 for 1 day" value="${expiresInMinutesValue}" />
          </div>
          <div style="flex:1">
            <label>Or pick exact expiry</label>
            <input id="editBcExpiresAt" type="datetime-local" style="width:100%; padding:8px; margin-top:4px" value="${expiresAtValue}" />
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px">
          <button type="button" id="editBcCancel" class="btn">Cancel</button>
          <button type="submit" class="btn btn-primary">Update</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('editBcCancel').onclick = () => modal.remove();
  document.getElementById('editBroadcastForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('editBcSubject').value.trim();
    const content = document.getElementById('editBcContent').value.trim();
    const expiresInMinutes = document.getElementById('editBcExpiresIn').value;
    const expiresAt = document.getElementById('editBcExpiresAt').value;
    
    if (!subject || !content) return;
    
    // Prepare the update payload
    const updatePayload = { subject, content };
    
    // Add expiry information if provided
    if (expiresInMinutes) {
      updatePayload.expiresInMinutes = parseInt(expiresInMinutes);
    }
    if (expiresAt) {
      updatePayload.expiresAt = expiresAt;
    }
    
    try {
      console.log('Sending PUT request to:', `/api/messages/broadcast/${broadcast.id}`);
      console.log('Request payload:', updatePayload);
      
      const res = await fetch(`/api/messages/broadcast/${broadcast.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        modal.remove();
        await fetchBroadcasts();
        renderBroadcastsList();
        
        // Update the view if this broadcast is currently selected
        if (selectedBroadcastId === broadcast.id) {
          const updatedBroadcast = broadcasts.find(b => b.id === broadcast.id);
          if (updatedBroadcast) {
            renderBroadcastView(updatedBroadcast);
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update broadcast: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to update broadcast');
    }
  };
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
      expires: m.broadcastExpiresAt ? new Date(m.broadcastExpiresAt).toLocaleString() : '',
      originalData: m // Store the original data for editing
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
