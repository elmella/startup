const API_BASE_URL = "https://api.startup.cs260party.click";

class Chat {
  constructor() {
    this.chats = [];
    this.units = new Map();
    this.residents = new Map();
    this.selectedChat = null;
    this.socket = this.configureWebSocket();

    document.addEventListener('DOMContentLoaded', this.initialize.bind(this));
  }

  initialize() {
    this.fetchInitialChats();
    const generateDataButton = document.getElementById("generate-data");
    if (generateDataButton) {
      generateDataButton.addEventListener("click", this.callGenerateData.bind(this));
    }
    document.querySelector('#resident-list').addEventListener('click', this.handleResidentListClick.bind(this));
    document.querySelector('.chat-form').addEventListener('submit', this.handleFormSubmit.bind(this));
  }

  configureWebSocket() {
    const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socket.onopen = () => console.log('WebSocket connection established');
    socket.onmessage = this.handleWebSocketMessage.bind(this);
    socket.onclose = () => console.log('WebSocket connection closed');
    socket.onerror = (error) => console.error('WebSocket error:', error.message);
    return socket;
  }

  handleWebSocketMessage(event) {
    console.log('Message received:', event.data);
    const message = JSON.parse(event.data);
    this.appendMessage(message);
    this.saveMessage(message);
  }

  handleResidentListClick(event) {
    const residentItem = event.target.closest('.resident-item');
    if (residentItem) {
      const name = residentItem.querySelector('.resident-name').textContent;
      const chat = this.chats.find(chat => chat.resident_name === name);
      if (chat) {
        this.loadChat(chat.messages);
      }
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const input = document.querySelector('.chat-form input[type="text"]');
    if (!input.value.trim()) return;
    const message = {
      type: "sent",
      content: input.value,
    };
    this.appendMessage(message);
    this.saveMessage(message);
    this.sendMessage(message);
    input.value = "";
  }

  fetchInitialChats() {
    fetch(`${API_BASE_URL}/api/chats`)
      .then(response => response.json())
      .then(data => {
        this.chats = data.chats;
        this.updateUnits(this.extractUnitsFromChats(data.chats));
        this.updateResidents(this.extractResidentsFromChats(data.chats));
      })
      .catch(error => console.error('Error fetching chat data:', error));
  }

  callGenerateData() {
    fetch(`${API_BASE_URL}/api/generate-chats`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Chat histories generated successfully:", data.message);
      alert("Chat histories generated successfully: " + data.message);
    })
    .catch(error => {
      console.error("Failed to generate chat histories:", error);
      alert("Failed to generate chat histories: " + error.message);
    });
  }

  extractUnitsFromChats(chats) {
    chats.forEach(chat => {
      if (chat.unit_name && chat.unit_id && !this.units.has(chat.unit_id)) {
        this.units.set(chat.unit_id, { name: chat.unit_name });
      }
    });
    return Array.from(this.units.values());
  }

  updateUnits(units) {
    const listGroup = document.querySelector(".list-group");
    listGroup.innerHTML = "";
    units.forEach(unit => {
      const listItem = document.createElement("li");
      listItem.className = "list-item";
      listItem.innerHTML = `<span class="list-text">${unit.name}</span>`;
      listGroup.appendChild(listItem);
    });
  }

  extractResidentsFromChats(chats) {
    chats.forEach(chat => {
      if (chat.resident_name && chat.resident_id && !this.residents.has(chat.resident_id)) {
        this.residents.set(chat.resident_id, {
          name: chat.resident_name,
          lastActive: chat.lastActive,
        });
      }
    });
    return Array.from(this.residents.values());
  }

  updateResidents(residents) {
    const residentList = document.querySelector("#resident-list");
    residentList.innerHTML = "";
    residents.forEach(resident => {
      const item = document.createElement("li");
      item.className = "resident-item";
      item.innerHTML =
        `<p class="resident-name">${resident.name}</p>` +
        `<span class="timestamp">${resident.lastActive || "N/A"}</span>`;
      residentList.appendChild(item);
    });
  }

  loadChat(messages) {
    const chatHeader = document.querySelector(".chat-header h2");
    const chatMessages = document.querySelector(".chat-messages");
    chatMessages.innerHTML = "";
    messages.forEach(message => {
      this.appendMessage(message);
    });
  }

  appendMessage(message) {
    const chatMessages = document.querySelector(".chat-messages");
    let content;
    if (message.type === "photo" && message.src) {
      content = `<figure class="chat-photo"><img src="${message.src}" alt="${message.alt || "Image"}" /></figure>`;
    } else {
      content = `<li class="${message.type === "received" ? "message-received" : "message-sent"}">${message.content}</li>`;
    }
    chatMessages.innerHTML += content;
  }

  saveMessage(message) {
    let messages = JSON.parse(localStorage.getItem("messages")) || {};
    messages[message.name] = messages[message.name] || [];
    messages[message.name].push(message);
    localStorage.setItem("messages", JSON.stringify(messages));
  }

  sendMessage(message) {
    const messageString = JSON.stringify(message);
    this.socket.send(messageString);
    console.log("Message sent:", messageString);
  }
}

const chatApp = new Chat();
