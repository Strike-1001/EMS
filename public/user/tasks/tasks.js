// User Tasks JavaScript - Real Data Implementation

// Global variables
let currentTasks = [];
let currentStats = { total: 0, completed: 0, inProgress: 0, pending: 0 };

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing user tasks...');
    
    // Load initial tasks data
    loadUserTasks();
    
    // Setup filters and event listeners
    setupFilters();
    setupExport();
    
    // Highlight sidebar nav item
    highlightSidebarNav();
});

// Load user tasks from backend
async function loadUserTasks() {
    try {
        const response = await fetch('/api/tasks/employee/tasks', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentTasks = data.tasks || [];
            updateTaskStats();
            renderTasksTable();
            console.log(`Loaded ${currentTasks.length} tasks`);
        } else {
            throw new Error(data.error || 'Failed to load tasks');
        }
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAlert(`Failed to load tasks: ${error.message}`, 'error');
        clearTasksTable();
        updateTaskStats();
    }
}

// Update task statistics
function updateTaskStats() {
    const total = currentTasks.length;
    const completed = currentTasks.filter(task => task.status === 'completed').length;
    const inProgress = currentTasks.filter(task => task.status === 'in-progress').length;
    const pending = currentTasks.filter(task => ['pending', 'cancelled'].includes(task.status)).length;
    
    currentStats = { total, completed, inProgress, pending };
    
    // Update display
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const inProgressTasksEl = document.getElementById('inProgressTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    
    if (totalTasksEl) totalTasksEl.textContent = `${total} Tasks`;
    if (completedTasksEl) completedTasksEl.textContent = `${completed} Tasks`;
    if (inProgressTasksEl) inProgressTasksEl.textContent = `${inProgress} Tasks`;
    if (pendingTasksEl) pendingTasksEl.textContent = `${pending} Tasks`;
}

// Render tasks table with real data
function renderTasksTable() {
    const tableBody = document.getElementById('taskTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (currentTasks.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="empty-state">
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; color: #d1d5db;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">No tasks assigned to you yet</p>
                    <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Tasks assigned by admins will appear here</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
    return;
  }
    
    currentTasks.forEach(task => {
        const row = createTaskRow(task);
        tableBody.appendChild(row);
    });
    
    addTaskButtonListeners();
}

// Create task table row
function createTaskRow(task) {
    const row = document.createElement('tr');
    
    const assignedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const priorityClass = `priority-badge priority-${task.priority || 'medium'}`;
    const priorityText = task.priority ? 
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 
        'Medium';
    
    const statusClass = `status-badge status-${task.status || 'pending'}`;
    const statusText = task.status ? 
        task.status.charAt(0).toUpperCase() + task.status.slice(1) : 
        'Pending';
    
    let buttonText = 'View Details';
    let buttonClass = 'btn btn-primary btn-sm';
    
    if (task.status === 'pending') {
        buttonText = 'Start Task';
        buttonClass = 'btn btn-success btn-sm';
    } else if (task.status === 'in-progress') {
        buttonText = 'Update Progress';
        buttonClass = 'btn btn-warning btn-sm';
    } else if (task.status === 'completed') {
        buttonText = 'View Details';
        buttonClass = 'btn btn-info btn-sm';
    }
    
    row.innerHTML = `
        <td>${task.title}</td>
        <td>${assignedDate}</td>
        <td>${dueDate}</td>
        <td><span class="${priorityClass}">${priorityText}</span></td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>
            <button class="${buttonClass} view-task-btn" data-id="${task._id}">
                ${buttonText}
            </button>
      </td>
    `;
    
    return row;
}

// Clear tasks table
function clearTasksTable() {
    const tableBody = document.getElementById('taskTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    currentTasks = [];
    currentStats = { total: 0, completed: 0, inProgress: 0, pending: 0 };
}

// Add event listeners to task buttons
function addTaskButtonListeners() {
    const viewButtons = document.querySelectorAll('.view-task-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-id');
            openTaskModal(taskId);
    });
  });
}

// Open task modal
async function openTaskModal(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const task = data.task;
            showTaskModal(task);
    } else {
            throw new Error(data.error || 'Failed to load task details');
        }
        
    } catch (error) {
        console.error('Error loading task details:', error);
        showAlert(`Failed to load task details: ${error.message}`, 'error');
    }
}

// Show task modal
function showTaskModal(task) {
  const modal = document.getElementById('taskModal');
  const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) return;
    
    const assignedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const assignedBy = task.assignedBy ? 
        (task.assignedBy.name || task.assignedBy.email || 'Admin') : 
        'Admin';
    
  modalBody.innerHTML = `
    <div class="mb-3">
      <div class="text-lg font-semibold mb-1">${task.title}</div>
            <div class="text-sm text-gray-500 mb-2">Assigned by: <b>${assignedBy}</b></div>
      <div class="mb-2">${task.description}</div>
      <div class="flex gap-2 mb-2">
                <div class="priority-badge priority-${task.priority || 'medium'}">${task.priority || 'Medium'}</div>
                <div class="status-badge status-${task.status || 'pending'}">${task.status || 'Pending'}</div>
      </div>
            <div class="text-xs text-gray-500 mb-2">Assigned: ${assignedDate} | Due: ${dueDate}</div>
    </div>
    <div class="mb-3">
      <label for="statusSelect" class="block text-sm font-medium mb-1">Status</label>
      <select id="statusSelect" class="border px-3 py-2 rounded-md text-sm w-full">
                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
    </div>
    <div class="mb-3">
      <label for="commentBox" class="block text-sm font-medium mb-1">Add Comment/Note</label>
      <textarea id="commentBox" class="border px-3 py-2 rounded-md text-sm w-full" rows="2" placeholder="Add a comment..."></textarea>
    </div>
    <div class="flex justify-end gap-2">
      <button id="updateTaskBtn" class="btn btn-primary">Update Task</button>
    </div>
    <div class="mt-4">
      <div class="font-semibold mb-1">Comments</div>
      <div class="text-sm">
                ${(task.comments && task.comments.length) ? 
                    task.comments.map(c => `<div class="mb-1"><b>${c.user?.name || 'Unknown'}:</b> ${c.comment}</div>`).join('') : 
                    '<span class="text-gray-400">No comments yet.</span>'}
      </div>
    </div>
  `;
    
  modal.style.display = 'block';
    
    // Setup close functionality
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
    
    // Close on outside click
  window.onclick = function(event) {
    if (event.target === modal) modal.style.display = 'none';
  };
    
    // Setup update functionality
    const updateBtn = document.getElementById('updateTaskBtn');
    if (updateBtn) {
        updateBtn.onclick = () => updateTaskStatus(task._id);
    }
}

// Update task status
async function updateTaskStatus(taskId) {
    try {
    const newStatus = document.getElementById('statusSelect').value;
    const newComment = document.getElementById('commentBox').value.trim();
        
        const updateData = { status: newStatus };
    if (newComment) {
            updateData.comments = newComment;
        }
        
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Close modal
            const modal = document.getElementById('taskModal');
            if (modal) modal.style.display = 'none';
            
            // Reload tasks
            await loadUserTasks();
            
            // Show success message
            showAlert('✅ Task updated successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to update task');
        }
        
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert(`Failed to update task: ${error.message}`, 'error');
    }
}

// Setup filters
function setupFilters() {
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const searchInput = document.getElementById('searchInput');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTasks);
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', filterTasks);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTasks);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

// Filter tasks
function filterTasks() {
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (!statusFilter || !priorityFilter || !searchInput) return;
    
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    const search = searchInput.value.toLowerCase();
    
    const filtered = currentTasks.filter(task => {
        let match = true;
        
        if (status && task.status !== status) match = false;
        if (priority && task.priority !== priority) match = false;
        if (search && !task.title.toLowerCase().includes(search)) match = false;
        
        return match;
    });
    
    renderFilteredTasks(filtered);
}

// Render filtered tasks
function renderFilteredTasks(tasks) {
    const tableBody = document.getElementById('taskTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (tasks.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="empty-state">
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: #d1d5db;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">No tasks match your filters</p>
                    <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Try adjusting your search criteria</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    tasks.forEach(task => {
        const row = createTaskRow(task);
        tableBody.appendChild(row);
    });
    
    addTaskButtonListeners();
}

// Clear filters
function clearFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) statusFilter.value = '';
    if (priorityFilter) priorityFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    renderTasksTable();
}

// Setup export functionality
function setupExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTasksToCSV);
    }
}

// Export tasks to CSV
function exportTasksToCSV() {
    if (currentTasks.length === 0) {
        showAlert('No tasks to export', 'info');
        return;
    }
    
    let csv = 'Title,Assigned Date,Due Date,Priority,Status,Description\n';
    currentTasks.forEach(task => {
        const assignedDate = new Date(task.createdAt).toLocaleDateString();
        const dueDate = new Date(task.dueDate).toLocaleDateString();
        const description = task.description.replace(/"/g, '""');
        csv += `"${task.title}","${assignedDate}","${dueDate}","${task.priority}","${task.status}","${description}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_tasks.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('✅ Tasks exported to CSV successfully!', 'success');
}

// Show alert messages
function showAlert(message, type = 'info') {
    const alertSection = document.getElementById('alert-section');
    if (!alertSection) return;
    
    alertSection.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertSection.innerHTML = '';
    }, 3500);
}

// Highlight sidebar navigation
function highlightSidebarNav() {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (item) {
        item.classList.remove('active');
    });
    const tasksNav = document.querySelector('.sidebar-nav .nav-item[data-section="tasks"]');
    if (tasksNav) tasksNav.classList.add('active');
}
