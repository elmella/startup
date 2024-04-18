const PORT = 4000;

function handleCreateAccount(event) {
    event.preventDefault();

    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const payload = {
        email: email,
        password: password
    };

    fetch(`http://localhost:${PORT}/api/auth/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to create account');
    })
    .then(data => {
        alert('Account created successfully!');
        window.location.href = 'home.html';
    })
    .catch(error => {
        console.error('Create Account Error:', error);
        alert('Create account failed: ' + error.message);
    });
}
