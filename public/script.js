document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = 'http://localhost:3000/auth/api';

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    const data = await res.json();
    if (data.success && data.user && data.user.role) {
      if (data.user.role === 'admin') {
        window.location.href = '/admin/dashboard/dashboard.html';
      } else {
        window.location.href = '/user/dashboard/dashboard.html';
      }
    } else {
      alert(data.message || data.error || 'Login attempt completed');
    }
  });

  // Register
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    if (!name || !email || !password) {
      alert('Please enter all details');
      return;
    }
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    alert(data.message || data.error || 'Registration attempt completed');
  });

  // Get user info
  document.getElementById('getUserBtn').addEventListener('click', async () => {
    const res = await fetch(`${API_BASE}/user`, { credentials: 'include' });
    const data = await res.json();
    document.getElementById('userInfo').textContent = JSON.stringify(data, null, 2);
  });
});
