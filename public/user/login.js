document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const data = { email, password, role: 'user' };

    try {
        const res = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            window.location.href = 'dashboard/dashboard.html';
        } else {
            alert(result.message || result.error || 'Login failed.');
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
    }
}); 