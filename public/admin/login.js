document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies for JWT
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if(res.ok) {
            // Store admin info in localStorage if needed
            if (data.admin) {
                localStorage.setItem('adminInfo', JSON.stringify(data.admin));
            }
            // Store token in localStorage for client-side access if needed
            if (data.token) {
                localStorage.setItem('adminToken', data.token);
            }
            window.location.href = './dashboard/dashboard.html';
        } else {
            errorDiv.textContent = data.message || 'Invalid email or password.';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Server error. Please try again later.';
        errorDiv.style.display = 'block';
    }
}); 