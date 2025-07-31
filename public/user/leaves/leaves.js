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
  const leaveHistoryTable = document.getElementById('leave-history-table');

  // Load leave history on page load
  loadLeaveHistory();

  // Handle Leave Form Submission
  if (leaveForm) {
    leaveForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const formData = new FormData(leaveForm);
      const data = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch('/api/leaves/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showAlert('✅ Leave request submitted successfully!', 'success');
          leaveForm.reset();
          loadLeaveHistory(); // Refresh the history
        } else {
          showAlert(`❌ Error: ${result.error}`, 'error');
        }
      } catch (error) {
        showAlert('❌ Network error. Please try again.', 'error');
      }
    });
  }

  // Load leave history
  async function loadLeaveHistory() {
    try {
      const response = await fetch('/api/leaves/history', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        renderLeaveHistory(result.leaves);
      } else {
        showAlert(`❌ Error loading leave history: ${result.error}`, 'error');
      }
    } catch (error) {
      showAlert('❌ Error loading leave history', 'error');
    }
  }

  // Render leave history table
  function renderLeaveHistory(leaves) {
    if (!leaveHistoryTable) return;
    
    const tbody = leaveHistoryTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!leaves || leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No leave history found</td></tr>';
      return;
    }
    
    leaves.forEach(leave => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${leave.leaveType}</td>
        <td>${new Date(leave.startDate).toLocaleDateString()}</td>
        <td>${new Date(leave.endDate).toLocaleDateString()}</td>
        <td>${leave.totalDays} days</td>
        <td>${leave.reason}</td>
        <td><span class="status-badge status-${leave.status}">${leave.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  // Handle Clear Filters
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function () {
      searchReason.value = '';
      filterType.value = '';
      filterStart.value = '';
      filterEnd.value = '';
      loadLeaveHistory(); // Reload all data
    });
  }

  // Handle Search/Filter
  [searchReason, filterType, filterStart, filterEnd].forEach(function (el) {
    if (el) {
      el.addEventListener('input', function () {
        // TODO: Implement client-side filtering
        // For now, just reload the data
        loadLeaveHistory();
      });
    }
  });

  // Show alert messages
  function showAlert(message, type) {
    if (!alertSection) return;
    
    alertSection.innerHTML = `<div class="alert ${type === 'success' ? 'alert-success' : 'alert-error'}">${message}</div>`;
    setTimeout(() => {
      alertSection.innerHTML = '';
    }, 3500);
  }

  // Highlight sidebar nav item
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  const leavesNav = document.querySelector('.sidebar-nav .nav-item[data-section="leaves"]');
  if (leavesNav) leavesNav.classList.add('active');
});

// Export button
const exportBtn = document.querySelector('.export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', function () {
    // TODO: Implement export as PDF/CSV
    alert('Export feature coming soon!');
  });
}
