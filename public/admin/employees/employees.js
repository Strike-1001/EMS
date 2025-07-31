const API_BASE = '/api/employees'; 

//dom
const employeesTableBody = document.getElementById('employeesTableBody');
const totalEmployees = document.getElementById('totalEmployees');
const activeEmployees = document.getElementById('activeEmployees');
const newEmployees = document.getElementById('newEmployees');
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
    const res = await fetch(API_BASE, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch employees');
    const data = await res.json();
    renderEmployees(data.employees);
    updateStats(data.employees);
  } catch (err) {
    employeesTableBody.innerHTML = `<tr><td colspan="7">Error loading employees</td></tr>`;
  } finally {
    hideLoading();
  }
}

function renderEmployees(employees) {
  console.log('Rendering employees:', employees);
  employeesTableBody.innerHTML = '';
  if (!employees.length) {
    employeesTableBody.innerHTML = '<tr><td colspan="8">No employees found</td></tr>';
    return;
  }
  employees.forEach(emp => {
    console.log('Processing employee:', emp);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${emp.employeeId || ''}</td>
      <td>${emp.firstName || emp.name || 'N/A'} ${emp.lastName || ''}</td>
      <td>${emp.email || 'N/A'}</td>
      <td>${emp.department || 'N/A'}</td>
      <td>${emp.position || 'N/A'}</td>
      <td>${emp.hireDate ? emp.hireDate.split('T')[0] : 'N/A'}</td>
      <td>${emp.status || 'Active'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editEmployee('${emp._id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp._id}')">Delete</button>
      </td>
    `;
    employeesTableBody.appendChild(tr);
  });
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
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
    const res = await fetch(`${API_BASE}/${id}`, { credentials: 'include' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch employee');
    const emp = result.employee;
    
    console.log('Employee data:', emp);
    
    document.getElementById('editEmployeeId').value = emp._id;
    document.getElementById('editFirstName').value = emp.firstName || '';
    document.getElementById('editLastName').value = emp.lastName || '';
    document.getElementById('editEmail').value = emp.email || '';
    document.getElementById('editContact').value = emp.contact || '';
    document.getElementById('editPhone').value = emp.phone || '';
    document.getElementById('editDepartment').value = emp.department || '';
    document.getElementById('editPosition').value = emp.position || '';
    document.getElementById('editHireDate').value = emp.hireDate ? emp.hireDate.split('T')[0] : '';
    document.getElementById('editSalary').value = emp.salary || '';
    document.getElementById('editStatus').value = emp.status || 'active';
    
    // Address fields
    document.getElementById('editStreet').value = emp.address?.street || '';
    document.getElementById('editCity').value = emp.address?.city || '';
    document.getElementById('editState').value = emp.address?.state || '';
    document.getElementById('editZipCode').value = emp.address?.zipCode || '';
    document.getElementById('editCountry').value = emp.address?.country || '';
    
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
      headers: { 'Content-Type': 'application/json' },
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
      credentials: 'include'
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

// ========== MODAL CLOSE BUTTONS ========== //
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = function() {
    closeModal(btn.closest('.modal').id);
  };
});

// ========== INITIAL LOAD ========== //
window.addEventListener('DOMContentLoaded', fetchEmployees);
