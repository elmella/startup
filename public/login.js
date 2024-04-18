function handleLogin(event) {
  event.preventDefault();  // Prevent the default form submission

  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;  // Assume there's a password input field

  // Create the payload for the POST request
  const payload = {
      email: email,
      password: password
  };

  // Use fetch API to make a POST request to the login endpoint
  fetch('/api/auth/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
  })
  .then(response => {
      if (response.ok) {
          return response.json();  // Process the response if it's a successful login
      }
      throw new Error('Failed to login');  // Throw an error if login fails
  })
  .then(data => {
      localStorage.setItem('username', email);  // Save the email as username in localStorage
      localStorage.setItem('userId', data.id);  // Save the user ID in localStorage
      
      window.location.href = 'home.html';  // Redirect to home page
  })
  .catch(error => {
      console.error('Login Error:', error);
      alert('Login failed: ' + error.message);  // Show an error message
  });
}
