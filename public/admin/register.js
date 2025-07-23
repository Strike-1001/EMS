document.getElementById('adminRegisterForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const confirmPassword = document.getElementById('adminConfirmPassword').value.trim();
    const messageDiv = document.getElementById('registerMessage');

    messageDiv.textContent = '';
    messageDiv.style.color = '#e74c3c'; // default to red for errors

    // Check for empty fields after trimming
    if (!name || !email || !password || !confirmPassword) {
        messageDiv.textContent = 'All fields are required.';
        return;
    }

    if (password !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match.';
        return;
    }

    try {
        const res = await fetch('/api/admin/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            messageDiv.style.color = '#28a745'; // green
            messageDiv.textContent = 'Registration successful! You can now log in.';
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        } else {
            // 
            messageDiv.textContent = data.message || data.error || 'Registration failed.';
        }

    } catch (err) {
        console.error('Fetch error:', err);
        messageDiv.textContent = 'Server error. Please try again later.';
    }
});
