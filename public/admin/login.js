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
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if(res.ok) {
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