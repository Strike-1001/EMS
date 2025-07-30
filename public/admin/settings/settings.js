document.addEventListener('DOMContentLoaded', function() {
  // Prefill demo data
  document.getElementById('companyName').value = 'Velocis Core';
  document.getElementById('workingHours').value = 8;
  document.getElementById('officeLocation').value = 'Biratnagar';
  document.getElementById('smtpHost').value = 'smtp.velocis.com';
  document.getElementById('smtpPort').value = 587;
  document.getElementById('emailUsername').value = 'admin@velocis.com';

  // Demo save notification
  function showDemoAlert(msg) {
    alert(msg);
  }

  document.getElementById('generalSettingsForm').onsubmit = function(e) {
    e.preventDefault();
    showDemoAlert('Settings saved (demo only)');
  };
  document.getElementById('emailSettingsForm').onsubmit = function(e) {
    e.preventDefault();
    showDemoAlert('Email settings saved (demo only)');
  };
});
