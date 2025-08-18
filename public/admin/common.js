// Common admin utilities: logout, profile name, and helpers
(function () {
  function getAuthHeaders() {
    try {
      const token = localStorage.getItem('adminToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch (_) {
      return {};
    }
  }

  async function handleLogoutClick(event) {
    if (event) event.preventDefault();
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders() }
      });
    } catch (_) {}
    try { localStorage.removeItem('adminToken'); } catch (_) {}
    try { localStorage.removeItem('adminInfo'); } catch (_) {}
    window.location.href = '/admin/login.html';
  }

  function setAdminName() {
    try {
      const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const el = document.getElementById('adminName');
      if (el && info?.name) el.textContent = info.name;
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogoutClick);
    setAdminName();
  });
})();


