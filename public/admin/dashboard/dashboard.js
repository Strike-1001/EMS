// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        // Test API endpoints for debugging (remove in production)
        await this.testAPIEndpoints();
        
        await this.loadDashboardData();
        this.initializeCharts();
        await this.loadRecentActivities();
        this.initializeHeaderAvatar();
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

        // Refresh dashboard
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.refreshDashboard();
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

        // Profile dropdown handlers
        const avatarContainer = document.querySelector('.avatar-container');
        const profileDropdown = document.getElementById('profileDropdown');
        const myProfileLink = document.getElementById('myProfileLink');
        const profileSettingsLink = document.getElementById('profileSettingsLink');
        const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');
        
        // Toggle dropdown on avatar click
        if (avatarContainer) {
            avatarContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = profileDropdown.classList.contains('show');
                profileDropdown.classList.toggle('show');
                avatarContainer.classList.toggle('dropdown-open', !isOpen);
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (profileDropdown && !avatarContainer.contains(e.target)) {
                profileDropdown.classList.remove('show');
                avatarContainer.classList.remove('dropdown-open');
            }
        });
        
        // Navigate to profile page
        if (myProfileLink) {
            myProfileLink.addEventListener('click', () => {
                window.location.href = '../profile/profile.html';
            });
        }
        
        // Open profile settings modal
        if (profileSettingsLink) {
            profileSettingsLink.addEventListener('click', () => {
                this.openProfileModal();
            });
        }
        
        // Logout from dropdown
        if (logoutDropdownBtn) {
            logoutDropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Profile modal handlers
        const profileModal = document.getElementById('adminProfileModal');
        const closeBtn = document.getElementById('profileModalClose');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeProfileModal());
        window.addEventListener('click', (evt) => {
            if (evt.target === profileModal) this.closeProfileModal();
        });
        
        // Close modal on ESC key
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape' && profileModal && profileModal.style.display === 'flex') {
                this.closeProfileModal();
            }
        });

        // Camera functionality
        this.setupCameraHandlers();
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
            console.log('Loading dashboard data...');
            const authHeaders = this.getAuthHeaders();
            
            // Log the auth headers for debugging
            console.log('Auth headers:', authHeaders);
            
            const [employeesRes, attendanceRes, leavesRes, tasksRes] = await Promise.all([
                fetch('/api/employees', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/attendance/stats', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/leaves/stats', { credentials: 'include', headers: { ...authHeaders } }),
                fetch('/api/tasks/stats', { credentials: 'include', headers: { ...authHeaders } })
            ]);

            // Log response statuses for debugging
            console.log('API Responses:', {
                employees: employeesRes.status,
                attendance: attendanceRes.status,
                leaves: leavesRes.status,
                tasks: tasksRes.status
            });

            // Check if any request failed
            if (!employeesRes.ok || !attendanceRes.ok || !leavesRes.ok || !tasksRes.ok) {
                throw new Error(`API request failed: employees(${employeesRes.status}), attendance(${attendanceRes.status}), leaves(${leavesRes.status}), tasks(${tasksRes.status})`);
            }

            const [employeesJson, attendanceJson, leavesJson, tasksJson] = await Promise.all([
                employeesRes.json(),
                attendanceRes.json(),
                leavesRes.json(),
                tasksRes.json()
            ]);

            // Log the actual data for debugging
            console.log('Dashboard data loaded:', {
                employees: employeesJson,
                attendance: attendanceJson,
                leaves: leavesJson,
                tasks: tasksJson
            });

            // Normalize shapes expected by updateDashboardStats
            const employees = { employees: employeesJson.employees || [] };
            const attendance = { stats: attendanceJson.stats || [] };
            const leaves = { pendingRequests: leavesJson.pendingRequests || 0 };
            const tasks = { stats: tasksJson.stats || [] };

            this.updateDashboardStats(employees, attendance, leaves, tasks);

            // Update charts using live data
            this.updateAttendanceChart(attendance.stats || []);
            this.updateLeaveChartFromStats(leavesJson.stats || []);
            
            console.log('Dashboard data updated successfully');
        } catch (e) {
            console.error('Failed to load dashboard data:', e);
            this.showError(`Failed to load dashboard data: ${e.message}`);
            
            // Show fallback data or error state
            this.showDashboardErrorState();
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

    // Show error state for dashboard
    showDashboardErrorState() {
        const errorMessage = 'Unable to load dashboard data. Please check your connection and try again.';
        
        // Update stats to show error state
        document.getElementById('totalEmployees').textContent = '--';
        document.getElementById('presentToday').textContent = '--';
        document.getElementById('pendingLeaves').textContent = '--';
        document.getElementById('activeTasks').textContent = '--';
        
        // Add error indicator to stats cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.classList.add('error-state');
        });
        
        // Show error message in recent activities
        const activitiesContainer = document.getElementById('recentActivities');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div class="activity-item error">
                    <div class="activity-icon error">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Dashboard Error</div>
                        <div class="activity-time">${errorMessage}</div>
                    </div>
                    <span class="activity-status status-error">Error</span>
                </div>
            `;
        }
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

    showSuccess(message) {
        // Create a success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    openProfileModal() {
        const profileModal = document.getElementById('adminProfileModal');
        if (!profileModal) return;
        
        try {
            const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileNameInput = document.getElementById('profileNameInput');
            
            if (profileName && info?.name) profileName.textContent = info.name;
            if (profileEmail && info?.email) profileEmail.textContent = info.email;
            if (profileNameInput && info?.name) profileNameInput.value = info.name;
            
            const headerAvatar = document.getElementById('headerAvatar');
            const profileAvatar = document.getElementById('profileAvatar');
            if (info?.avatar && headerAvatar) headerAvatar.src = info.avatar;
            if (info?.avatar && profileAvatar) profileAvatar.src = info.avatar;
        } catch (_) {}
        
        // Clear file input and captured image data when opening modal
        const fileInput = document.getElementById('profileAvatarInput');
        if (fileInput) fileInput.value = '';
        this.capturedImageData = null;
        
        profileModal.style.display = 'flex';
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
    }

    closeProfileModal() {
        const profileModal = document.getElementById('adminProfileModal');
        if (profileModal) {
            profileModal.style.display = 'none';
        }
        
        // If there were pending changes, revert the header avatar
        if (this.capturedImageData) {
            this.revertHeaderAvatar();
        }
        
        // Clear pending changes when modal is closed
        this.capturedImageData = null;
        this.removePendingImageIndicator();
        
        // Restore background scrolling
        document.body.style.overflow = '';
    }

    setupCameraHandlers() {
        const cameraBtn = document.getElementById('cameraBtn');
        const cameraModal = document.getElementById('cameraModal');
        const cameraModalClose = document.getElementById('cameraModalClose');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const usePhotoBtn = document.getElementById('usePhotoBtn');
        const switchCameraBtn = document.getElementById('switchCameraBtn');
        const requestPermissionBtn = document.getElementById('requestPermissionBtn');

        // Camera state
        this.cameraState = {
            stream: null,
            facingMode: 'user', // 'user' for front camera, 'environment' for back camera
            isCaptured: false
        };

        // Open camera modal
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                this.openCameraModal();
            });
        }

        // Second camera button in profile form
        const cameraBtn2 = document.getElementById('cameraBtn2');
        if (cameraBtn2) {
            cameraBtn2.addEventListener('click', () => {
                this.openCameraModal();
            });
        }

        // Password field validation
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        
        if (currentPasswordInput) {
            currentPasswordInput.addEventListener('input', () => {
                this.validatePasswordFields();
            });
        }
        
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                this.validatePasswordFields();
            });
        }

        // Close camera modal
        if (cameraModalClose) {
            cameraModalClose.addEventListener('click', () => {
                this.closeCameraModal();
            });
        }

        // Capture photo
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }

        // Retake photo
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                this.retakePhoto();
            });
        }

        // Use captured photo
        if (usePhotoBtn) {
            usePhotoBtn.addEventListener('click', () => {
                this.useCapturedPhoto();
            });
        }

        // Switch camera
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', () => {
                this.switchCamera();
            });
        }

        // Request camera permission
        if (requestPermissionBtn) {
            requestPermissionBtn.addEventListener('click', () => {
                this.requestCameraPermission();
            });
        }

        // Close camera modal on outside click
        window.addEventListener('click', (evt) => {
            if (evt.target === cameraModal) {
                this.closeCameraModal();
            }
        });
    }

    async openCameraModal() {
        const cameraModal = document.getElementById('cameraModal');
        if (!cameraModal) return;

        cameraModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset camera state
        this.cameraState.isCaptured = false;
        this.updateCameraUI();
        
        // Start camera
        await this.startCamera();
    }

    closeCameraModal() {
        const cameraModal = document.getElementById('cameraModal');
        if (cameraModal) {
            cameraModal.style.display = 'none';
        }
        
        // Stop camera stream
        this.stopCamera();
        
        // Don't restore background scrolling here since profile modal might still be open
        // The profile modal will handle its own scrolling state
    }

    async startCamera() {
        const video = document.getElementById('cameraVideo');
        const permissionDiv = document.getElementById('cameraPermission');
        
        if (!video) return;

        try {
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported');
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.cameraState.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.cameraState.stream = stream;
            video.srcObject = stream;
            
            // Hide permission div and show video
            if (permissionDiv) permissionDiv.style.display = 'none';
            video.style.display = 'block';
            
            // Wait for video to load
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

        } catch (error) {
            console.error('Camera error:', error);
            this.showCameraPermissionError();
        }
    }

    stopCamera() {
        if (this.cameraState.stream) {
            this.cameraState.stream.getTracks().forEach(track => track.stop());
            this.cameraState.stream = null;
        }
        
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
            video.style.display = 'none';
        }
    }

    showCameraPermissionError() {
        const permissionDiv = document.getElementById('cameraPermission');
        const video = document.getElementById('cameraVideo');
        
        if (permissionDiv) permissionDiv.style.display = 'flex';
        if (video) video.style.display = 'none';
    }

    async requestCameraPermission() {
        try {
            await this.startCamera();
        } catch (error) {
            console.error('Permission request failed:', error);
        }
    }

    async switchCamera() {
        // Stop current stream
        this.stopCamera();
        
        // Switch facing mode
        this.cameraState.facingMode = this.cameraState.facingMode === 'user' ? 'environment' : 'user';
        
        // Start new stream
        await this.startCamera();
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (!video || !canvas) return;

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Show captured image
        canvas.style.display = 'block';
        video.style.display = 'none';
        
        // Update UI
        this.cameraState.isCaptured = true;
        this.updateCameraUI();
    }

    retakePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (!video || !canvas) return;

        // Show video again
        canvas.style.display = 'none';
        video.style.display = 'block';
        
        // Update UI
        this.cameraState.isCaptured = false;
        this.updateCameraUI();
    }

    useCapturedPhoto() {
        const canvas = document.getElementById('cameraCanvas');
        
        if (!canvas) return;

        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Update avatar preview using the new method
        this.updateAvatarPreview(imageData);
        
        // Close camera modal
        this.closeCameraModal();
    }

    updateCameraUI() {
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const usePhotoBtn = document.getElementById('usePhotoBtn');
        const switchCameraBtn = document.getElementById('switchCameraBtn');

        if (this.cameraState.isCaptured) {
            // Photo captured - show retake and use photo buttons
            if (captureBtn) captureBtn.style.display = 'none';
            if (retakeBtn) retakeBtn.style.display = 'inline-flex';
            if (usePhotoBtn) usePhotoBtn.style.display = 'inline-flex';
            if (switchCameraBtn) switchCameraBtn.style.display = 'none';
        } else {
            // Camera active - show capture and switch camera buttons
            if (captureBtn) captureBtn.style.display = 'inline-flex';
            if (retakeBtn) retakeBtn.style.display = 'none';
            if (usePhotoBtn) usePhotoBtn.style.display = 'none';
            if (switchCameraBtn) switchCameraBtn.style.display = 'inline-flex';
        }
    }

    updateAvatarPreview(imageData) {
        // Update profile avatar in modal
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = imageData;
        }
        
        // Update header avatar immediately for preview
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) {
            headerAvatar.src = imageData;
        }
        
        // Store the image data for later use
        this.capturedImageData = imageData;
        
        // Add visual indicator that image is pending save
        this.addPendingImageIndicator();
        
        // Show a subtle notification that image was updated
        this.showImageUpdateNotification();
    }

    addPendingImageIndicator() {
        // Remove existing indicator if any
        this.removePendingImageIndicator();
        
        // Add indicator to profile avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            const indicator = document.createElement('div');
            indicator.className = 'pending-image-indicator';
            indicator.innerHTML = '<i class="fas fa-clock"></i>';
            indicator.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f59e0b;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                z-index: 10;
            `;
            
            // Make avatar container relative if not already
            const avatarContainer = profileAvatar.parentElement;
            if (avatarContainer) {
                avatarContainer.style.position = 'relative';
                avatarContainer.appendChild(indicator);
            }
        }
    }

    removePendingImageIndicator() {
        const indicator = document.querySelector('.pending-image-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    revertHeaderAvatar() {
        try {
            const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar) {
                // Revert to stored avatar or default to admin.png
                headerAvatar.src = info.avatar || 'admin.png';
            }
        } catch (error) {
            console.error('Error reverting header avatar:', error);
            // Fallback to default image
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar) {
                headerAvatar.src = 'admin.png';
            }
        }
    }

    initializeHeaderAvatar() {
        try {
            const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar && info.avatar) {
                headerAvatar.src = info.avatar;
            }
        } catch (error) {
            console.error('Error initializing header avatar:', error);
        }
    }

    validatePasswordFields() {
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        
        if (!currentPasswordInput || !newPasswordInput) return;
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        
        // Clear previous validation states
        currentPasswordInput.classList.remove('error', 'success');
        newPasswordInput.classList.remove('error', 'success');
        
        // If either field has content, validate both
        if (currentPassword || newPassword) {
            if (!currentPassword) {
                currentPasswordInput.classList.add('error');
            } else {
                currentPasswordInput.classList.add('success');
            }
            
            if (!newPassword) {
                newPasswordInput.classList.add('error');
            } else if (newPassword.length < 6) {
                newPasswordInput.classList.add('error');
            } else {
                newPasswordInput.classList.add('success');
            }
        }
    }

    showImageUpdateNotification() {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'image-update-notification';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Image updated';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 2000);
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

    // Test API endpoints for debugging
    async testAPIEndpoints() {
        console.log('Testing API endpoints...');
        const authHeaders = this.getAuthHeaders();
        
        try {
            const endpoints = [
                '/api/employees',
                '/api/attendance/stats',
                '/api/leaves/stats',
                '/api/tasks/stats'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { 
                        credentials: 'include', 
                        headers: { ...authHeaders } 
                    });
                    console.log(`${endpoint}: ${response.status} ${response.statusText}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`${endpoint} data:`, data);
                    }
                } catch (error) {
                    console.error(`Error testing ${endpoint}:`, error);
                }
            }
        } catch (error) {
            console.error('API testing failed:', error);
        }
    }

    // Refresh dashboard with loading state
    async refreshDashboard() {
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
        }
        
        try {
            await this.loadDashboardData();
            this.updateCharts();
            
            // Show success notification
            this.showSuccess('Dashboard refreshed successfully');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showError('Failed to refresh dashboard');
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
            }
        }
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
    // File input change handler for immediate preview
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const imageData = await toDataUrl(file);
                    app.updateAvatarPreview(imageData);
                } catch (error) {
                    console.error('Error reading file:', error);
                    alert('Error reading the selected file. Please try again.');
                }
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            // Show loading state
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            const currentPassword = (document.getElementById('currentPassword') || {}).value || '';
            const newPassword = (document.getElementById('newPassword') || {}).value || '';
            
            // Validate password fields if either is filled
            if (currentPassword || newPassword) {
                if (!currentPassword || !newPassword) {
                    alert('Please fill both current and new password fields');
                    return;
                }
                if (newPassword.length < 6) {
                    alert('New password must be at least 6 characters long');
                    return;
                }
            }
            
            const payload = {};
            if (nameInput && nameInput.value.trim()) payload.name = nameInput.value.trim();
            if (fileInput && fileInput.files && fileInput.files[0]) {
                payload.avatar = await toDataUrl(fileInput.files[0]);
            }
            // Check for captured image data
            if (app.capturedImageData) {
                payload.avatar = app.capturedImageData;
            }
            
            try {
                // First update profile information
                const profileRes = await fetch('/api/admin/profile', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...app.getAuthHeaders() },
                    body: JSON.stringify(payload)
                });
                
                const profileData = await profileRes.json();
                
                // Then update password if provided
                if (currentPassword && newPassword) {
                    const passwordRes = await fetch('/api/admin/change-password', {
                        method: 'PUT',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', ...app.getAuthHeaders() },
                        body: JSON.stringify({ currentPassword, newPassword })
                    });
                    
                    const passwordData = await passwordRes.json();
                    
                    if (!passwordRes.ok) {
                        alert(passwordData?.message || 'Failed to change password');
                        return;
                    }
                }
                
                if (profileData?.admin) {
                    const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                    const updated = { ...info, name: profileData.admin.name, avatar: profileData.admin.avatar };
                    localStorage.setItem('adminInfo', JSON.stringify(updated));
                    const nameEl = document.getElementById('adminName');
                    if (nameEl) nameEl.textContent = updated.name;
                    const headerAvatar = document.getElementById('headerAvatar');
                    const profileAvatar = document.getElementById('profileAvatar');
                    // Update both avatars with the new image
                    const avatarToUse = updated.avatar || app.capturedImageData;
                    if (avatarToUse) {
                        if (headerAvatar) headerAvatar.src = avatarToUse;
                        if (profileAvatar) profileAvatar.src = avatarToUse;
                    }
                    
                    // Clear password fields
                    if (document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
                    if (document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
                    
                    const successMessage = currentPassword && newPassword ? 'Profile and password updated successfully' : 'Profile updated successfully';
                    alert(successMessage);
                    app.closeProfileModal();
                    // Clear captured image data and remove pending indicator
                    app.capturedImageData = null;
                    app.removePendingImageIndicator();
                } else {
                    alert(profileData?.message || 'Failed to update profile');
                }
            } catch (e) {
                console.error('Update error:', e);
                alert('Failed to update profile');
            } finally {
                // Restore button state
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        });
    }


});

// Add CSS for notification animations
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
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 