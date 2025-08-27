// Attendance Management JavaScript - Real Data Implementation

// Global variables
let currentAttendanceData = [];
let currentStats = { present: 0, late: 0, absent: 0, total: 0 };

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing attendance management...');
    
    // Set default dates (today)
    setDefaultDates();
    
    // Load initial attendance data
    loadAttendanceData();
    
    // Add event listeners
    addEventListeners();
});

// Set default dates to today
function setDefaultDates() {
    const today = new Date();
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
        startDate.value = today.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
    }
}

// Add event listeners
function addEventListeners() {
    // Filter button
    const filterBtn = document.getElementById('filterAttendance');
    if (filterBtn) {
        filterBtn.addEventListener('click', filterAttendanceByDate);
    }
    
    // Date input changes
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) {
        startDate.addEventListener('change', function() {
            if (endDate.value && startDate.value > endDate.value) {
                endDate.value = startDate.value;
            }
        });
    }
    
    if (endDate) {
        endDate.addEventListener('click', function() {
            if (!startDate.value) {
                startDate.value = endDate.value;
            }
        });
    }
    
    // Add click event listener for employee names
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('employee-name-clickable')) {
            const email = e.target.getAttribute('data-email');
            const name = e.target.getAttribute('data-name');
            showEmployeeEmailPopup(name, email);
        }
    });
}

// Load attendance data from backend
async function loadAttendanceData() {
    try {
        showLoading(true);
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showNotification('Please select both start and end dates', 'error');
            return;
        }
        
        console.log(`Loading attendance data from ${startDate} to ${endDate}`);
        
        const response = await fetch(`/api/attendance/admin/all?startDate=${startDate}&endDate=${endDate}`, {
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
            currentAttendanceData = data.attendance || [];
            currentStats = data.stats || { present: 0, late: 0, absent: 0, total: 0 };
            
            renderAttendanceTable();
            updateAttendanceStats();
            
            console.log(`Loaded ${currentAttendanceData.length} attendance records`);
        } else {
            throw new Error(data.error || 'Failed to load attendance data');
        }
        
    } catch (error) {
        console.error('Error loading attendance data:', error);
        showNotification(`Failed to load attendance data: ${error.message}`, 'error');
        
        // Clear table and show empty state
        clearAttendanceTable();
        updateAttendanceStats();
    } finally {
        showLoading(false);
    }
}

// Filter attendance by date
async function filterAttendanceByDate() {
    await loadAttendanceData();
}

// Render attendance table with real data
function renderAttendanceTable() {
    const tableBody = document.getElementById('attendanceTableBody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (currentAttendanceData.length === 0) {
        // Show empty state
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="empty-state">
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; color: #d1d5db;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">No attendance records found for the selected date range</p>
                    <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Try selecting a different date range or check if employees have checked in</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Render each attendance record
    currentAttendanceData.forEach(record => {
        const row = createAttendanceRow(record);
        tableBody.appendChild(row);
    });
    
    // Add delete button listeners
    addDeleteButtonListeners();
}

// Create attendance table row
function createAttendanceRow(record) {
    const row = document.createElement('tr');
    
    // Format employee name
    const employeeName = record.employeeId ? 
        `${record.employeeId.firstName || ''} ${record.employeeId.lastName || ''}`.trim() || 
        record.employeeId.name || 
        'Unknown Employee' : 'Unknown Employee';
    
    // Get employee email
    const employeeEmail = record.employeeId?.email || 'No email available';
    
    // Format date
    const date = new Date(record.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Format check-in time
    const checkInTime = record.checkIn?.time ? 
        new Date(record.checkIn.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) : '-';
    
    // Format check-out time
    const checkOutTime = record.checkOut?.time ? 
        new Date(record.checkOut.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) : '-';
    
    // Format total hours
    const totalHours = record.totalHours ? 
        `${Math.floor(record.totalHours)}h ${Math.round((record.totalHours % 1) * 60)}m` : 
        '0h 0m';
    
    // Format status
    const statusClass = `status-tag status-${record.status || 'absent'}`;
    const statusText = record.status ? 
        record.status.charAt(0).toUpperCase() + record.status.slice(1) : 
        'Absent';
    
    row.innerHTML = `
        <td>
            <span class="employee-name-clickable" 
                  data-email="${employeeEmail}" 
                  data-name="${employeeName}"
                  title="Click to view email">
                ${employeeName}
            </span>
        </td>
        <td>${date}</td>
        <td>${checkInTime}</td>
        <td>${checkOutTime}</td>
        <td>${totalHours}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>
            <button class="btn btn-danger btn-sm delete-attendance" 
                    data-id="${record._id}" 
                    data-employee="${employeeName}" 
                    data-date="${date}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    
    return row;
}

// Clear attendance table
function clearAttendanceTable() {
    const tableBody = document.getElementById('attendanceTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    currentAttendanceData = [];
    currentStats = { present: 0, late: 0, absent: 0, total: 0 };
}

// Add delete button listeners to all delete buttons
function addDeleteButtonListeners() {
    const deleteButtons = document.querySelectorAll('.delete-attendance');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const attendanceId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-employee');
            const date = this.getAttribute('data-date');
            
            showDeleteConfirmation(attendanceId, employeeName, date);
        });
    });
}

// Show delete confirmation dialog
function showDeleteConfirmation(attendanceId, employeeName, date) {
    if (confirm(`Are you sure you want to permanently delete the attendance record for ${employeeName} on ${date}?\n\nThis action cannot be undone.`)) {
        deleteAttendanceRecord(attendanceId, employeeName, date);
    }
}

// Delete attendance record permanently
async function deleteAttendanceRecord(attendanceId, employeeName, date) {
    try {
        console.log(`Deleting attendance record: ${attendanceId} for ${employeeName} on ${date}`);
        
        const response = await fetch(`/api/attendance/${attendanceId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from current data
            currentAttendanceData = currentAttendanceData.filter(record => record._id !== attendanceId);
            
            // Re-render table
            renderAttendanceTable();
            
            // Update stats
            updateAttendanceStats();
            
            // Show success message
            showNotification(`Attendance record for ${employeeName} deleted permanently`, 'success');
        } else {
            throw new Error(result.error || 'Failed to delete attendance record');
        }
        
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        showNotification(`Failed to delete attendance record: ${error.message}`, 'error');
    }
}

// Update attendance statistics
function updateAttendanceStats() {
    const presentCount = document.getElementById('presentCount');
    const absentCount = document.getElementById('absentCount');
    const lateCount = document.getElementById('lateCount');
    
    if (!presentCount || !absentCount || !lateCount) return;
    
    // Update display with real stats
    presentCount.textContent = currentStats.present || 0;
    absentCount.textContent = currentStats.absent || 0;
    lateCount.textContent = currentStats.late || 0;
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
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
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Show employee email popup
function showEmployeeEmailPopup(name, email) {
    // Remove existing popups
    const existingPopups = document.querySelectorAll('.email-popup');
    existingPopups.forEach(popup => popup.remove());
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'email-popup';
    popup.innerHTML = `
        <div class="email-popup-content">
            <div class="email-popup-header">
                <h4><i class="fas fa-user"></i> ${name}</h4>
                <button class="email-popup-close" onclick="this.closest('.email-popup').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="email-popup-body">
                <div class="email-info">
               
                    <span class="email-value">${email}</span>
                </div>
                <div class="email-actions">
                    <button class="btn btn-primary btn-sm copy-email" onclick="copyToClipboard('${email}')">
                        <i class="fas fa-copy"></i> Copy Email
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.open('mailto:${email}', '_blank')">
                        <i class="fas fa-envelope-open"></i> Send Email
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(popup);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 10000);
}

// Copy email to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Email copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Email copied to clipboard!', 'success');
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showNotification('Failed to copy email to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}
