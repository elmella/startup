// const createAccount = async () => {
//     const data = {
//       fname: firstName,
//       lname: lastName,
//       email: email.toLowerCase(),
//       password: password,
//       role: "manager", // Adjust according to your requirements
//       ru_key: null,
//     };

//     console.log("Creating account with data: ", JSON.stringify(data));

//     try {
//       // Step 1: Create the user account
//       let response = await fetch("http://54.158.97.55/property/users/add", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });

//       const accountResponseData = await response.json();
//       if (response.status === 201) {
//         alert("User created successfully");

//         // Step 2: Immediately log in the new user
//         response = await fetch(
//           "http://54.158.97.55/property/users/login", // Adjust this endpoint if necessary
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               email: data.email,
//               password: data.password,
//             }),
//           }
//         );

//         const loginResponseData = await response.json();
//         if (response.ok) {
//             Alert.alert("Login Successful", "You are now logged in!");
//             const token = loginResponseData.token;
//             const userId = loginResponseData.user_id; // Get user_id from the response
//           } else {
//           alert("Error: " + loginResponseData.error);
//         }
//       } else {
//         alert("Error: " + accountResponseData.error);
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

function handleLogin(event) {
    event.preventDefault();  // Prevent the default form submission
  
    const email = document.getElementById('emailInput').value;  // Get the email from the form
    localStorage.setItem('username', email);  // Save the email as username in localStorage
  
    window.location.href = 'home.html';  // Redirect to home page
  }