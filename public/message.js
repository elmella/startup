document.addEventListener("DOMContentLoaded", function () {
  const ws = new WebSocket("wss://example.com/chat");
  ws.onopen = function () {
    console.log("WebSocket connection established");
  };

  ws.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };

  ws.onmessage = function (event) {
    console.log("Message received:", event.data);
    const message = JSON.parse(event.data);
    appendMessage(message);
    saveMessage(message);
  };

  fetch("http://localhost:3000/messages")
    .then(response => response.json())
    .then(data => {
      updateUnits(data.units);
      updateResidents(data.residents);
      document.getElementById('resident-list').addEventListener('click', function(event) {
        const residentItem = event.target.closest('.resident-item');
        if (residentItem) {
          loadChat(data.chats, residentItem.querySelector('.resident-name').textContent);
        }
      });
    });

  function updateUnits(units) {
    const listGroup = document.querySelector(".list-group");
    listGroup.innerHTML = ""; // Clear existing content
    units.forEach((unit) => {
      const listItem = document.createElement("li");
      listItem.className = "list-item";
      listItem.innerHTML = `<span class="list-text">${unit.name}</span>`;
      listGroup.appendChild(listItem);
    });
  }

  function updateResidents(residents) {
    const residentList = document.querySelector("#resident-list");
    residentList.innerHTML = ""; // Clear existing content
    residents.forEach((resident) => {
      const item = document.createElement("li");
      item.className = "resident-item";
      item.innerHTML = `<p class="resident-name">${resident.name}</p>
                              <span class="timestamp">${resident.lastActive}</span>`;
      item.addEventListener("click", function () {
        loadChat(data.chats, resident.name);
      });
      residentList.appendChild(item);
    });
  }

  function loadChat(chats, person) {
    const chatHeader = document.querySelector(".chat-header h2");
    const chatMessages = document.querySelector(".chat-messages");
    chatMessages.innerHTML = ""; // Clear existing content
    chatHeader.textContent = person || "April";

    // chats is an array, get the object with the name that matches the person
    const chat = chats.find((chat) => chat.name === person);
    if (chat) {
      chat.messages.forEach((message) => {
        appendMessage(message);
      });
    }
  }

  function saveMessage(message) {
    // Get the existing messages from localStorage
    let messages = JSON.parse(localStorage.getItem('messages')) || {};
  
    // If this resident has no messages yet, create an array for them
    if (!messages[message.name]) {
      messages[message.name] = [];
    }
  
    // Add the new message to this resident's array of messages
    messages[message.name].push(message);
  
    // Save the updated messages back to localStorage
    localStorage.setItem('messages', JSON.stringify(messages));
  }

  function appendMessage(message) {
    const chatMessages = document.querySelector(".chat-messages");
    let content;
    if (message.type === "photo") {
      content = `<figure class="chat-photo">
                           <img src="${message.src}" alt="${message.alt}" />
                       </figure>`;
    } else {
      content = `<li class="${
        message.type === "received" ? "message-received" : "message-sent"
      }">${message.content}</li>`;
    }
    chatMessages.innerHTML += content;
    // Optionally scroll to the bottom of the chat window
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage(message) {
    const messageString = JSON.stringify(message);
    ws.send(messageString);
    console.log("Message sent:", messageString);
  }

  document
    .querySelector(".chat-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const input = document.querySelector('.chat-form input[type="text"]');
      if (!input.value.trim()) return; // Prevent sending empty messages

      const message = {
        type: "sent", // Adjust based on the sender (could be 'received' if simulating incoming messages)
        content: input.value,
      };

      appendMessage(message);
      saveMessage(message);
      sendMessage(message);

      input.value = ""; // Clear input after sending
    });
});
