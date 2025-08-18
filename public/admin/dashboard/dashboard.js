// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboardData();
        this.initializeCharts();
        await this.loadRecentActivities();
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                const sidebar = document.querySelector('.sidebar');
                const sidebarToggle = document.getElementById('sidebarToggle');
                
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Profile modal handlers
        const avatar = document.querySelector('.user-avatar');
        const nameEl = document.getElementById('adminName');
        const profileModal = document.getElementById('profileModal');
        const closeBtn = profileModal ? profileModal.querySelector('.close') : null;
        const openProfile = () => {
            if (!profileModal) return;
            try {
                const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                const profileName = document.getElementById('profileName');
                const profileEmail = document.getElementById('profileEmail');
                if (profileName && info?.name) profileName.textContent = info.name;
                if (profileEmail && info?.email) profileEmail.textContent = info.email;
                const headerAvatar = document.getElementById('headerAvatar');
                const profileAvatar = document.getElementById('profileAvatar');
                if (info?.avatar && headerAvatar) headerAvatar.src = info.avatar;
                if (info?.avatar && profileAvatar) profileAvatar.src = info.avatar;
            } catch (_) {}
            profileModal.style.display = 'flex';
        };
        if (avatar) avatar.addEventListener('click', openProfile);
        if (nameEl) nameEl.addEventListener('click', openProfile);
        if (closeBtn) closeBtn.addEventListener('click', () => profileModal.style.display = 'none');
        window.addEventListener('click', (evt) => {
            if (evt.target === profileModal) profileModal.style.display = 'none';
        });
    }

    getAuthHeaders() {
        try {
            const token = localStorage.getItem('adminToken');
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        } catch (_) {
            return {};
        }
    }

    // Generate random integer between min and max (inclusive)
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Load live dashboard data from backend
    async loadDashboardData() {
        this.showLoading();
        try {
            const authHeaders = this.getAuthHeaders();
            const [employeesRes, attendanceRes, leavesRes, tasksRes] = await Promise.all([
                fetch('/api/employees', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/attendance/stats', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/leaves/stats', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/tasks/stats', { credentials: 'include', headers: { ...authHeaders } })
            ]);

            const [employeesJson, attendanceJson, leavesJson, tasksJson] = await Promise.all([
                employeesRes.ok ? employeesRes.json() : Promise.resolve({ employees: [] }),
                attendanceRes.ok ? attendanceRes.json() : Promise.resolve({ stats: [], totalRecords: 0 }),
                leavesRes.ok ? leavesRes.json() : Promise.resolve({ stats: [], totalRequests: 0, pendingRequests: 0 }),
                tasksRes.ok ? tasksRes.json() : Promise.resolve({ stats: [], totalTasks: 0, completedTasks: 0, pendingTasks: 0 })
            ]);

            // Normalize shapes expected by updateDashboardStats
            const employees = { employees: employeesJson.employees || [] };
            const attendance = { stats: attendanceJson.stats || [] };
            const leaves = { pendingRequests: leavesJson.pendingRequests || 0 };
            const tasks = { stats: tasksJson.stats || [] };

            this.updateDashboardStats(employees, attendance, leaves, tasks);

            // Update charts using live data
            this.updateAttendanceChart(attendance.stats || []);
            this.updateLeaveChartFromStats(leavesJson.stats || []);
        } catch (e) {
            console.error('Failed to load dashboard data:', e);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    updateDashboardStats(employees, attendance, leaves, tasks) {
        // Update employee count
        document.getElementById('totalEmployees').textContent = 
            employees.employees ? employees.employees.length : 0;

        // Update attendance stats
        const presentCount = attendance.stats?.find(s => s._id === 'present')?.count || 0;
        document.getElementById('presentToday').textContent = presentCount;

        // Update leave stats
        const pendingLeaves = leaves.pendingRequests || 0;
        document.getElementById('pendingLeaves').textContent = pendingLeaves;

        // Update task stats
        const activeTasks = tasks.stats?.find(s => s._id === 'pending')?.count || 0;
        document.getElementById('activeTasks').textContent = activeTasks;
    }

    initializeCharts() {
        this.createAttendanceChart();
        this.createLeaveChart();
    }

    createAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;
        // Initialize with zeros; will be updated after fetch
        const present = 0;
        const absent = 0;
        const late = 0;
        this.charts.attendance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [present, absent, late],
                    backgroundColor: [
                        '#10b981',
                        '#ef4444',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createLeaveChart() {
        const ctx = document.getElementById('leaveChart');
        if (!ctx) return;
        // Initialize with zeros; will be updated after fetch
        const sick = 0;
        const vacation = 0;
        const personal = 0;
        const maternity = 0;
        this.charts.leave = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sick', 'Vacation', 'Personal', 'Maternity'],
                datasets: [{
                    label: 'Leave Requests',
                    data: [sick, vacation, personal, maternity],
                    backgroundColor: [
                        '#ef4444',
                        '#10b981',
                        '#3b82f6',
                        '#8b5cf6'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Helpers to update charts after fetching stats
    updateAttendanceChart(stats) {
        if (!this.charts.attendance) return;
        const present = stats.find(s => s._id === 'present')?.count || 0;
        const absent = stats.find(s => s._id === 'absent')?.count || 0;
        const late = stats.find(s => s._id === 'late')?.count || 0;
        this.charts.attendance.data.datasets[0].data = [present, absent, late];
        this.charts.attendance.update();
    }

    updateLeaveChartFromStats(stats) {
        if (!this.charts.leave) return;
        const sick = stats.find(s => s._id === 'sick')?.count || 0;
        const vacation = stats.find(s => s._id === 'vacation')?.count || 0;
        const personal = stats.find(s => s._id === 'personal')?.count || 0;
        const maternity = stats.find(s => s._id === 'maternity')?.count || 0;
        this.charts.leave.data.datasets[0].data = [sick, vacation, personal, maternity];
        this.charts.leave.update();
    }

    // Generate random recent activities
    loadRecentActivities() {
        const activityTypes = ['user', 'attendance', 'leave', 'task'];
        const activityTitles = [
            'New employee registered',
            'Checked in',
            'Checked out',
            'Leave request submitted',
            'Task completed',
            'Profile updated',
            'Message sent',
            'Report generated',
            'Attendance marked',
            'Task assigned'
        ];
        const activityStatuses = ['completed', 'pending', 'present', 'updated'];
        const activities = Array.from({length: this.getRandomInt(4, 8)}, () => {
            const type = activityTypes[this.getRandomInt(0, activityTypes.length-1)];
            const title = activityTitles[this.getRandomInt(0, activityTitles.length-1)];
            const time = `${this.getRandomInt(1, 59)} minutes ago`;
            const status = activityStatuses[this.getRandomInt(0, activityStatuses.length-1)];
            return { type, title, time, status };
        });
        this.renderActivities(activities);
    }

    renderActivities(activities) {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                <span class="activity-status status-${activity.status}">${activity.status}</span>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            user: 'fa-user',
            attendance: 'fa-clock',
            leave: 'fa-calendar',
            task: 'fa-tasks'
        };
        return icons[type] || 'fa-info-circle';
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    async logout() {
        try {
            const headers = this.getAuthHeaders();
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { ...headers }
            });
        } catch (_) {}
        try { localStorage.removeItem('adminToken'); } catch (_) {}
        try { localStorage.removeItem('adminInfo'); } catch (_) {}
        window.location.href = '/admin/login.html';
    }

    // Method to refresh dashboard data
    async refresh() {
        this.loadDashboardData();
        this.updateCharts();
    }

    updateCharts() {
        // For demo, you could regenerate chart data here if needed
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new Dashboard();
    // Profile save handlers
    const saveBtn = document.getElementById('saveProfileBtn');
    const nameInput = document.getElementById('profileNameInput');
    const fileInput = document.getElementById('profileAvatarInput');
    const toDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const payload = {};
            if (nameInput && nameInput.value.trim()) payload.name = nameInput.value.trim();
            if (fileInput && fileInput.files && fileInput.files[0]) {
                payload.avatar = await toDataUrl(fileInput.files[0]);
            }
            try {
                await fetch('/api/admin/profile', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...app.getAuthHeaders() },
                    body: JSON.stringify(payload)
                }).then(r => r.json()).then(data => {
                    if (data?.admin) {
                        const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                        const updated = { ...info, name: data.admin.name, avatar: data.admin.avatar };
                        localStorage.setItem('adminInfo', JSON.stringify(updated));
                        const nameEl = document.getElementById('adminName');
                        if (nameEl) nameEl.textContent = updated.name;
                        const headerAvatar = document.getElementById('headerAvatar');
                        const profileAvatar = document.getElementById('profileAvatar');
                        if (updated.avatar && headerAvatar) headerAvatar.src = updated.avatar;
                        if (updated.avatar && profileAvatar) profileAvatar.src = updated.avatar;
                        alert('Profile updated');
                    } else {
                        alert(data?.message || 'Failed to update profile');
                    }
                });
            } catch (e) {
                alert('Failed to update profile');
            }
        });
    }

    const changeBtn = document.getElementById('changePasswordBtn');
    if (changeBtn) {
        changeBtn.addEventListener('click', async () => {
            const currentPassword = (document.getElementById('currentPassword') || {}).value || '';
            const newPassword = (document.getElementById('newPassword') || {}).value || '';
            if (!currentPassword || !newPassword) {
                alert('Please fill both password fields');
                return;
            }
            try {
                const res = await fetch('/api/admin/change-password', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...app.getAuthHeaders() },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Password changed successfully');
                    (document.getElementById('currentPassword') || {}).value = '';
                    (document.getElementById('newPassword') || {}).value = '';
                } else {
                    alert(data?.message || 'Failed to change password');
                }
            } catch (e) {
                alert('Failed to change password');
            }
        });
    }
});

// Add CSS for error notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 