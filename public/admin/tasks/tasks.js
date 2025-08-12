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
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || '';
    
    let url = API_BASE;
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (priorityFilter) params.append('priority', priorityFilter);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    
    if (data.success && data.tasks) {
      renderTasks(data.tasks);
      updateStats(data.tasks);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
    tasksTableBody.innerHTML = `<tr><td colspan="7">Error loading tasks: ${err.message}</td></tr>`;
  } finally {
    hideLoading();
  }
}

function renderTasks(tasks) {
  console.log('Rendering tasks:', tasks);
  tasksTableBody.innerHTML = '';
  if (!tasks.length) {
    tasksTableBody.innerHTML = '<tr><td colspan="7">No tasks found</td></tr>';
    return;
  }
  tasks.forEach(task => {
    const tr = document.createElement('tr');
    
    // Get assigned user name
    const assignedToName = task.assignedTo ? 
      `${task.assignedTo.firstName || task.assignedTo.name || ''} ${task.assignedTo.lastName || ''}`.trim() : 
      'Unassigned';
    
    // Format priority badge
    const priorityClass = task.priority ? `priority-badge ${task.priority.toLowerCase()}` : '';
    const priorityBadge = task.priority ? `<span class="${priorityClass}">${task.priority}</span>` : 'N/A';
    
    // Format status badge
    const statusClass = task.status ? `status-badge ${task.status.toLowerCase().replace(' ', '-')}` : '';
    const statusBadge = task.status ? `<span class="${statusClass}">${task.status}</span>` : 'N/A';
    
    // Format due date
    const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'N/A';
    
    // Format progress
    const progress = task.progress !== undefined ? `${task.progress}%` : '0%';
    
    tr.innerHTML = `
      <td>${task.title || 'N/A'}</td>
      <td>${assignedToName}</td>
      <td>${priorityBadge}</td>
      <td>${dueDate}</td>
      <td>${progress}</td>
      <td>${statusBadge}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-primary" onclick="editTask('${task._id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
      </td>
    `;
    tasksTableBody.appendChild(tr);
  });
}

function updateStats(tasks) {
  console.log('Updating stats with tasks:', tasks);
  totalTasks.textContent = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  pendingTasks.textContent = pendingCount;
  completedTasks.textContent = completedCount;
  console.log(`Stats: Total=${tasks.length}, Pending=${pendingCount}, Completed=${completedCount}`);
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
    await fetchTasks(); // Wait for tasks to refresh
    alert('Task created successfully!');
  } catch (err) {
    console.error('Error adding task:', err);
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
    
    console.log('Loaded task for editing:', task);
    
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
  
  // Remove the taskId field from data since it's not needed in the backend
  delete data.taskId;
  
  // Ensure status is properly set
  if (data.status === 'completed' && data.progress < 100) {
    data.progress = 100; // Auto-set progress to 100% when status is completed
  }
  
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
    await fetchTasks(); // Wait for tasks to refresh
    alert('Task updated successfully!');
  } catch (err) {
    console.error('Error updating task:', err);
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
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete task');
    await fetchTasks(); // Wait for tasks to refresh
    alert('Task deleted successfully!');
  } catch (err) {
    console.error('Error deleting task:', err);
    alert('Error deleting task: ' + (err.message || 'Unknown error'));
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

// Filter functionality
document.getElementById('taskStatusFilter')?.addEventListener('change', () => {
  fetchTasks();
});

document.getElementById('taskPriorityFilter')?.addEventListener('change', () => {
  fetchTasks();
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, fetching tasks and employees...');
  fetchTasks();
  loadEmployees();
});
