// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.API_BASE = 'http://localhost:3000';
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboardData();
        this.initializeCharts();
        this.loadRecentActivities();
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

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
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Load all dashboard data in parallel
            const [employees, attendance, leaves, tasks] = await Promise.all([
                this.fetchEmployees(),
                this.fetchAttendanceStats(),
                this.fetchLeaveStats(),
                this.fetchTaskStats()
            ]);

            this.updateDashboardStats(employees, attendance, leaves, tasks);
            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.hideLoading();
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchEmployees() {
        const response = await fetch(`${this.API_BASE}/api/employees`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        return response.json();
    }

    async fetchAttendanceStats() {
        const response = await fetch(`${this.API_BASE}/api/attendance/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch attendance stats');
        return response.json();
    }

    async fetchLeaveStats() {
        const response = await fetch(`${this.API_BASE}/api/leaves/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch leave stats');
        return response.json();
    }

    async fetchTaskStats() {
        const response = await fetch(`${this.API_BASE}/api/tasks/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch task stats');
        return response.json();
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

        this.charts.attendance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [65, 20, 15],
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

        this.charts.leave = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sick', 'Vacation', 'Personal', 'Maternity'],
                datasets: [{
                    label: 'Leave Requests',
                    data: [12, 8, 5, 2],
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

    async loadRecentActivities() {
        try {
            // Simulate recent activities (in a real app, this would come from an API)
            const activities = [
                {
                    type: 'user',
                    title: 'New employee registered',
                    time: '2 minutes ago',
                    status: 'completed'
                },
                {
                    type: 'attendance',
                    title: 'John Doe checked in',
                    time: '5 minutes ago',
                    status: 'present'
                },
                {
                    type: 'leave',
                    title: 'Leave request submitted',
                    time: '10 minutes ago',
                    status: 'pending'
                },
                {
                    type: 'task',
                    title: 'Task completed by Sarah',
                    time: '15 minutes ago',
                    status: 'completed'
                },
                {
                    type: 'user',
                    title: 'Profile updated',
                    time: '20 minutes ago',
                    status: 'updated'
                }
            ];

            this.renderActivities(activities);
        } catch (error) {
            console.error('Error loading activities:', error);
        }
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
            const response = await fetch(`${this.API_BASE}/auth/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.href = '/index.html';
            } else {
                // Force logout by clearing cookies
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/index.html';
        }
    }

    // Method to refresh dashboard data
    async refresh() {
        await this.loadDashboardData();
        this.updateCharts();
    }

    updateCharts() {
        // Update chart data (this would be called with real data)
        if (this.charts.attendance) {
            // Update attendance chart with new data
        }
        if (this.charts.leave) {
            // Update leave chart with new data
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
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