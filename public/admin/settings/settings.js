document.addEventListener('DOMContentLoaded', function() {
  // Prefill demo data
  document.getElementById('companyName').value = 'Acme Corporation';
  document.getElementById('workingHours').value = 8;
  document.getElementById('officeLocation').value = '123 Main St, Springfield';
  document.getElementById('smtpHost').value = 'smtp.acme.com';
  document.getElementById('smtpPort').value = 587;
  document.getElementById('emailUsername').value = 'admin@acme.com';

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
