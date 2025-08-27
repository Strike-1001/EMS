document.addEventListener('DOMContentLoaded', () => {
  loadLeaveStats();
  loadLeaves();
  const statusFilter = document.getElementById('leaveStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadLeaves());
  }
});

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('adminToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

async function loadLeaveStats() {
  try {
    const res = await fetch('/api/leaves/stats', { credentials: 'include', headers: { ...getAuthHeaders() } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load leave stats');

    const total = document.querySelectorAll('.leaves-stats .stat-card .stat-value')[0];
    const approved = document.querySelectorAll('.leaves-stats .stat-card .stat-value')[1];
    const pending = document.querySelectorAll('.leaves-stats .stat-card .stat-value')[2];
    const rejected = document.querySelectorAll('.leaves-stats .stat-card .stat-value')[3];

    const stats = data.stats || [];
    const getCount = (k) => stats.find(s => s._id === k)?.count || 0;

    if (total) total.textContent = data.totalRequests ?? 0;
    if (approved) approved.textContent = getCount('approved');
    if (pending) pending.textContent = getCount('pending');
    if (rejected) rejected.textContent = getCount('rejected');
  } catch (e) {
    console.error('Leave stats error:', e);
  }
}

async function loadLeaves() {
  try {
    const status = document.getElementById('leaveStatusFilter')?.value || '';
    const url = status ? `/api/leaves?status=${encodeURIComponent(status)}` : '/api/leaves';
    const res = await fetch(url, { credentials: 'include', headers: { ...getAuthHeaders() } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load leaves');

    renderLeavesTable(data.leaves || []);
  } catch (e) {
    console.error('Leaves load error:', e);
  }
}

function renderLeavesTable(leaves) {
  const tbody = document.getElementById('leavesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!leaves.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No leaves found</td></tr>';
    return;
  }

  leaves.forEach(leave => {
    const tr = document.createElement('tr');
    const user = leave.employeeId;
    const name = user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() : 'N/A';
    const startDate = new Date(leave.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const endDate = new Date(leave.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const totalDays = leave.totalDays || 0;
    const reason = leave.reason || '-';
    const status = leave.status || 'pending';
    const statusClass = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';

    tr.innerHTML = `
      <td>${name}</td>
      <td>${startDate}</td>
      <td>${endDate}</td>
      <td>${totalDays} day${totalDays !== 1 ? 's' : ''}</td>
      <td>${reason}</td>
      <td><span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td>
        ${status === 'pending' ? `
          <button class="btn btn-sm btn-success approve-leave-btn" data-id="${leave._id}">Approve</button>
          <button class="btn btn-sm btn-danger reject-leave-btn" data-id="${leave._id}">Reject</button>
        ` : ''}
        <button class="btn btn-sm btn-danger delete-leave-btn" data-id="${leave._id}" data-employee="${name}" data-start="${startDate}" data-end="${endDate}" data-reason="${reason}" data-status="${status}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Event delegation for approve/reject/delete
document.addEventListener('click', async (e) => {
  const approveBtn = e.target.closest('.approve-leave-btn');
  const rejectBtn = e.target.closest('.reject-leave-btn');
  const deleteBtn = e.target.closest('.delete-leave-btn');
  
  if (!approveBtn && !rejectBtn && !deleteBtn) return;

  if (deleteBtn) {
    // Handle delete
    const leaveId = deleteBtn.getAttribute('data-id');
    const employeeName = deleteBtn.getAttribute('data-employee');
    const startDate = deleteBtn.getAttribute('data-start');
    const endDate = deleteBtn.getAttribute('data-end');
    const reason = deleteBtn.getAttribute('data-reason');
    const status = deleteBtn.getAttribute('data-status');
    
    if (confirm(`Are you sure you want to delete the leave record for ${employeeName}?\n\nThis action will permanently delete the record.`)) {
      await deleteLeaveRecord(leaveId, employeeName, startDate, endDate, reason, status);
    }
    return;
  }

  const id = (approveBtn || rejectBtn).getAttribute('data-id');
  const status = approveBtn ? 'approved' : 'rejected';
  const action = approveBtn ? 'Approve' : 'Reject';
  
  // Show remarks modal
  showRemarksModal(id, status, action);
});

// Show remarks modal for approve/reject
function showRemarksModal(leaveId, status, action) {
  // Remove existing modals
  const existingModal = document.querySelector('.remarks-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.className = 'remarks-modal';
  modal.innerHTML = `
    <div class="remarks-modal-content">
      <div class="remarks-modal-header">
        <h3>${action} Leave Request</h3>
        <button class="remarks-modal-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="remarks-modal-body">
        <div class="form-group">
          <label for="remarksInput">${action === 'Approve' ? 'Optional Remarks' : 'Rejection Reason (Required)'}</label>
          <textarea 
            id="remarksInput" 
            rows="3" 
            placeholder="${action === 'Approve' ? 'Add any additional comments...' : 'Please provide a reason for rejection...'}"
            ${action === 'Reject' ? 'required' : ''}
          ></textarea>
        </div>
        <div class="remarks-modal-actions">
          <button class="btn btn-secondary remarks-cancel-btn">Cancel</button>
          <button class="btn ${action === 'Approve' ? 'btn-success' : 'btn-danger'} remarks-submit-btn" data-leave-id="${leaveId}" data-status="${status}">
            ${action} Leave
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add styles
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners for modal buttons
  const closeBtn = modal.querySelector('.remarks-modal-close');
  const cancelBtn = modal.querySelector('.remarks-cancel-btn');
  const submitBtn = modal.querySelector('.remarks-submit-btn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => modal.remove());
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const remarksInput = modal.querySelector('#remarksInput');
      const remarks = remarksInput ? remarksInput.value.trim() : '';
      
      // Validate remarks for rejection
      if (status === 'rejected' && !remarks) {
        alert('Please provide a reason for rejection.');
        return;
      }
      
      submitLeaveAction(leaveId, status, remarks, modal);
    });
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close modal on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Focus on textarea
  setTimeout(() => {
    const textarea = modal.querySelector('#remarksInput');
    if (textarea) textarea.focus();
  }, 100);
}

// Submit leave action with remarks
async function submitLeaveAction(leaveId, status, remarks, modal) {
  try {
    console.log('Submitting leave action:', { leaveId, status, remarks });
    
    // Validate inputs
    if (!leaveId) {
      throw new Error('Leave ID is required');
    }
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status');
    }
    
    // Validate remarks for rejection
    if (status === 'rejected' && !remarks) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    console.log('Making API call to:', `/api/leaves/${leaveId}/status`);
    
    const requestBody = { 
      status, 
      comments: remarks || '' 
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(`/api/leaves/${leaveId}/status`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json', 
        ...getAuthHeaders() 
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Close modal
    if (modal) modal.remove();
    
    // Reload data
    await loadLeaveStats();
    await loadLeaves();
    
    // Show success message
    showNotification(`Leave request ${status} successfully`, 'success');
    
  } catch (err) {
    console.error('Error updating leave:', err);
    showNotification(`Failed to update leave: ${err.message}`, 'error');
    
    // Don't close modal on error so user can try again
  }
}

// Delete leave record
async function deleteLeaveRecord(leaveId, employeeName, startDate, endDate, reason, status) {
  console.log(`Permanently deleting leave record: ${leaveId} for ${employeeName}`);
  
  try {
    const res = await fetch(`/api/leaves/${leaveId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete leave');

    await loadLeaveStats();
    await loadLeaves();
    showNotification(`Leave record for ${employeeName} permanently deleted`, 'success');
  } catch (err) {
    alert(err.message || 'Failed to delete leave');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}