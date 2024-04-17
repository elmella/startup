fetch("http://localhost:3000/api/inspections")
  .then((response) => response.json())
  .then((data) => {
    // Store the data in LocalStorage
    localStorage.setItem("myData", JSON.stringify(data));

    updateGallery(data);
  });

// Get the username from LocalStorage
const username = localStorage.getItem("username");

// If a username is stored, use it to replace "Username" in the HTML
if (username) {
  document.getElementById("username").textContent = username;
}



function updateGallery(data) {
  const galleryContainer = document.querySelector(".gallery-grid");
  const residentName = document
    .getElementById("residentName")
    .value.toLowerCase();
  const unitNumber = document.getElementById("unitNumber").value;
  const roomName = document.getElementById("room").value.toLowerCase();
  const itemName = document.getElementById("item").value.toLowerCase();
  const inspectionDate = document.getElementById("inspectionDate").value;
  const statePassed = document.getElementById("passed").checked;
  const stateFailed = document.getElementById("failed").checked;
  const stateNoPhoto = document.getElementById("noPhoto").checked;

  galleryContainer.innerHTML = ""; // Clear existing content

  data.forEach((entry) => {
    if (inspectionDate && entry.due_date !== inspectionDate) {
      return;
    }

    entry.units.forEach((unit) => {
      if (unitNumber && unit.unit_number !== unitNumber) {
        return;
      }

      const hasMatchingResident = unit.residents.some((resident) =>
        resident.resident_name.toLowerCase().includes(residentName)
      );

      if (residentName && !hasMatchingResident) {
        return;
      }

      unit.rooms.forEach((room) => {
        if (roomName && room.room_name.toLowerCase() !== roomName) {
          return;
        }

        room.items.forEach((item) => {
          if (itemName && item.item_name.toLowerCase() !== itemName) {
            return;
          }

          item.aspects.forEach((aspect) => {
            let matchState = true;
            if (statePassed && aspect.status !== 1) {
              matchState = false;
            }
            if (stateFailed && aspect.status !== 0) {
              matchState = false;
            }
            if (stateNoPhoto && aspect.image_url) {
              matchState = false;
            }

            if (matchState) {
              const figure = document.createElement("figure");
              figure.className = "gallery-item";
                let statusSvg = '';
                if (aspect.status === 1) {
                  statusSvg = 'assets/pass.svg';
                } else if (aspect.status === 2) {
                  statusSvg = 'assets/fail.svg';
                } else {
                  statusSvg = 'assets/no-photo.svg';
                }

              figure.innerHTML = `


  <figcaption>
    <p>${entry.due_date}</p>
    <p>${room.room_name}</p>
    <p>${item.item_name}</p>
  </figcaption>
  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
  <div class="status">
    <img src="${statusSvg}" class="status-dot" alt="status" />
  </div>
  <button class="override-button" onclick="overrideStatus(event, '${entry.due_date}', '${unit.unit_id}', '${room.room_name}', '${item.item_name}', '${aspect.aspect_name}', 1)">Override</button>


              `;
              galleryContainer.appendChild(figure);
            }
          });
        });
      });
    });
  });
}

function overrideStatus(event, dueDate, unitId, roomName, itemName, aspectName, newStatus) {
  console.log('Overriding status:', dueDate, unitId, roomName, itemName, aspectName, newStatus);
  event.preventDefault(); // to stop the form from submitting and reloading the page
  fetch('http://localhost:3000/api/overrideAspectStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dueDate, unitId, roomName, itemName, aspectName, newStatus })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Override successful:', data);
    alert('Status overridden successfully');
  })
  .catch(error => {
    console.error('Error overriding status:', error);
    alert('Failed to override status: ' + error.message);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const filterInputs = document.querySelectorAll(
    ".sidebar input, .sidebar select"
  );
  filterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      fetch("http://localhost:3000/api/inspections")
        .then((response) => response.json())
        .then((data) => {
          updateGallery(data);
        });
    });
  });
});
