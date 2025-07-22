document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = 'http://localhost:3000/auth/api';

  // Role selection logic
  let selectedRole = null;
  const roleBtns = document.querySelectorAll('.role-btn');
  const tabsContainer = document.querySelector('.tabs');
  const tabContents = document.querySelectorAll('.tab-content');
  const getUserBtn = document.getElementById('getUserBtn');
  const roleSelectContainer = document.getElementById('roleSelectContainer');

  roleBtns.forEach(btn => {
    btn.onclick = function() {
      selectedRole = btn.getAttribute('data-role');
      if (tabsContainer) tabsContainer.style.display = '';
      tabContents.forEach(tc => tc.style.display = '');
      if (getUserBtn) getUserBtn.style.display = '';
      if (roleSelectContainer) roleSelectContainer.style.display = 'none';
      // Set tab and content active state
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelector('.tab[data-tab="login"]').classList.add('active');
      document.getElementById('login').classList.add('active');
      document.getElementById('register').classList.remove('active');
      // Update button text
      document.getElementById('loginBtn').textContent = `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`;
      document.getElementById('registerBtn').textContent = `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`;
      // Update heading
      const heading = document.getElementById('authTestHeading');
      if (heading) {
        heading.textContent = selectedRole === 'admin' ? 'Auth Test Admin' : 'Auth Test Employee';
      }
    };
  });

  // Tabs
  const tabs = document.querySelectorAll('.tab');
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

  // Handles login/register form submissions with role awareness
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = async function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      if (!selectedRole) {
        alert('Please select a role first.');
        return;
      }
      // Example: send to /auth/api/login with role
      const res = await fetch('/auth/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole })
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (data.success && data.user && data.user.role) {
        if (data.user.role === 'admin') {
          window.location.href = '/admin/dashboard/dashboard.html';
        } else {
          window.location.href = '/user/dashboard/dashboard.html';
        }
      } else {
        alert(data.message || data.error || 'Login attempt completed');
      }
    };
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.onsubmit = async function(e) {
      e.preventDefault();
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const contact = document.getElementById('contact').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      const reqBody = { fullName, email, contact, password };
      try {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });
        const data = await res.json();
        if (res.ok) {
          alert('Registration successful! Please login.');
          window.location.href = 'login.html';
        } else {
          alert(data.message || data.error || 'Registration failed.');
        }
      } catch (err) {
        alert('An error occurred. Please try again.');
      }
    };
  }

  // Get user info
  if (getUserBtn) {
    getUserBtn.addEventListener('click', async () => {
      const res = await fetch(`${API_BASE}/user`, { credentials: 'include' });
      const data = await res.json();
      document.getElementById('userInfo').textContent = JSON.stringify(data, null, 2);
    });
  }
});
