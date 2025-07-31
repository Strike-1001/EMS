const API_BASE = '/api/tasks';

// DOM elements
const tasksTableBody = document.getElementById('tasksTableBody');
const totalTasks = document.getElementById('totalTasks');
const pendingTasks = document.getElementById('pendingTasks');
const completedTasks = document.getElementById('completedTasks');
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskModal = document.getElementById('addTaskModal');
const addTaskForm = document.getElementById('addTaskForm');
const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const loadingSpinner = document.getElementById('loadingSpinner');

// Helpers
function showLoading() { loadingSpinner.style.display = 'flex'; }
function hideLoading() { loadingSpinner.style.display = 'none'; }
function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Fetch tasks
async function fetchTasks() {
  showLoading();
  try {
    const res = await fetch(API_BASE, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    renderTasks(data.tasks);
    updateStats(data.tasks);
  } catch (err) {
    tasksTableBody.innerHTML = `<tr><td colspan="7">Error loading tasks</td></tr>`;
  } finally {
    hideLoading();
  }
}

function renderTasks(tasks) {
  tasksTableBody.innerHTML = '';
  if (!tasks.length) {
    tasksTableBody.innerHTML = '<tr><td colspan="7">No tasks found</td></tr>';
    return;
  }
  tasks.forEach(task => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>${task.description}</td>
      <td>${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}</td>
      <td>${task.priority}</td>
      <td>${task.status}</td>
      <td>${task.dueDate ? task.dueDate.split('T')[0] : ''}</td>
      <td>${task.progress || 0}%</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editTask('${task._id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
      </td>
    `;
    tasksTableBody.appendChild(tr);
  });
}

function updateStats(tasks) {
  totalTasks.textContent = tasks.length;
  pendingTasks.textContent = tasks.filter(t => t.status === 'pending').length;
  completedTasks.textContent = tasks.filter(t => t.status === 'completed').length;
}

// Add task
addTaskBtn.onclick = () => openModal('addTaskModal');
addTaskForm.onsubmit = async function(e) {
  e.preventDefault();
  showLoading();
  const formData = new FormData(addTaskForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add task');
    closeModal('addTaskModal');
    addTaskForm.reset();
    fetchTasks();
    alert('Task created successfully!');
  } catch (err) {
    alert('Error adding task: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

// Edit task
window.editTask = async function(id) {
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/${id}`, { credentials: 'include' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch task');
    const task = result.task;
    
    document.getElementById('editTaskId').value = task._id;
    document.getElementById('editTitle').value = task.title || '';
    document.getElementById('editDescription').value = task.description || '';
    document.getElementById('editAssignedTo').value = task.assignedTo?._id || '';
    document.getElementById('editPriority').value = task.priority || 'medium';
    document.getElementById('editStatus').value = task.status || 'pending';
    document.getElementById('editDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
    document.getElementById('editProgress').value = task.progress || 0;
    
    openModal('editTaskModal');
  } catch (err) {
    alert('Error loading task: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

editTaskForm.onsubmit = async function(e) {
  e.preventDefault();
  showLoading();
  const id = document.getElementById('editTaskId').value;
  const formData = new FormData(editTaskForm);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update task');
    closeModal('editTaskModal');
    fetchTasks();
    alert('Task updated successfully!');
  } catch (err) {
    alert('Error updating task: ' + (err.message || 'Unknown error'));
  } finally {
    hideLoading();
  }
};

// Delete task
window.deleteTask = async function(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to delete task');
    fetchTasks();
    alert('Task deleted successfully!');
  } catch (err) {
    alert('Error deleting task');
  } finally {
    hideLoading();
  }
};

// Load employees for assignment dropdown
async function loadEmployees() {
  try {
    const res = await fetch('/api/employees', { credentials: 'include' });
    const data = await res.json();
    const assignedToSelect = document.getElementById('assignedTo');
    const editAssignedToSelect = document.getElementById('editAssignedTo');
    
    if (assignedToSelect) {
      assignedToSelect.innerHTML = '<option value="">Select Employee</option>';
      data.employees.forEach(emp => {
        assignedToSelect.innerHTML += `<option value="${emp._id}">${emp.firstName} ${emp.lastName}</option>`;
      });
    }
    
    if (editAssignedToSelect) {
      editAssignedToSelect.innerHTML = '<option value="">Select Employee</option>';
      data.employees.forEach(emp => {
        editAssignedToSelect.innerHTML += `<option value="${emp._id}">${emp.firstName} ${emp.lastName}</option>`;
      });
    }
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

// Modal close buttons
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = function() {
    closeModal(btn.closest('.modal').id);
  };
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
  loadEmployees();
});
