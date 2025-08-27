// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing registration form...');
    
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) {
        console.error('Registration form not found!');
        return;
    }
    
    console.log('Registration form found, adding event listener...');
    
    // Registration Form Handler
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted, processing registration...');
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('Form data collected:', { firstName, lastName, email, phone });

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const data = { firstName, lastName, email, phone, password };

        try {
            console.log('Sending registration request to API...');
            const res = await fetch('/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            console.log('API response:', result);
            
            if (res.ok) {
                // Show success message with login instructions
                showSuccessMessage(firstName, email);
            } else {
                alert(result.message || result.error || 'Registration failed.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('An error occurred. Please try again.');
        }
    });
    
    console.log('Registration form event listener added successfully');
});

// Show success message with login instructions
function showSuccessMessage(firstName, email) {
    console.log('Showing success message for:', firstName);
    
    const successHTML = `
        <div class="success-container">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Registration Successful! 🎉</h3>
            <p>Welcome, <strong>${firstName}</strong>! Your account has been created successfully.</p>
            <div class="login-info">
                <p><strong>You can now login with:</strong></p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> [The password you just created]</p>
            </div>
            <div class="admin-note">
                <i class="fas fa-info-circle"></i>
                <p>An admin will complete your profile with department, position, salary, and hire date details.</p>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="goToLogin()">
                    <i class="fas fa-sign-in-alt"></i> Go to Login
                </button>
                <button class="btn btn-secondary" onclick="stayOnPage()">
                    <i class="fas fa-home"></i> Stay Here
                </button>
            </div>
        </div>
    `;
    
    // Replace the form with success message
    const form = document.querySelector('.register-form');
    const infoNote = document.querySelector('.info-note');
    const registerLink = document.querySelector('p');
    
    if (form) form.style.display = 'none';
    if (infoNote) infoNote.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    
    // Insert success message
    const container = document.querySelector('.register-container');
    if (container) {
        container.insertAdjacentHTML('beforeend', successHTML);
        console.log('Success message displayed');
    } else {
        console.error('Container not found for success message');
    }
}

// Go to login page
function goToLogin() {
    console.log('Redirecting to login page...');
    window.location.href = 'login.html';
}

// Stay on registration page
function stayOnPage() {
    console.log('Reloading registration page...');
    location.reload();
}
