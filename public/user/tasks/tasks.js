// Demo data for tasks
const demoTasks = [
  {
    id: 1,
    title: 'Update CMS UI',
    assignedDate: '2025-07-10',
    dueDate: '2025-07-15',
    priority: 'High',
    status: 'In Progress',
    description: 'Update the content management system user interface as per new guidelines.',
    assignedBy: 'Admin',
    attachments: [],
    comments: [
      { user: 'Admin', text: 'Please finish by Friday.' }
    ]
  },
  {
    id: 2,
    title: 'Write Report',
    assignedDate: '2025-07-12',
    dueDate: '2025-07-20',
    priority: 'Medium',
    status: 'Pending',
    description: 'Draft the quarterly performance report for your department.',
    assignedBy: 'Manager',
    attachments: [],
    comments: []
  },
  {
    id: 3,
    title: 'Attend Meeting',
    assignedDate: '2025-07-05',
    dueDate: '2025-07-05',
    priority: 'Low',
    status: 'Completed',
    description: 'Participate in the monthly team meeting.',
    assignedBy: 'HR',
    attachments: [],
    comments: [
      { user: 'HR', text: 'Thanks for attending!' }
    ]
  },
  {
    id: 4,
    title: 'Review PR #42',
    assignedDate: '2025-07-13',
    dueDate: '2025-07-16',
    priority: 'High',
    status: 'Review',
    description: 'Review the pull request for the new feature implementation.',
    assignedBy: 'Lead Dev',
    attachments: [],
    comments: []
  },
  {
    id: 5,
    title: 'Fix Login Bug',
    assignedDate: '2025-07-09',
    dueDate: '2025-07-11',
    priority: 'High',
    status: 'Pending',
    description: 'Resolve the login issue reported by users.',
    assignedBy: 'QA',
    attachments: [],
    comments: []
  },
  {
    id: 6,
    title: 'Update Documentation',
    assignedDate: '2025-07-01',
    dueDate: '2025-07-10',
    priority: 'Medium',
    status: 'Completed',
    description: 'Update the project documentation for the latest release.',
    assignedBy: 'Admin',
    attachments: [],
    comments: []
  }
];

const statusMap = {
  'Pending': { badge: 'pending', label: 'Pending', icon: '🟡' },
  'In Progress': { badge: 'in-progress', label: 'In Progress', icon: '🔴' },
  'Review': { badge: 'review', label: 'Review', icon: '🟣' },
  'Completed': { badge: 'completed', label: 'Completed', icon: '✅' }
};
const priorityMap = {
  'High': { badge: 'high', icon: '🔴' },
  'Medium': { badge: 'medium', icon: '🟡' },
  'Low': { badge: 'low', icon: '🟢' }
};

// --- Utility functions ---
function countTasksByStatus(status) {
  return demoTasks.filter(t => t.status === status).length;
}
function countTasksByStatuses(statuses) {
  return demoTasks.filter(t => statuses.includes(t.status)).length;
}
function filterTasks({ status, priority, search }) {
  return demoTasks.filter(task => {
    let match = true;
    if (status && task.status !== status) match = false;
    if (priority && task.priority !== priority) match = false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) match = false;
    return match;
  });
}

// --- Render summary cards ---
function renderSummaryCards() {
  document.getElementById('totalTasks').textContent = demoTasks.length + ' Tasks';
  document.getElementById('completedTasks').textContent = countTasksByStatus('Completed') + ' Tasks';
  document.getElementById('inProgressTasks').textContent = countTasksByStatus('In Progress') + ' Tasks';
  document.getElementById('pendingTasks').textContent = countTasksByStatuses(['Pending', 'Review']) + ' Tasks';
}

// --- Render table ---
function renderTable(tasks) {
  const tbody = document.getElementById('taskTableBody');
  tbody.innerHTML = '';
  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-500">No tasks found.</td></tr>';
    return;
  }
  tasks.forEach(task => {
    const tr = document.createElement('tr');
    tr.className = 'border-b text-sm hover:bg-gray-50';
    tr.innerHTML = `
      <td class="p-3">${task.title}</td>
      <td class="p-3">${task.assignedDate}</td>
      <td class="p-3">${task.dueDate}</td>
      <td class="p-3"><span class="priority-badge ${priorityMap[task.priority].badge}"><span class="priority-icon">${priorityMap[task.priority].icon}</span>${task.priority}</span></td>
      <td class="p-3"><span class="status-badge ${statusMap[task.status].badge}">${statusMap[task.status].label} ${statusMap[task.status].icon}</span></td>
      <td class="p-3">
        <button class="btn btn-primary btn-sm view-btn" data-id="${task.id}">${task.status === 'Pending' ? 'Start Task' : (task.status === 'Completed' ? 'View Details' : 'View / Update')}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // Attach event listeners for view buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(btn.getAttribute('data-id'));
      openTaskModal(id);
    });
  });
}

// --- Render Kanban ---
function renderKanban(tasks) {
  const kanbanView = document.getElementById('kanbanView');
  kanbanView.innerHTML = '';
  const columns = [
    { key: 'Pending', label: 'Pending', icon: '🟡' },
    { key: 'In Progress', label: 'In Progress', icon: '🔴' },
    { key: 'Review', label: 'Review', icon: '🟣' },
    { key: 'Completed', label: 'Completed', icon: '✅' }
  ];
  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';
    colDiv.innerHTML = `<div class="kanban-header">${col.icon} ${col.label}</div><div class="kanban-tasks"></div>`;
    const colTasks = tasks.filter(t => t.status === col.key);
    const tasksDiv = colDiv.querySelector('.kanban-tasks');
    if (!colTasks.length) {
      tasksDiv.innerHTML = '<div class="text-gray-400 text-sm text-center">No tasks</div>';
    } else {
      colTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'kanban-task-card';
        card.innerHTML = `
          <div class="font-semibold mb-1">${task.title}</div>
          <div class="text-xs text-gray-500 mb-1">Due: ${task.dueDate}</div>
          <div class="priority-badge ${priorityMap[task.priority].badge}"><span class="priority-icon">${priorityMap[task.priority].icon}</span>${task.priority}</div>
          <div class="status-badge ${statusMap[task.status].badge}">${statusMap[task.status].label} ${statusMap[task.status].icon}</div>
        `;
        card.addEventListener('click', () => openTaskModal(task.id));
        tasksDiv.appendChild(card);
      });
    }
    kanbanView.appendChild(colDiv);
  });
}

// --- Modal logic ---
function openTaskModal(id) {
  const task = demoTasks.find(t => t.id === id);
  if (!task) return;
  const modal = document.getElementById('taskModal');
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="mb-3">
      <div class="text-lg font-semibold mb-1">${task.title}</div>
      <div class="text-sm text-gray-500 mb-2">Assigned by: <b>${task.assignedBy}</b></div>
      <div class="mb-2">${task.description}</div>
      <div class="flex gap-2 mb-2">
        <div class="priority-badge ${priorityMap[task.priority].badge}"><span class="priority-icon">${priorityMap[task.priority].icon}</span>${task.priority}</div>
        <div class="status-badge ${statusMap[task.status].badge}">${statusMap[task.status].label} ${statusMap[task.status].icon}</div>
      </div>
      <div class="text-xs text-gray-500 mb-2">Start: ${task.assignedDate} | Due: ${task.dueDate}</div>
    </div>
    <div class="mb-3">
      <label for="statusSelect" class="block text-sm font-medium mb-1">Status</label>
      <select id="statusSelect" class="border px-3 py-2 rounded-md text-sm w-full">
        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Review" ${task.status === 'Review' ? 'selected' : ''}>Review</option>
        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
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
        ${(task.comments && task.comments.length) ? task.comments.map(c => `<div class="mb-1"><b>${c.user}:</b> ${c.text}</div>`).join('') : '<span class="text-gray-400">No comments yet.</span>'}
      </div>
    </div>
  `;
  modal.style.display = 'block';
  // Close logic
  modal.querySelector('.close').onclick = () => { modal.style.display = 'none'; };
  window.onclick = function(event) {
    if (event.target === modal) modal.style.display = 'none';
  };
  // Update logic (demo only)
  document.getElementById('updateTaskBtn').onclick = () => {
    const newStatus = document.getElementById('statusSelect').value;
    const newComment = document.getElementById('commentBox').value.trim();
    task.status = newStatus;
    if (newComment) {
      task.comments = task.comments || [];
      task.comments.push({ user: 'You', text: newComment });
    }
    modal.style.display = 'none';
    renderAll();
    showToast('✅ Task updated successfully!');
  };
}

// --- Tab switching ---
function setupTabs() {
  const tableTab = document.getElementById('tableTab');
  const kanbanTab = document.getElementById('kanbanTab');
  const tableView = document.getElementById('tableView');
  const kanbanView = document.getElementById('kanbanView');
  tableTab.onclick = () => {
    tableTab.classList.add('btn-primary');
    tableTab.classList.remove('btn-secondary');
    kanbanTab.classList.add('btn-secondary');
    kanbanTab.classList.remove('btn-primary');
    tableView.style.display = '';
    kanbanView.style.display = 'none';
  };
  kanbanTab.onclick = () => {
    kanbanTab.classList.add('btn-primary');
    kanbanTab.classList.remove('btn-secondary');
    tableTab.classList.add('btn-secondary');
    tableTab.classList.remove('btn-primary');
    tableView.style.display = 'none';
    kanbanView.style.display = '';
  };
}

// --- Filters & Search ---
function setupFilters() {
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const searchInput = document.getElementById('searchInput');
  function filterAndRender() {
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    const search = searchInput.value;
    const filtered = filterTasks({ status, priority, search });
    renderTable(filtered);
    renderKanban(filtered);
  }
  statusFilter.onchange = filterAndRender;
  priorityFilter.onchange = filterAndRender;
  searchInput.oninput = filterAndRender;
}

// --- Export to CSV ---
function setupExport() {
  document.getElementById('exportBtn').onclick = () => {
    let csv = 'Title,Assigned Date,Due Date,Priority,Status\n';
    demoTasks.forEach(t => {
      csv += `"${t.title}",${t.assignedDate},${t.dueDate},${t.priority},${t.status}\n`;
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
  };
}

// --- Toast/Notification ---
function showToast(msg) {
  const reminder = document.getElementById('taskReminder');
  const text = document.getElementById('reminderText');
  text.textContent = msg;
  reminder.style.display = 'block';
  setTimeout(() => { reminder.style.display = 'none'; }, 2500);
}

// --- Initial overdue reminder ---
function showOverdueReminder() {
  const overdue = demoTasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date());
  if (overdue.length) {
    const reminder = document.getElementById('taskReminder');
    const text = document.getElementById('reminderText');
    text.textContent = `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}.`;
    reminder.style.display = 'block';
  }
}

// --- Render all ---
function renderAll() {
  renderSummaryCards();
  const status = document.getElementById('statusFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const search = document.getElementById('searchInput').value;
  const filtered = filterTasks({ status, priority, search });
  renderTable(filtered);
  renderKanban(filtered);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  renderSummaryCards();
  renderTable(demoTasks);
  renderKanban(demoTasks);
  setupTabs();
  setupFilters();
  setupExport();
  showOverdueReminder();
});
