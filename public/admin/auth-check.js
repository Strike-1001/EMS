// Admin Authentication Check Script
// Include this script in all admin pages to ensure authentication

(function() {
    'use strict';
    
    // Check if we're already on the auth page to prevent infinite redirects
    if (window.location.pathname.includes('auth.html')) {
        return;
    }
    
    // Check authentication status
    function checkAdminAuth() {
        // Check if admin token exists in localStorage
        const adminToken = localStorage.getItem('adminToken');
        const adminInfo = localStorage.getItem('adminInfo');
        
        if (!adminToken || !adminInfo) {
            redirectToAuth();
            return;
        }
        
        // Authentication successful, continue loading the page
        console.log('Admin authentication verified');
    }
    
    function redirectToAuth() {
        // Direct redirect to login page
        window.location.href = 'login.html';
    }
    
    // Add logout functionality
    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Clear authentication data
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                
                // Redirect to login page
                window.location.href = 'login.html';
            });
        }
    }
    
    // Add admin info display functionality
    function displayAdminInfo() {
        const adminInfo = localStorage.getItem('adminInfo');
        if (adminInfo) {
            try {
                const admin = JSON.parse(adminInfo);
                const adminNameElement = document.getElementById('adminName');
                if (adminNameElement && admin.name) {
                    adminNameElement.textContent = admin.name;
                }
                
                const headerAvatarElement = document.getElementById('headerAvatar');
                if (headerAvatarElement && admin.avatar) {
                    headerAvatarElement.src = admin.avatar;
                }
            } catch (error) {
                console.error('Error parsing admin info:', error);
            }
        }
    }
    
    // Initialize authentication check
    document.addEventListener('DOMContentLoaded', function() {
        checkAdminAuth();
        setupLogout();
        displayAdminInfo();
    });
    
    // Also check on page load for immediate redirect if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminAuth);
    } else {
        checkAdminAuth();
    }
    
})();
