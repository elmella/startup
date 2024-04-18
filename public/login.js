const API_BASE_URL = "https://api.startup.cs260party.click";

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const payload = {
    email: email,
    password: password,
  };

  fetch(`${API_BASE_URL}/api/auth/login`, {
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
      throw new Error("Failed to login");
    })
    .then((data) => {
      localStorage.setItem("username", email);
      localStorage.setItem("userId", data.id);

      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Login Error:", error);
      alert("Login failed: " + error.message);
    });
}
