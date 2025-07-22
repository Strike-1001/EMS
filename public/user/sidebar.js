
  function setActiveSidebarNav() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    // Determine current page section by filename
    const currentPage = window.location.pathname.split('/').pop().split('.')[0];
    navLinks.forEach(item => {
      item.classList.remove('active');
      const section = item.getAttribute('data-section');
      if (section && section === currentPage) {
        item.classList.add('active');
      }
    });
  }

  function setLogoutHandler() {
    const logoutNav = document.getElementById('logoutNav');
    if (logoutNav) {
      logoutNav.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
          await fetch('/api/user/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {}
        window.location.href = '/user/login.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setActiveSidebarNav();
    setLogoutHandler();
  });
  // Also run immediately (for dynamic sidebar injection)
  setActiveSidebarNav();
  setLogoutHandler();
