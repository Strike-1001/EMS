// Dashboard wiring for Check In/Out and attendance summaries
document.addEventListener('DOMContentLoaded', () => {
  // Authentication check
  const userToken = localStorage.getItem('userToken');
  const userInfo = localStorage.getItem('userInfo');
  
  if (!userToken || !userInfo) {
    console.log('No authentication found, redirecting to login...');
    window.location.href = '/user/login.html';
    return;
  }
  
  try {
    const user = JSON.parse(userInfo);
    console.log('User authenticated:', user.name || user.email);
    
    // Update user name in header if available
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user.name) {
      userNameElement.textContent = user.name;
    }
  } catch (error) {
    console.error('Error parsing user info:', error);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/user/login.html';
    return;
  }

  const API_ATT = '/api/attendance';
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const checkInTime = document.getElementById('checkInTime');
  const checkOutTime = document.getElementById('checkOutTime');
  const totalHours = document.getElementById('totalHours');
  const todayStatus = document.getElementById('todayStatus');
  const daysPresent = document.getElementById('daysPresent');
  const daysAbsent = document.getElementById('daysAbsent');

  function getAuthHeaders() {
    try {
      const token = localStorage.getItem('userToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch (_) { return {}; }
  }

  // Validate user token with backend
  async function validateToken() {
    try {
      const res = await fetch('/api/user/validate-token', {
        method: 'GET',
        credentials: 'include',
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) {
        throw new Error('Token validation failed');
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      // Clear invalid tokens and redirect to login
      localStorage.removeItem('userInfo');
      window.location.href = '/user/login.html';
      return false;
    }
  }

  // Update current time display
  function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Update header with current time and date
    const headerLeft = document.querySelector('.header-left h1');
    if (headerLeft) {
      headerLeft.innerHTML = `Welcome Back!<br><small style="font-size: 0.8rem; color: #6b7280; font-weight: 400;">${dateString} • ${timeString}</small>`;
    }
  }

  function setLoading(isLoading) {
    const spinner = document.getElementById('loadingSpinner');
    if (!spinner) return;
    spinner.style.display = isLoading ? 'flex' : 'none';
  }

  // Show notification message
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.dashboard-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `dashboard-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add to dashboard
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      contentWrapper.insertBefore(notification, contentWrapper.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Update check-in button state
  function updateCheckInButtonState(isCheckedIn) {
    if (checkInBtn) {
      if (isCheckedIn) {
        // Hide the check-in button completely after check-in
        checkInBtn.style.display = 'none';
        
        // Show "Already Checked In" message
        showAlreadyCheckedInMessage();
      } else {
        // Show the check-in button if not checked in
        checkInBtn.style.display = 'block';
        checkInBtn.textContent = 'Check In';
        checkInBtn.disabled = false;
        checkInBtn.className = 'btn btn-primary';
        
        // Hide "Already Checked In" message
        hideAlreadyCheckedInMessage();
      }
    }
  }

  // Show "Already Checked In" message
  function showAlreadyCheckedInMessage() {
    // Remove existing message if any
    hideAlreadyCheckedInMessage();
    
    // Create and show the message
    const message = document.createElement('div');
    message.id = 'alreadyCheckedInMessage';
    message.className = 'already-checked-in-message';
    message.innerHTML = `
      <div class="message-content">
        <i class="fas fa-check-circle"></i>
        <span>Already Checked In Today</span>
      </div>
    `;
    
    // Insert after the check-in button's parent container
    const actionCard = checkInBtn?.closest('.action-card');
    if (actionCard) {
      actionCard.appendChild(message);
    }
  }

  // Hide "Already Checked In" message
  function hideAlreadyCheckedInMessage() {
    const existingMessage = document.getElementById('alreadyCheckedInMessage');
    if (existingMessage) {
      existingMessage.remove();
    }
  }

  // Update check-out button state
  function updateCheckOutButtonState(isCheckedOut) {
    if (checkOutBtn) {
      if (isCheckedOut) {
        checkOutBtn.textContent = 'Already Checked Out';
        checkOutBtn.disabled = true;
        checkOutBtn.className = 'btn btn-success';
      } else {
        checkOutBtn.textContent = 'Check Out';
        checkOutBtn.disabled = false;
        checkOutBtn.className = 'btn btn-secondary';
      }
    }
  }

  async function refreshToday() {
    try {
      const res = await fetch(`${API_ATT}/today`, { 
        credentials: 'include', 
        headers: { ...getAuthHeaders() } 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load today status');
      
      const att = data.attendance;
      if (att?.checkIn?.time) {
        // Format check-in time
        const checkInDate = new Date(att.checkIn.time);
        checkInTime.textContent = checkInDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        // Update status
        todayStatus.textContent = att.status || 'Present';
        todayStatus.className = `status-value status-${att.status || 'present'}`;
        
        // Hide check-in button since already checked in
        if (checkInBtn) {
          checkInBtn.style.display = 'none';
        }
        
        // Show "Already Checked In" message
        showAlreadyCheckedInMessage();
        
        if (att?.checkOut?.time) {
          // Format check-out time
          const checkOutDate = new Date(att.checkOut.time);
          checkOutTime.textContent = checkOutDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          // Calculate and display total hours
          const hours = Math.floor(att.totalHours);
          const minutes = Math.round((att.totalHours % 1) * 60);
          totalHours.textContent = `${hours}h ${minutes}m`;
          
          // Update button states
          updateCheckOutButtonState(true);
        } else {
          checkOutTime.textContent = '--:--';
          totalHours.textContent = '0h 0m';
          updateCheckOutButtonState(false);
        }
      } else {
        // No check-in today
        checkInTime.textContent = '--:--';
        checkOutTime.textContent = '--:--';
        totalHours.textContent = '0h 0m';
        todayStatus.textContent = 'Not Checked In';
        todayStatus.className = 'status-value status-not-checked';
        
        // Show check-in button since not checked in
        if (checkInBtn) {
          checkInBtn.style.display = 'block';
          checkInBtn.disabled = false;
          checkInBtn.textContent = 'Check In';
          checkInBtn.className = 'btn btn-primary';
        }
        
        // Hide "Already Checked In" message
        hideAlreadyCheckedInMessage();
        
        // Update button states
        updateCheckOutButtonState(false);
      }
    } catch (error) {
      console.error('Error refreshing today status:', error);
      showNotification('Failed to load today\'s attendance status', 'error');
    }
  }

  async function refreshMonthCounts() {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999).toISOString();
      const res = await fetch(`${API_ATT}/history?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, {
        credentials: 'include', 
        headers: { ...getAuthHeaders() } 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      
      const records = Array.isArray(data.attendance) ? data.attendance : [];
      const presentDays = new Set();
      const allDays = new Set();
      
      records.forEach(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        allDays.add(d.getTime());
        if (['present','late','half-day'].includes(r.status)) presentDays.add(d.getTime());
      });
      
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const workingDays = Array.from({length: totalDaysInMonth}, (_,i)=> new Date(now.getFullYear(), now.getMonth(), i+1))
        .filter(d => d.getDay() !== 0 && d.getDay() !== 6) // exclude weekends
        .map(d => d.setHours(0,0,0,0));
      
      const presentCount = workingDays.filter(ts => presentDays.has(ts)).length;
      const absentCount = workingDays.length - presentCount;
      
      daysPresent.textContent = presentCount;
      daysAbsent.textContent = absentCount;
    } catch (error) {
      console.error('Error refreshing month counts:', error);
      showNotification('Failed to load monthly attendance statistics', 'error');
    }
  }

  async function checkIn() {
    if (!checkInBtn || checkInBtn.disabled) return;
    
    setLoading(true);
    checkInBtn.disabled = true;
    checkInBtn.textContent = 'Checking In...';
    
    try {
      // Get current time for immediate UI update
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // Immediately update UI to show check-in time
      checkInTime.textContent = currentTime;
      todayStatus.textContent = 'Present';
      todayStatus.className = 'status-value status-present';
      
      // Hide the check-in button immediately
      checkInBtn.style.display = 'none';
      
      // Show "Already Checked In" message immediately
      showAlreadyCheckedInMessage();
      
      // Show immediate feedback
      showNotification('Recording your check-in time...', 'info');
      
      // Send API request
      const res = await fetch(`${API_ATT}/checkin`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 
          'Content-Type': 'application/json', 
          ...getAuthHeaders() 
        }, 
        body: JSON.stringify({ location: 'dashboard' }) 
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Success - show confirmation
        showNotification('Check-in successful! Welcome to work! 🎉', 'success');
        
        // Refresh data to get accurate status and any late calculations
        await refreshToday();
        await refreshMonthCounts();
      } else {
        // API error - revert UI changes
        checkInTime.textContent = '--:--';
        todayStatus.textContent = 'Not Checked In';
        todayStatus.className = 'status-value status-not-checked';
        
        // Show the check-in button again on error
        checkInBtn.style.display = 'block';
        checkInBtn.disabled = false;
        checkInBtn.textContent = 'Check In';
        
        const errorMessage = result.error || 'Check-in failed. Please try again.';
        showNotification(errorMessage, 'error');
        console.error('Check-in API error:', result);
      }
    } catch (error) {
      // Network/other error - revert UI changes
      checkInTime.textContent = '--:--';
      todayStatus.textContent = 'Not Checked In';
      todayStatus.className = 'status-value status-not-checked';
      
      // Show the check-in button again on error
      checkInBtn.style.display = 'block';
      checkInBtn.disabled = false;
      checkInBtn.textContent = 'Check In';
      
      console.error('Check-in error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally { 
      setLoading(false);
    }
  }

  async function checkOut() {
    if (!checkOutBtn || checkOutBtn.disabled) return;
    
    setLoading(true);
    checkOutBtn.disabled = true;
    checkOutBtn.textContent = 'Checking Out...';
    
    try {
      // Get current time for immediate UI update
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // Immediately update UI to show check-out time
      checkOutTime.textContent = currentTime;
      
      // Show immediate feedback
      showNotification('Recording your check-out time...', 'info');
      
      // Send API request
      const res = await fetch(`${API_ATT}/checkout`, { 
        method: 'POST', 
        credentials: 'include', 
        headers: { 
          'Content-Type': 'application/json', 
          ...getAuthHeaders() 
        }, 
        body: JSON.stringify({ location: 'dashboard' }) 
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Success - show confirmation
        showNotification('Check-out successful! Have a great day! 👋', 'success');
        
        // Update button state
        updateCheckOutButtonState(true);
        
        // Refresh data to get accurate total hours and deductions
        await refreshToday();
        await refreshMonthCounts();
      } else {
        // API error - revert UI changes
        checkOutTime.textContent = '--:--';
        
        const errorMessage = result.error || 'Check-out failed. Please try again.';
        showNotification(errorMessage, 'error');
        console.error('Check-out API error:', result);
      }
    } catch (error) {
      // Network/other error - revert UI changes
      checkOutTime.textContent = '--:--';
      
      console.error('Check-out error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally { 
      setLoading(false);
      checkOutBtn.disabled = false;
      checkOutBtn.textContent = 'Check Out';
    }
  }

  // Add event listeners
  if (checkInBtn) checkInBtn.addEventListener('click', checkIn);
  if (checkOutBtn) checkOutBtn.addEventListener('click', checkOut);

  // Initialize dashboard
  refreshToday();
  refreshMonthCounts();
  
  // Validate token on page load
  validateToken();
  
  // Initialize current time display and update every second
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
});

