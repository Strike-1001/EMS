// leaves.js - Employee Leaves Page Logic

document.addEventListener('DOMContentLoaded', function () {
  // Elements
  const leaveForm = document.getElementById('leave-form');
  const alertSection = document.getElementById('alert-section');
  const clearFiltersBtn = document.querySelector('.clear-filters-btn');
  const searchReason = document.getElementById('searchReason');
  const filterType = document.getElementById('filterType');
  const filterStart = document.getElementById('filterStart');
  const filterEnd = document.getElementById('filterEnd');

  // Handle Leave Form Submission
  if (leaveForm) {
    leaveForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // TODO: Validate and send leave request to backend
      showAlert('✅ Leave request submitted successfully!', 'success');
      leaveForm.reset();
    });
  }

  // Handle Clear Filters
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function () {
      searchReason.value = '';
      filterType.value = '';
      filterStart.value = '';
      filterEnd.value = '';
      // TODO: Reset table to show all data
    });
  }

  // Handle Search/Filter (stub)
  [searchReason, filterType, filterStart, filterEnd].forEach(function (el) {
    if (el) {
      el.addEventListener('input', function () {
        // TODO: Filter table rows based on input values
      });
    }
  });

  // Show alert messages
  function showAlert(message, type) {
    alertSection.innerHTML = `<div class="alert ${type === 'success' ? 'alert-success' : 'alert-error'}">${message}</div>`;
    setTimeout(() => {
      alertSection.innerHTML = '';
    }, 3500);
  }

  // Optionally: highlight sidebar nav item
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  const leavesNav = document.querySelector('.sidebar-nav .nav-item[data-section="leaves"]');
  if (leavesNav) leavesNav.classList.add('active');
});

// Optional: Export button stub
const exportBtn = document.querySelector('.export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', function () {
    // TODO: Implement export as PDF/CSV
    alert('Export feature coming soon!');
  });
}
