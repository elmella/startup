document.addEventListener("DOMContentLoaded", function () {
  fetch("message-data.json")
    .then((response) => response.json())
    .then((data) => {
      updateUnits(data.units);
      updateResidents(data.residents);
      loadChat(data.chats, "April");
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
    }

    function saveMessage(message) {
        // Retrieve the current list of messages from local storage
        let messages = localStorage.getItem('messages');
        
        // Parse the JSON string into an array
        messages = messages ? JSON.parse(messages) : [];
        
        // Add the new message to the list
        messages.push(message);
        
        // Save the updated list back to local storage
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
      
        // Save the message to local storage
        saveMessage(message);
      }

      document.querySelector('.chat-form').addEventListener('submit', function(event) {
        // Prevent the form from being submitted normally
        event.preventDefault();
      
        // Get the message from the form
        const message = {
          type: 'sent', // or 'received', depending on the context
          content: document.querySelector('.chat-form input[type="text"]').value
        };
      
        // Append the message to the chat
        appendMessage(message);
      
        // Save the message to local storage
        saveMessage(message);
      
        // Clear the form
        event.target.reset();
      });
});