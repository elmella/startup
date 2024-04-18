const API_BASE_URL = "https://api.startup.cs260party.click";

document.addEventListener("DOMContentLoaded", function () {
  configureWebSocket();
});

// Fetch initial message history from the server
fetch(`${API_BASE_URL}/messages`)
  .then((response) => response.json())
  .then((data) => {
    updateUnits(data.units);
    updateResidents(data.residents);
    attachChatLoader(data.chats);
  });

// Update UI with units data
function updateUnits(units) {
  const listGroup = document.querySelector(".list-group");
  listGroup.innerHTML = "";
  units.forEach((unit) => {
    const listItem = document.createElement("li");
    listItem.className = "list-item";
    listItem.innerHTML = `<span class="list-text">${unit.name}</span>`;
    listGroup.appendChild(listItem);
  });
}

// Update UI with residents data
function updateResidents(residents) {
  const residentList = document.querySelector("#resident-list");
  residentList.innerHTML = "";
  residents.forEach((resident) => {
    const item = document.createElement("li");
    item.className = "resident-item";
    item.innerHTML = `<p class="resident-name">${resident.name}</p>
                              <span class="timestamp">${resident.lastActive}</span>`;
    residentList.appendChild(item);
  });
}

// Load chat interface for a resident
function loadChat(chats, person) {
  const chatHeader = document.querySelector(".chat-header h2");
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.innerHTML = "";
  chatHeader.textContent = person || "April";

  const chat = chats.find((chat) => chat.name === person);
  if (chat) {
    chat.messages.forEach((message) => {
      appendMessage(message);
    });
  }
}

function configureWebSocket() {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.onopen = () => {
    console.log("WebSocket connection established");
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onmessage = event => {
    console.log("Message received:", event.data);
    const message = JSON.parse(event.data);
    appendMessage(message);
    saveMessage(message);
  };

  function appendMessage(message) {
    const chatMessages = document.querySelector(".chat-messages");
    let content;
    if (message.type === "photo") {
      content = `<figure class="chat-photo"><img src="${message.src}" alt="${message.alt}" /></figure>`;
    } else {
      content = `<li class="${message.type === "received" ? "message-received" : "message-sent"}">${message.content}</li>`;
    }
    chatMessages.innerHTML += content;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function saveMessage(message) {
    let messages = JSON.parse(localStorage.getItem("messages")) || {};
    messages[message.name] = messages[message.name] || [];
    messages[message.name].push(message);
    localStorage.setItem("messages", JSON.stringify(messages));
  }
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

// Attach click event listener to resident list for loading chats
function attachChatLoader(chats) {
  document
    .getElementById("resident-list")
    .addEventListener("click", function (event) {
      const residentItem = event.target.closest(".resident-item");
      if (residentItem) {
        loadChat(
          chats,
          residentItem.querySelector(".resident-name").textContent
        );
      }
    });
}
