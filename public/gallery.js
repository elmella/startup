fetch("http://localhost:3000/home")
  .then(response => response.json())
  .then(data => {
    updateGallery(data);
    updateAnalytics(data);
  });

    // Get the username from LocalStorage
const username = localStorage.getItem('username');

// If a username is stored, use it to replace "Username" in the HTML
if (username) {
  document.getElementById('username').textContent = username;
}

function updateGallery(data) {
  const galleryContainer = document.querySelector('.gallery-grid');
  const residentName = document.getElementById('residentName').value.toLowerCase();
  const unitNumber = document.getElementById('unitNumber').value;
  const roomName = document.getElementById('room').value.toLowerCase();
  const itemName = document.getElementById('item').value.toLowerCase();
  const inspectionDate = document.getElementById('inspectionDate').value;
  const statePassed = document.getElementById('passed').checked;
  const stateFailed = document.getElementById('failed').checked;
  const stateNoPhoto = document.getElementById('noPhoto').checked;

  galleryContainer.innerHTML = ''; // Clear existing content

  data.forEach(entry => {
    if (inspectionDate && entry.due_date !== inspectionDate) {
      return;
    }

    entry.units.forEach(unit => {
      if (unitNumber && unit.unit_number !== unitNumber) {
        return;
      }

      const hasMatchingResident = unit.residents.some(resident => 
        resident.resident_name.toLowerCase().includes(residentName)
      );

      if (residentName && !hasMatchingResident) {
        return;
      }

      unit.rooms.forEach(room => {
        if (roomName && room.room_name.toLowerCase() !== roomName) {
          return;
        }

        room.items.forEach(item => {
          if (itemName && item.item_name.toLowerCase() !== itemName) {
            return;
          }

          item.aspects.forEach(aspect => {
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
              const figure = document.createElement('figure');
              figure.className = 'gallery-item';
              figure.innerHTML = `
                <a href="gallery.html">
                  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
                </a>
                <figcaption>
                  <p>${entry.due_date}</p>
                  <p>${room.room_name}</p>
                  <p>${item.item_name}</p>
                </figcaption>
              `;
              galleryContainer.appendChild(figure);
            }
          });
        });
      });
    });
  });
}

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    updateGallery(data);
    updateAnalytics(data);
  });

function updateGallery(data) {
  const galleryContainer = document.querySelector('.gallery-grid');
  const residentName = document.getElementById('residentName').value.toLowerCase();
  const unitNumber = document.getElementById('unitNumber').value;
  const roomName = document.getElementById('room').value.toLowerCase();
  const itemName = document.getElementById('item').value.toLowerCase();
  const inspectionDate = document.getElementById('inspectionDate').value;
  const statePassed = document.getElementById('passed').checked;
  const stateFailed = document.getElementById('failed').checked;
  const stateNoPhoto = document.getElementById('noPhoto').checked;

  galleryContainer.innerHTML = ''; // Clear existing content

  data.forEach(entry => {
    if (inspectionDate && entry.due_date !== inspectionDate) {
      return;
    }

    entry.units.forEach(unit => {
      if (unitNumber && unit.unit_number !== unitNumber) {
        return;
      }

      const hasMatchingResident = unit.residents.some(resident => 
        resident.resident_name.toLowerCase().includes(residentName)
      );

      if (residentName && !hasMatchingResident) {
        return;
      }

      unit.rooms.forEach(room => {
        if (roomName && room.room_name.toLowerCase() !== roomName) {
          return;
        }

        room.items.forEach(item => {
          if (itemName && item.item_name.toLowerCase() !== itemName) {
            return;
          }

          item.aspects.forEach(aspect => {
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
              const figure = document.createElement('figure');
              figure.className = 'gallery-item';
              figure.innerHTML = `
                <a href="gallery.html">
                  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
                </a>
                <figcaption>
                  <p>${entry.due_date}</p>
                  <p>${room.room_name}</p>
                  <p>${item.item_name}</p>
                </figcaption>
              `;
              galleryContainer.appendChild(figure);
            }
          });
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const filterInputs = document.querySelectorAll('.sidebar input, .sidebar select');
    filterInputs.forEach(input => {
      input.addEventListener('change', () => {
        fetch('data.json')
          .then(response => response.json())
          .then(data => {
            updateGallery(data);
            updateAnalytics(data);
          });
      });
    });
  });