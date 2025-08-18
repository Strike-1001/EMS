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
  const tbody = document.getElementById('leavesTableBody') || document.querySelector('.leaves-table tbody');
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
    const dateRange = `${new Date(leave.startDate).toISOString().split('T')[0]} → ${new Date(leave.endDate).toISOString().split('T')[0]}`;
    const typeLabel = leave.leaveType || 'N/A';
    const reason = leave.reason || '-';
    const status = leave.status || 'pending';
    const statusClass = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';

    tr.innerHTML = `
      <td>${name}</td>
      <td>${dateRange}</td>
      <td>${typeLabel}</td>
      <td>${reason}</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
      <td>
        ${status === 'pending' ? `
          <button class="btn btn-sm btn-success approve-leave-btn" data-id="${leave._id}">Approve</button>
          <button class="btn btn-sm btn-danger reject-leave-btn" data-id="${leave._id}">Reject</button>
        ` : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Event delegation for approve/reject
document.addEventListener('click', async (e) => {
  const approveBtn = e.target.closest('.approve-leave-btn');
  const rejectBtn = e.target.closest('.reject-leave-btn');
  if (!approveBtn && !rejectBtn) return;

  const id = (approveBtn || rejectBtn).getAttribute('data-id');
  const status = approveBtn ? 'approved' : 'rejected';
  const confirmMsg = approveBtn ? 'Approve this leave request?' : 'Reject this leave request?';
  if (!confirm(confirmMsg)) return;
  const comments = approveBtn ? '' : (prompt('Optional comment for rejection:', '') || '');
  try {
    const res = await fetch(`/api/leaves/${id}/status`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, comments })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update leave');
    await loadLeaveStats();
    await loadLeaves();
    alert(`Leave ${status} successfully`);
  } catch (err) {
    alert(err.message || 'Failed to update leave');
  }
});
