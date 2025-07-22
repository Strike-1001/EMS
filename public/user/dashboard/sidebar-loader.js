// Dynamically load sidebar (inject only the .sidebar element)
fetch('../sidebar.html')
  .then(res => res.text())
  .then(html => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const sidebar = temp.querySelector('.sidebar');
    if (sidebar) {
      document.getElementById('sidebar-container').innerHTML = '';
      document.getElementById('sidebar-container').appendChild(sidebar);
    }
    // No eval! All logic should be in sidebar.js
  }); 