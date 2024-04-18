const API_BASE_URL = 'https://api.startup.cs260party.click';


fetch(`${API_BASE_URL}/api/inspections`, {
  credentials: "include", // Ensures cookies are included in the request
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    // Store the data in LocalStorage
    localStorage.setItem("myData", JSON.stringify(data));

    updateGallery(data);
  })
  .catch((error) => {
    console.error("Failed to fetch inspections:", error);
    alert("Failed to load inspections: " + error.message);
  });

// Get the username from LocalStorage
const username = localStorage.getItem("username");

// If a username is stored, use it to replace "Username" in the HTML
if (username) {
  document.getElementById("username").textContent = username;
}

function updateGallery(data) {
  const galleryContainer = document.querySelector(".gallery-grid");
  const residentNameInput = document.getElementById("residentName");
  const unitNumberInput = document.getElementById("unitNumber").value;
  const roomNameInput = document.getElementById("room");
  const itemNameInput = document.getElementById("item");
  const inspectionDateInput = document.getElementById("inspectionDate");
  const statePassed = document.getElementById("passed").checked;
  const stateFailed = document.getElementById("failed").checked;
  const stateNoPhoto = document.getElementById("noPhoto").checked;

  galleryContainer.innerHTML = ""; // Clear existing content

  data.forEach((entry) => {
    let inspectionDateMatches = true;
    if (inspectionDateInput.value) {
      inspectionDateMatches = entry.due_date === inspectionDateInput.value;
    }

    entry.units.forEach((unit) => {
      let unitMatches = !unitNumberInput.value || unit.unit_number === unitNumberInput.value;
      let residentMatches = !residentNameInput.value || unit.residents.some(resident =>
        resident.resident_name.toLowerCase().includes(residentNameInput.value.toLowerCase()));

      if (inspectionDateMatches && unitMatches && residentMatches) {
        unit.rooms.forEach((room) => {
          let roomMatches = !roomNameInput.value || room.room_name.toLowerCase() === roomNameInput.value.toLowerCase();
          room.items.forEach((item) => {
            let itemMatches = !itemNameInput.value || item.item_name.toLowerCase() === itemNameInput.value.toLowerCase();
            item.aspects.forEach((aspect) => {
              let statusMatches = (statePassed && aspect.status === 1) ||
                                  (stateFailed && aspect.status === 2) ||
                                  (stateNoPhoto && !aspect.image_url);

              if (roomMatches && itemMatches && statusMatches) {
                const figure = document.createElement("figure");
                figure.className = "gallery-item";
                let statusSvg = aspect.status === 1 ? 'assets/pass.svg' :
                                aspect.status === 2 ? 'assets/fail.svg' : 'assets/no-photo.svg';

                figure.innerHTML = `
                  <figcaption>
                    <p>Date: ${entry.due_date}</p>
                    <p>Room: ${room.room_name}</p>
                    <p>Item: ${item.item_name}</p>
                  </figcaption>
                  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
                  <div class="status">
                    <img src="${statusSvg}" class="status-dot" alt="status" />
                  </div>
                     <button class="pass-button" onclick="overrideStatus(event, '${entry.due_date}', '${unit.unit_id}', '${room.room_name}', '${item.item_name}', '${aspect.aspect_name}', 1)">Pass</button>
                     <button class="fail-button" onclick="overrideStatus(event, '${entry.due_date}', '${unit.unit_id}', '${room.room_name}', '${item.item_name}', '${aspect.aspect_name}', 2)">Fail</button>
                `;
                galleryContainer.appendChild(figure);
              }
            });
          });
        });
      }
    });
  });
}


function overrideStatus(
  event,
  dueDate,
  unitId,
  roomName,
  itemName,
  aspectName,
  newStatus
) {
  event.preventDefault(); // to stop the form from submitting and reloading the page
  fetch(`${API_BASE_URL}/api/overrideAspectStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Ensures cookies are included in the request
    body: JSON.stringify({
      dueDate,
      unitId,
      roomName,
      itemName,
      aspectName,
      newStatus,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text(); // You might use response.json() if the server sends JSON
    })
    .then((data) => {
      console.log("Success:", data);
      fetch(`${API_BASE_URL}/api/inspections`, {
        credentials: "include", // Ensures cookies are included in the request
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          // Store the data in LocalStorage
          localStorage.setItem("myData", JSON.stringify(data));

          updateGallery(data);
        })
        .catch((error) => {
          console.error("Failed to fetch inspections:", error);
          alert("Failed to load inspections: " + error.message);
        });
    })
    .catch((error) => {
      console.error("Failed to override status:", error);
      alert("Failed to override status: " + error.message);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const filterInputs = document.querySelectorAll(
    ".sidebar input, .sidebar select"
  );
  filterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      fetch(`${API_BASE_URL}/api/inspections`, {
        credentials: "include", // Ensures cookies are included in the request
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          // Store the data in LocalStorage
          localStorage.setItem("myData", JSON.stringify(data));

          updateGallery(data);
        })
        .catch((error) => {
          console.error("Failed to fetch inspections:", error);
          alert("Failed to load inspections: " + error.message);
        });
    });
  });
});
