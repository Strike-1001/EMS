document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const data = { email, password, role: 'user' };

    console.log('Login attempt for:', email);

    try {
        const res = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        console.log('Login response:', result);
        
        if (res.ok && result.success) {
            // Show success message
            showSuccessMessage('Login successful! Redirecting to dashboard...');
            
            // Store user info in localStorage for dashboard
            if (result.user) {
                localStorage.setItem('userInfo', JSON.stringify(result.user));
                localStorage.setItem('userToken', result.token);
            }
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard/dashboard.html';
            }, 1500);
        } else {
            // Show error message
            const errorMsg = result.message || result.error || 'Login failed. Please check your credentials.';
            showErrorMessage(errorMsg);
        }
    } catch (err) {
        console.error('Login error:', err);
        showErrorMessage('Network error. Please check your connection and try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'message success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Insert before the form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(successDiv, form);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Insert before the form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(errorDiv, form);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}