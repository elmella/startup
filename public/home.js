fetch("http://localhost:3000/api/inspections")
  .then((response) => response.json())
  .then((data) => {
    // Store the data in LocalStorage
    localStorage.setItem("myData", JSON.stringify(data));

    updateGallery(data);
    updateAnalytics(data);
  });

// Get the username from LocalStorage
const username = localStorage.getItem("username");

// If a username is stored, use it to replace "Username" in the HTML
if (username) {
  document.getElementById("username").textContent = username;
}

function generateDynamicSVG(numberPassed, numberFailed, numberRemaining) {
  // Calculate the percentage of passed and failed tests
  const totalUnits = numberPassed + numberFailed + numberRemaining;
  let passedPercent = (numberPassed / totalUnits) * 100;
  let failedPercent = (numberFailed / totalUnits) * 100;

  passedPercent = Math.min(100, Math.max(0, passedPercent));
  failedPercent = Math.min(100 - passedPercent, Math.max(0, failedPercent));

  // Special case: if passedPercent is 100, return a fully green circle with a lighter green filled center
  if (passedPercent === 100) {
    return `
              <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" fill="#CCFCD9" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#61EF94" stroke-width="10"/>
              </svg>
          `;
  }

  // Special case: if failedPercent is 100, return a fully yellow circle
  if (failedPercent === 100) {
    return `
              <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#EFE161" stroke-width="10"/>
              </svg>
          `;
  }

  // Calculate the angles for the green, yellow, and grey segments
  const greenAngle = (passedPercent / 100) * 360;
  const yellowAngle = (failedPercent / 100) * 360;
  const greyAngle = 360 - greenAngle - yellowAngle;

  // Calculate the coordinates for the arc endpoints
  const greenX = Math.cos((Math.PI / 180) * (90 - greenAngle));
  const greenY = -Math.sin((Math.PI / 180) * (90 - greenAngle));
  const yellowX = Math.cos((Math.PI / 180) * (90 - greenAngle - yellowAngle));
  const yellowY = -Math.sin((Math.PI / 180) * (90 - greenAngle - yellowAngle));

  // Generate the SVG code for other cases
  const svgCode = `
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ccc" stroke-width="10"/>
              ${
                passedPercent > 0
                  ? `<path d="M50 10 A 40 40 0 ${greenAngle > 180 ? 1 : 0} 1 ${
                      greenX * 40 + 50
                    } ${
                      greenY * 40 + 50
                    }" stroke="#61EF94" stroke-width="10" fill="none"/>`
                  : ""
              }
              ${
                failedPercent > 0
                  ? `<path d="M${greenX * 40 + 50} ${
                      greenY * 40 + 50
                    } A 40 40 0 ${yellowAngle > 180 ? 1 : 0} 1 ${
                      yellowX * 40 + 50
                    } ${
                      yellowY * 40 + 50
                    }" stroke="#EFE161" stroke-width="10" fill="none"/>`
                  : ""
              }
              ${
                greyAngle > 0
                  ? `<path d="M${yellowX * 40 + 50} ${
                      yellowY * 40 + 50
                    } A 40 40 0 ${
                      greyAngle > 180 ? 1 : 0
                    } 1 50 10" stroke="#A9AFAA" stroke-width="10" fill="none"/>`
                  : ""
              }
          </svg>
      `;

  return svgCode;
}

// Function to dynamically create gallery items
function updateGallery(data) {
  const galleryContainer = document.querySelector(".gallery-grid");
  const inspectionContainer = document.querySelector(".inspection-section");
  galleryContainer.innerHTML = ""; // Clear existing content

  // Check if data is an array and has content
  if (!data || !Array.isArray(data)) {
    console.error("Data is undefined or not an array");
    return;
  }

  // Iterate over each entry in the data array
  data.forEach((entry) => {
    // Ensure units exist and are an array
    if (!entry.units || !Array.isArray(entry.units)) {
      console.error("Units are undefined or not an array in", entry);
      return;
    }

    // Iterate over each unit
    entry.units.forEach((unit) => {
      // Ensure rooms exist and are an array
      if (!unit.rooms || !Array.isArray(unit.rooms)) {
        console.error("Rooms are undefined or not an array in", unit);
        return;
      }

      let totalPassed = 0,
        totalFailed = 0,
        totalRemaining = 0;

      // Iterate over each room
      unit.rooms.forEach((room) => {
        // Ensure items exist and are an array
        if (!room.items || !Array.isArray(room.items)) {
          console.error("Items are undefined or not an array in", room);
          return;
        }

        // Iterate over each item
        room.items.forEach((item) => {
          // Ensure aspects exist and are an array
          if (!item.aspects || !Array.isArray(item.aspects)) {
            console.error("Aspects are undefined or not an array in", item);
            return;
          }

          // Iterate over each aspect
          item.aspects.forEach((aspect) => {
            const figure = document.createElement("figure");
            figure.className = "gallery-item";
            figure.innerHTML = `
                <a href="gallery.html">
                  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
                <figcaption>
                  <p>${entry.due_date}</p>
                    <p>Unit ${unit.unit_number}</p>
                  <p>${room.room_name}</p>
                  <p>${item.item_name}</p>
                </figcaption>
                </a>
              `;
            galleryContainer.appendChild(figure);

            if (aspect.status === 1) {
              totalPassed++;
            } else if (aspect.status === 2) {
              totalFailed++;
            } else {
              totalRemaining++;
            }
          });
        });
      });

      const svg = generateDynamicSVG(totalPassed, totalFailed, totalRemaining);
      const div = document.createElement("div");
      div.className = "row-container";
      div.innerHTML = `
      <div class="inspection-meta">
        <div class="inspection-date">${entry.due_date}</div>
        <div class="inspection-progress">${svg}</div>
      </div>
      <div class="photo-button-item" onclick="showPhotos('${entry.due_date}')">
        <img src="assets/photo-button.svg" alt="Show Photos" />
      </div>
      <div class="download-button-item" onclick="downloadCSV('${entry.due_date}')">
        <img src="assets/download.svg" alt="Download CSV" />
      </div>
    `;
      inspectionContainer.appendChild(div);
    });
  });
}

function showPhotos(date) {
  console.log("Showing photos for inspection on", date);
  const data = JSON.parse(localStorage.getItem("myData"));
  const photos = [];

  data.forEach((entry) => {
    if (entry.due_date === date) {
      entry.units.forEach((unit) => {
        unit.rooms.forEach((room) => {
          room.items.forEach((item) => {
            item.aspects.forEach((aspect) => {
              if (aspect.image_url) {
                photos.push(aspect.image_url);
              }
            });
          });
        });
      });
    }
  });

  const photoContainer = document.getElementById("photoContainer");
  const backButton = document.getElementById("backButton");

  photoContainer.style.display = "block"; // Make the container visible
  backButton.style.display = "block"; // Make the back button visible
  // Clear the existing images
  photoContainer.innerHTML = "";
  photoContainer.appendChild(backButton); // Append the back button to the container
  if (photos.length === 0) {
    photoContainer.textContent = "No photos found for this inspection";
    photoContainer.appendChild(backButton)
  } else {
    photos.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      img.style.marginRight = "10px"; // Add some space between the images
      photoContainer.appendChild(img);
    });
  }
}

function downloadCSV(date) {
  const data = JSON.parse(localStorage.getItem("myData"));
  const csvRows = [];
  const headers = ["Date", "Unit", "Room", "Item", "Aspect", "Status"];
  csvRows.push(headers.join(","));

  data.forEach((entry) => {
    if (entry.due_date === date) {
      entry.units.forEach((unit) => {
        unit.rooms.forEach((room) => {
          room.items.forEach((item) => {
            item.aspects.forEach((aspect) => {
              csvRows.push(
                [
                  entry.due_date,
                  unit.unit_number,
                  room.room_name,
                  item.item_name,
                  aspect.aspect_name,
                  aspect.status === 1
                    ? "Passed"
                    : aspect.status === 0
                    ? "Failed"
                    : "Not Done",
                ].join(",")
              );
            });
          });
        });
      });
    }
  });

  const csvData = csvRows.join("\n");
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `inspection_${date}.csv`);
  a.click();
}

function updateAnalytics(data) {
  let totalAspects = 0,
    passed = 0,
    failed = 0;

  console.log("Data received for analytics:", data);

  if (!data || !Array.isArray(data)) {
    console.error("Data is undefined or not an array");
    return;
  }

  data.forEach((entry) => {
    entry.units.forEach((unit) => {
      unit.rooms.forEach((room) => {
        room.items.forEach((item) => {
          item.aspects.forEach((aspect) => {
            totalAspects++;
            if (aspect.status === 1) passed++;
            if (aspect.status === 2) failed++;
          });
        });
      });
    });
  });

  if (totalAspects === 0) {
    console.error("No aspects found for analytics calculations.");
    return;
  }

  const passedPercent = ((passed / totalAspects) * 100).toFixed(2);
  const failedPercent = ((failed / totalAspects) * 100).toFixed(2);
  const notDonePercent = (100 - passedPercent - failedPercent).toFixed(2);

  console.log(
    `Analytics - Passed: ${passedPercent}%, Failed: ${failedPercent}%, Not Done: ${notDonePercent}%`
  );

  const barChartContainer = document.querySelector(".bar-chart-container");
  const passedBar = barChartContainer
    ? barChartContainer.querySelector(".passed")
    : null;
  const failedBar = barChartContainer
    ? barChartContainer.querySelector(".failed")
    : null;
  const notDoneBar = barChartContainer
    ? barChartContainer.querySelector(".not-done")
    : null;

  if (passedBar) {
    passedBar.style.flexBasis = `${passedPercent}%`;
    passedBar.textContent = `${passedPercent}% Passed`;
  } else {
    console.error("Passed bar not found");
  }

  if (failedBar) {
    failedBar.style.flexBasis = `${failedPercent}%`;
    failedBar.textContent = `${failedPercent}% Failed`;
  } else {
    console.error("Failed bar not found");
  }

  if (notDoneBar) {
    notDoneBar.style.flexBasis = `${notDonePercent}%`;
    notDoneBar.textContent = `${notDonePercent}% Not Done`;
  } else {
    console.error("Not Done bar not found");
  }
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


document.getElementById("backButton").addEventListener("click", () => {
  const photoContainer = document.getElementById("photoContainer");
  const backButton = document.getElementById("backButton");

  photoContainer.style.display = "none"; // Hide the container
  backButton.style.display = "none"; // Hide the back button

  // remove the images from the container
  while (
    photoContainer.firstChild &&
    photoContainer.firstChild !== backButton
  ) {
    photoContainer.firstChild.remove();
  }
});
