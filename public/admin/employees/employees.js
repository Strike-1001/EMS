const API_ORIGIN = (location.host.includes('localhost:3000') || location.port === '3000') ? '' : 'http://localhost:3000';
const API_BASE = `${API_ORIGIN}/api/employees`; 

// Auth header helper (use token from localStorage as fallback to cookies)
function getAuthHeaders() {
  try {
    const token = localStorage.getItem('adminToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

//dom
const employeesTableBody = document.getElementById('employeesTableBody');
const totalEmployees = document.getElementById('totalEmployees');
const activeEmployees = document.getElementById('activeEmployees');
const newEmployees = document.getElementById('newEmployees');
const pendingProfiles = document.getElementById('pendingProfiles');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const addEmployeeModal = document.getElementById('addEmployeeModal');
const addEmployeeForm = document.getElementById('addEmployeeForm');
const editEmployeeModal = document.getElementById('editEmployeeModal');
const editEmployeeForm = document.getElementById('editEmployeeForm');
const loadingSpinner = document.getElementById('loadingSpinner');

//helpers 
function showLoading() { loadingSpinner.style.display = 'flex'; }
function hideLoading() { loadingSpinner.style.display = 'none'; }
function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

//fetch Employees
async function fetchEmployees() {
  showLoading();
  try {
    const res = await fetch(API_BASE, {
      credentials: 'include',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch employees');
    const data = await res.json();
    
    // Store all employees globally
    window.allEmployees = data.employees;
    
    // Apply filters client-side
    const filteredEmployees = filterEmployees(data.employees);
    renderEmployees(filteredEmployees);
    updateStats(filteredEmployees);
  } catch (err) {
    employeesTableBody.innerHTML = `<tr><td colspan="7">Error loading employees</td></tr>`;
  } finally {
    hideLoading();
  }
}

// Client-side filtering function
function filterEmployees(employees) {
  const searchQuery = (document.getElementById('employeeSearch') || {}).value?.toLowerCase() || '';
  const departmentFilter = (document.getElementById('departmentFilter') || {}).value || '';
  const statusFilter = (document.getElementById('statusFilter') || {}).value || '';
  
  return employees.filter(emp => {
    // Search filter
    if (searchQuery) {
      const searchableText = [
        emp.firstName || emp.name || '',
        emp.lastName || '',
        emp.email || '',
        emp.employeeId || ''
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchQuery)) {
        return false;
      }
    }
    
    // Department filter
    if (departmentFilter && emp.department !== departmentFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter && emp.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
}

// Clear search function
function clearSearch() {
  const searchInput = document.getElementById('employeeSearch');
  if (searchInput) {
    searchInput.value = '';
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    
    // Re-apply filters
    const filteredEmployees = filterEmployees(window.allEmployees || []);
    renderEmployees(filteredEmployees);
    updateStats(filteredEmployees);
  }
}

// Clear all filters function
function clearAllFilters() {
  const searchInput = document.getElementById('employeeSearch');
  const departmentFilter = document.getElementById('departmentFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearSearchBtn = document.getElementById('clearSearch');
  
  if (searchInput) searchInput.value = '';
  if (departmentFilter) departmentFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (clearSearchBtn) clearSearchBtn.style.display = 'none';
  
  // Show all employees
  renderEmployees(window.allEmployees || []);
  updateStats(window.allEmployees || []);
}

// Update clear search button visibility
function updateClearSearchButton() {
  const searchInput = document.getElementById('employeeSearch');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput && clearBtn) {
    clearBtn.style.display = searchInput.value ? 'flex' : 'none';
  }
}

function renderEmployees(employees) {
  console.log('Rendering employees:', employees);
  employeesTableBody.innerHTML = '';
  
  // Update search results counter
  updateSearchResultsCounter(employees);
  
  if (!employees.length) {
    employeesTableBody.innerHTML = '<tr><td colspan="8" class="no-results">No employees found matching your search criteria</td></tr>';
    return;
  }
  
  employees.forEach(emp => {
    console.log('Processing employee:', emp);
    const tr = document.createElement('tr');
    const shortId = (emp.employeeId || '').toString().slice(0, 8);
    
    // Check if profile is incomplete
    const isIncomplete = !emp.department || !emp.position || !emp.hireDate || !emp.salary || emp.status === 'pending';
    const statusClass = isIncomplete ? 'status-pending' : `status-${emp.status?.toLowerCase() || 'active'}`;
    
    tr.innerHTML = `
      <td title="${emp.employeeId || ''}">${shortId}</td>
      <td>${emp.firstName || emp.name || 'N/A'} ${emp.lastName || ''}</td>
      <td>${emp.email || 'N/A'}</td>
      <td>${emp.department || '<span class="incomplete-field">Not Set</span>'}</td>
      <td>${emp.position || '<span class="incomplete-field">Not Set</span>'}</td>
      <td>${emp.hireDate ? emp.hireDate.split('T')[0] : '<span class="incomplete-field">Not Set</span>'}</td>
      <td><span class="status-tag ${statusClass}">${emp.status || 'Active'}</span></td>
      <td>
        ${isIncomplete ? 
          `<button type="button" class="btn btn-sm btn-warning complete-profile-btn" data-id="${emp._id}" data-employee="${emp.firstName || emp.name} ${emp.lastName || ''}">Complete Profile</button>` :
          `<button type="button" class="btn btn-sm btn-primary edit-employee-btn" data-id="${emp._id}">Edit</button>`
        }
        <button type="button" class="btn btn-sm btn-danger delete-employee-btn" data-id="${emp._id}">Delete</button>
      </td>
    `;
    employeesTableBody.appendChild(tr);
  });
  
  // Add event listeners for complete profile buttons
  addCompleteProfileListeners();
}

// Update search results counter
function updateSearchResultsCounter(filteredEmployees) {
  const searchResultsCount = document.getElementById('searchResultsCount');
  const totalResultsCount = document.getElementById('totalResultsCount');
  const totalEmployees = window.allEmployees?.length || 0;
  const filteredCount = filteredEmployees?.length || 0;
  
  if (searchResultsCount) {
    if (filteredCount === totalEmployees) {
      searchResultsCount.textContent = 'Showing all employees';
    } else {
      searchResultsCount.textContent = `Found ${filteredCount} employee${filteredCount !== 1 ? 's' : ''}`;
    }
  }
  
  if (totalResultsCount) {
    if (filteredCount !== totalEmployees) {
      totalResultsCount.textContent = `of ${totalEmployees} total`;
    } else {
      totalResultsCount.textContent = '';
    }
  }
}

function updateStats(employees) {
  totalEmployees.textContent = employees.length;
  activeEmployees.textContent = employees.filter(e => e.status === 'active' || e.status === 'Active').length;
  // New this month: hired in current month
  const now = new Date();
  newEmployees.textContent = employees.filter(e => {
    if (!e.hireDate) return false;
    const d = new Date(e.hireDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  
  // Pending profiles: incomplete or pending status
  pendingProfiles.textContent = employees.filter(e => 
    !e.department || !e.position || !e.hireDate || !e.salary || e.status === 'pending'
  ).length;
}

// add Employee
addEmployeeBtn.onclick = () => openModal('addEmployeeModal');
addEmployeeForm.onsubmit = async function(e) {
  e.preventDefault();
  showLoading();
  const formData = new FormData(addEmployeeForm);
  const data = Object.fromEntries(formData.entries());

  // Build address object
  data.address = { 
    street: data.street || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.zipCode || '',
    country: data.country || ''
  };

  // Remove address fields from data
  delete data.street;
  delete data.city;
  delete data.state;
  delete data.zipCode;
  delete data.country;

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({
        ...data,
        // Ensure backend required field `contact` exists
        contact: data.contact || data.phone || ''
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add employee');
    closeModal('addEmployeeModal');
    addEmployeeForm.reset();
    fetchEmployees();
    alert('Employee created successfully!');
  } catch (err) {
    alert('Error adding employee: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

// edit employee
window.editEmployee = async function(id) {
  console.log('Edit employee called with ID:', id);
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      credentials: 'include',
      headers: { ...getAuthHeaders() }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch employee');
    const emp = result.employee;
    
    console.log('Employee data:', emp);

    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? '';
    };

    setVal('editEmployeeId', emp._id);
    setVal('editFirstName', emp.firstName || '');
    setVal('editLastName', emp.lastName || '');
    setVal('editEmail', emp.email || '');
    setVal('editPhone', emp.phone || emp.contact || '');
    setVal('editDepartment', emp.department || '');
    setVal('editPosition', emp.position || '');
    setVal('editHireDate', emp.hireDate ? emp.hireDate.split('T')[0] : '');
    setVal('editSalary', emp.salary || '');
    setVal('editStatus', emp.status || 'active');

    // Address field (textarea in HTML: editAddress)
    const addressString = typeof emp.address === 'string'
      ? emp.address
      : [emp.address?.street, emp.address?.city, emp.address?.state, emp.address?.zipCode, emp.address?.country]
          .filter(Boolean)
          .join(', ');
    setVal('editAddress', addressString);

    openModal('editEmployeeModal');
  } catch (err) {
    console.error('Error in editEmployee:', err);
    alert('Error loading employee: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

editEmployeeForm.onsubmit = async function(e) {
  e.preventDefault();
  showLoading();
  const id = document.getElementById('editEmployeeId').value;
  const formData = new FormData(editEmployeeForm);
  const data = Object.fromEntries(formData.entries());
  
  // Build address object
  data.address = { 
    street: data.street || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.zipCode || '',
    country: data.country || ''
  };

  // Remove address fields from data
  delete data.street;
  delete data.city;
  delete data.state;
  delete data.zipCode;
  delete data.country;
  
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update employee');
    closeModal('editEmployeeModal');
    fetchEmployees();
    alert('Employee updated successfully!');
  } catch (err) {
    alert('Error updating employee: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

// DELETE EMPLOYEE
window.deleteEmployee = async function(id) {
  console.log('Delete employee called with ID:', id);
  if (!confirm('Are you sure you want to delete this employee?')) return;
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete employee');
    fetchEmployees();
    alert('Employee deleted successfully!');
  } catch (err) {
    console.error('Error in deleteEmployee:', err);
    alert('Error deleting employee');
  } finally {
    hideLoading();
  }
};

// Add event listeners for complete profile buttons
function addCompleteProfileListeners() {
  const completeProfileBtns = document.querySelectorAll('.complete-profile-btn');
  completeProfileBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const employeeId = this.getAttribute('data-id');
      const employeeName = this.getAttribute('data-employee');
      openCompleteProfileModal(employeeId, employeeName);
    });
  });
}

// Open complete profile modal
function openCompleteProfileModal(employeeId, employeeName) {
  // Create modal HTML
  const modalHTML = `
    <div id="completeProfileModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Complete Profile for ${employeeName}</h3>
          <span class="close" onclick="closeCompleteProfileModal()">&times;</span>
        </div>
        <form id="completeProfileForm">
          <div class="form-group">
            <label for="department">Department *</label>
            <select id="department" name="department" required>
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Support">Support</option>
            </select>
          </div>
          <div class="form-group">
            <label for="position">Position *</label>
            <input type="text" id="position" name="position" required placeholder="e.g., Software Developer">
          </div>
          <div class="form-group">
            <label for="hireDate">Hire Date *</label>
            <input type="date" id="hireDate" name="hireDate" required>
          </div>
          <div class="form-group">
            <label for="salary">Salary *</label>
            <input type="number" id="salary" name="salary" required placeholder="e.g., 75000">
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" name="status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Complete Profile</button>
            <button type="button" class="btn btn-secondary" onclick="closeCompleteProfileModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set default hire date to today
  const hireDateInput = document.getElementById('hireDate');
  if (hireDateInput) {
    hireDateInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Add form submit handler
  const form = document.getElementById('completeProfileForm');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    await completeEmployeeProfile(employeeId);
  });
  
  // Show modal
  document.getElementById('completeProfileModal').style.display = 'block';
}

// Close complete profile modal
function closeCompleteProfileModal() {
  const modal = document.getElementById('completeProfileModal');
  if (modal) {
    modal.remove();
  }
}

// Complete employee profile
async function completeEmployeeProfile(employeeId) {
  try {
    const form = document.getElementById('completeProfileForm');
    const formData = new FormData(form);
    
    const data = {
      department: formData.get('department'),
      position: formData.get('position'),
      hireDate: formData.get('hireDate'),
      salary: Number(formData.get('salary')),
      status: formData.get('status')
    };
    
    const res = await fetch(`${API_BASE}/${employeeId}/complete-profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to complete profile');
    }
    
    const result = await res.json();
    alert('Profile completed successfully!');
    
    // Close modal and refresh data
    closeCompleteProfileModal();
    await fetchEmployees();
    
  } catch (error) {
    console.error('Complete profile error:', error);
    alert(error.message || 'Failed to complete profile');
  }
}

// ========== MODAL CLOSE BUTTONS ========== //
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = function() {
    closeModal(btn.closest('.modal').id);
  };
});

// ========== INITIAL LOAD ========== //
window.addEventListener('DOMContentLoaded', () => {
  // failsafe to ensure spinner never blocks UI
  try { hideLoading(); } catch (_) {}
  fetchEmployees();
  
  // Bind filters with debouncing for search
  const searchInput = document.getElementById('employeeSearch');
  const departmentFilter = document.getElementById('departmentFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearSearchBtn = document.getElementById('clearSearch');
  
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        updateClearSearchButton(); // Update button visibility on search input
        const filteredEmployees = filterEmployees(window.allEmployees || []);
        renderEmployees(filteredEmployees);
        updateStats(filteredEmployees);
      }, 300);
    });
  }
  
  if (departmentFilter) {
    departmentFilter.addEventListener('change', () => {
      updateClearSearchButton(); // Update button visibility on filter change
      const filteredEmployees = filterEmployees(window.allEmployees || []);
      renderEmployees(filteredEmployees);
      updateStats(filteredEmployees);
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      updateClearSearchButton(); // Update button visibility on filter change
      const filteredEmployees = filterEmployees(window.allEmployees || []);
      renderEmployees(filteredEmployees);
      updateStats(filteredEmployees);
    });
  }

  // Clear search button listener
  if (clearSearchBtn) {
    clearSearchBtn.onclick = clearSearch;
  }

  // Clear all filters button listener
  const clearAllFiltersBtn = document.getElementById('clearAllFilters');
  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.onclick = clearAllFilters;
  }
});

// Hide spinner on unexpected errors
window.addEventListener('error', () => { try { hideLoading(); } catch (_) {} });
window.addEventListener('unhandledrejection', () => { try { hideLoading(); } catch (_) {} });

// Event delegation for action buttons
employeesTableBody.addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-employee-btn');
  const deleteBtn = event.target.closest('.delete-employee-btn');
  if (editBtn) {
    const id = editBtn.getAttribute('data-id');
    if (id) window.editEmployee(id);
  } else if (deleteBtn) {
    const id = deleteBtn.getAttribute('data-id');
    if (id) window.deleteEmployee(id);
  }
});
