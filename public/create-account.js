const API_BASE_URL = "https://api.startup.cs260party.click";

function handleCreateAccount(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  const confirmPassword = document.getElementById("confirmPasswordInput").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const payload = {
    email: email,
    password: password,
  };

  fetch(`${API_BASE_URL}/api/auth/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to create account");
    })
    .then((data) => {
      alert("Account created successfully!");
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Create Account Error:", error);
      alert("Create account failed: " + error.message);
    });
}
