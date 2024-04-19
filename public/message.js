const API_BASE_URL = "https://api.startup.cs260party.click";

document.addEventListener("DOMContentLoaded", function () {
  configureWebSocket();
});

const generateDataButton = document.getElementById("generate-data");
if (generateDataButton) {
  generateDataButton.addEventListener("click", callGenerateData);
}

function callGenerateData() {

  // Fetch call to the generate-chats endpoint
  fetch(`${API_BASE_URL}/api/generate-chats`, {
      method: 'POST',  // Use POST method
      credentials: 'include',  // Include cookies for authentication
      headers: {
          'Content-Type': 'application/json'  // Ensure correct content type
      }
      // Note: No need to send a body with the user ID since it uses the authenticated session
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();  // Parse JSON data from the response
  })
  .then(data => {
    console.log('Chat histories generated successfully:', data.message); // Log the message part of the response
    alert("Chat histories generated successfully: " + data.message);
})
.catch(error => {
    console.error('Failed to generate chat histories:', error);
    alert("Failed to generate chat histories: " + error.message);
});
}


// Fetch initial message history from the server
// Fetch initial message history from the server
// Fetch initial message history from the server
fetch(`${API_BASE_URL}/api/chats`)
  .then((response) => response.json())
  .then((data) => {
    const units = extractUnitsFromChats(data.chats);
    const residents = extractResidentsFromChats(data.chats);
    updateUnits(units);
    updateResidents(residents);
    attachChatLoader(data.chats);
  })
  .catch((error) => {
    console.error('Error fetching chat data:', error);
  });



  function extractUnitsFromChats(chats) {
    const units = new Map();  // Use a map to avoid duplicates
    chats.forEach(chat => {
      if (chat.unit_name && chat.unit_id && !units.has(chat.unit_id)) {
        units.set(chat.unit_id, { name: chat.unit_name });
      }
    });
    return Array.from(units.values());
  }
  
  function extractResidentsFromChats(chats) {
    const residents = new Map();  // Use a map to avoid duplicates
    chats.forEach(chat => {
      if (chat.resident_name && chat.resident_id && !residents.has(chat.resident_id)) {
        residents.set(chat.resident_id, { name: chat.resident_name, lastActive: chat.lastActive });
      }
    });
    return Array.from(residents.values());
  }
  

  function updateUnits(units) {
    if (!Array.isArray(units)) {
      console.error("Expected units to be an array");
      return;
    }
    const listGroup = document.querySelector(".list-group");
    listGroup.innerHTML = "";
    units.forEach((unit) => {
      const listItem = document.createElement("li");
      listItem.className = "list-item";
      listItem.innerHTML = `<span class="list-text">${unit.name}</span>`;
      listGroup.appendChild(listItem);
    });
  }
  
  function updateResidents(residents) {
    if (!Array.isArray(residents)) {
      console.error("Expected residents to be an array");
      return;
    }
    const residentList = document.querySelector("#resident-list");
    residentList.innerHTML = "";
    residents.forEach((resident) => {
      const item = document.createElement("li");
      item.className = "resident-item";
      item.innerHTML =
        `<p class="resident-name">${resident.name}</p>` +
        `<span class="timestamp">${resident.lastActive || "N/A"}</span>`;
      residentList.appendChild(item);
    });
  }
  

  function attachChatLoader(chats) {
    const residentList = document.getElementById("resident-list");
    residentList.addEventListener("click", function (event) {
      const residentItem = event.target.closest(".resident-item");
      if (residentItem) {
        const name = residentItem.querySelector(".resident-name").textContent;
        const chat = chats.find((chat) => chat.resident_name === name);
        if (chat) {
          loadChat(chat.messages);
        }
      }
    });
  }
  
  function loadChat(messages) {
    const chatHeader = document.querySelector(".chat-header h2");
    const chatMessages = document.querySelector(".chat-messages");
    chatMessages.innerHTML = "";  // Clear previous messages
    messages.forEach((message) => {
      appendMessage(message);
    });
  }
  
  function appendMessage(message) {
    const chatMessages = document.querySelector(".chat-messages");
    let content;
    if (message.type === "photo" && message.src) {
      content = `<figure class="chat-photo"><img src="${message.src}" alt="${message.alt || 'Image'}" /></figure>`;
    } else {
      content = `<li class="${message.type === 'received' ? 'message-received' : 'message-sent'}">${message.content}</li>`;
    }
    chatMessages.innerHTML += content;
    document.getElementById('chat-form').value = '';
    // clear the input field
    // chatMessages.scrollTop = chatMessages.scrollHeight;

  }
  


function configureWebSocket() {
  const protocol = window.location.protocol === "http:" ? "ws" : "wss";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.onopen = () => {
    console.log("WebSocket connection established");
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onmessage = async (event) => {
    console.log("Message received:", event.data);
    const message = JSON.parse(event.data);
    appendMessage(message);
    saveMessage(message);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error.message);
  };

}

  // function appendMessage(message) {
  //   const chatMessages = document.querySelector(".chat-messages");
  //   let content;
  //   if (message.type === "photo" && message.src) {
  //     // Check if it's a photo and src is provided
  //     content = `<figure class="chat-photo"><img src="${message.src}" alt="${
  //       message.alt || "Image"
  //     }" /></figure>`;
  //   } else {
  //     content = `<li class="${
  //       message.type === "received" ? "message-received" : "message-sent"
  //     }">${message.content}</li>`;
  //   }
  //   chatMessages.innerHTML += content;
  //   chatMessages.scrollTop = chatMessages.scrollHeight;
  // }

  function saveMessage(message) {
    let messages = JSON.parse(localStorage.getItem("messages")) || {};
    messages[message.name] = messages[message.name] || [];
    messages[message.name].push(message);
    localStorage.setItem("messages", JSON.stringify(messages));
  }

// Send message through WebSocket
function sendMessage(message) {
  const messageString = JSON.stringify(message);
  ws.send(messageString);
  console.log("Message sent:", messageString);
}

// Form submission for sending messages
document
  .querySelector(".chat-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const input = document.querySelector('.chat-form input[type="text"]');
    if (!input.value.trim()) return;

    const message = {
      type: "sent",
      content: input.value,
    };

    appendMessage(message);
    saveMessage(message);
    sendMessage(message);
    input.value = "";
  });
