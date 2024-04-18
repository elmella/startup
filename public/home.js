const API_BASE_URL = "https://api.startup.cs260party.click";

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
    updateAnalytics(data);
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
  // while (inspectionContainer.firstChild) {
  //   inspectionContainer.removeChild(inspectionContainer.firstChild);
  // }
  // Iterate over each entry in the data array
  data.forEach((entry) => {
    // Ensure units exist and are an array
    if (!entry.units || !Array.isArray(entry.units)) {
      console.error("Units are undefined or not an array in", entry);
      return;
    }
    let totalPassed = 0,
      totalFailed = 0,
      totalRemaining = 0;
    // Iterate over each unit
    entry.units.forEach((unit) => {
      // Ensure rooms exist and are an array
      if (!unit.rooms || !Array.isArray(unit.rooms)) {
        console.error("Rooms are undefined or not an array in", unit);
        return;
      }

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

            let statusSvg = "";
            if (aspect.status === 1) {
              statusSvg = "assets/pass.svg";
            } else if (aspect.status === 2) {
              statusSvg = "assets/fail.svg";
            } else {
              statusSvg = "assets/no-photo.svg";
            }
            figure.innerHTML = `
                <a href="gallery.html">
                  <img src="${aspect.image_url}" alt="${aspect.aspect_name}" />
                <figcaption>
                  <p>${entry.due_date}</p>
                    <p>Unit ${unit.unit_number}</p>
                  <p>${room.room_name}</p>
                  <p>${item.item_name}</p>
                </figcaption>
                <div class="status">
                <img src="${statusSvg}" class="status-dot" alt="status" />
              </div>
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
    });

    const svg = generateDynamicSVG(totalPassed, totalFailed, totalRemaining);
    const div = document.createElement("div");
    div.className = "row-container";
    div.innerHTML = `
      <div class="inspection-meta">
        <div class="inspection-date">${entry.due_date}</div>
        <div class="inspection-progress">${svg}</div>
      </div>
      <div class="photo-button-item" onclick="analyzeInspectionData('${entry.due_date}')">
        <img src="assets/robot.svg" alt="Show Photos" />
      </div>
      <div class="download-button-item" onclick="downloadCSV('${entry.due_date}')">
        <img src="assets/download.svg" alt="Download CSV" />
      </div>
    `;
    inspectionContainer.appendChild(div);
  });
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
                    : aspect.status === 2
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

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("Data is undefined, not an array, or empty");
    return;
  }

  // Sort the data by due date in descending order
  data.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  // Get the inspection with the latest due date
  const recentInspection = data[0];

  console.log("Latest due date:", recentInspection.dueDate);

  recentInspection.units.forEach((unit) => {
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

  // Update the SVG with the new percentages
  const analyticsSVG = generateDynamicSVG(
    passed,
    failed,
    totalAspects - passed - failed
  );
  const analyticsContent = document.querySelector(".analytics-content");

  // Clear existing content
  analyticsContent.innerHTML = `
    <div class="analytics-svg-container">
  <h2>Current Inspection</h2>
      ${analyticsSVG}
      <div class="analytics-text">
        <p>${passedPercent}% Passed</p>
        <p>${failedPercent}% Failed</p>
        <p>${notDonePercent}% Not Done</p>
      </div>
    </div>`;
}

function analyzeInspectionData(dueDate) {
  // Show loading icon
  document.getElementById("loadingIcon").style.display = "flex";

  fetch(`${API_BASE_URL}/api/analyze/${dueDate}`, {
    credentials: "include", // Ensures cookies, including authentication cookies, are sent with the request
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Analysis completed successfully:", data);
      // Update the gallery and analytics with the new data
      getInspections();
    })
    .catch((error) => {
      console.error("Error during inspection analysis:", error);
      alert(`Failed to perform analysis: ${error.message}`);
    })
    .finally(() => {
      // Hide loading icon
      document.getElementById("loadingIcon").style.display = "none";
    });
}

function getInspections() {
  fetch(`${API_BASE_URL}/api/inspections`)
    .then((response) => response.json())
    .then((data) => {
      // Store the data in LocalStorage
      localStorage.setItem("myData", JSON.stringify(data));

      updateGallery(data);
      updateAnalytics(data);
    });
}

function createSampleUnits() {
  fetch(`${API_BASE_URL}/api/sample-units`, {
    method: "POST", // POST method to create data
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include", // Ensure cookies are sent with the request for authentication
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Sample units created:", data);
      // Additional actions based on successful creation
    })
    .catch((error) => {
      console.error("Failed to create sample units:", error);
    });
}

document
  .getElementById("createInspectionButton")
  .addEventListener("click", createInspectionForSampleUnits);

function createInspectionForSampleUnits() {
  // Query the user for a due date
  const dueDate = prompt(
    "Please enter a due date for the inspection (YYYY-MM-DD):"
  );

  // Validate the due date
  if (!dueDate || !/^(\d{4})-(\d{2})-(\d{2})$/.test(dueDate)) {
    alert("Invalid due date. Please enter a date in the format YYYY-MM-DD.");
    return;
  }

  const userId = localStorage.getItem("userId"); // Ensure the user ID is stored in localStorage or obtained dynamically

  fetch(`${API_BASE_URL}/api/inspections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      dueDate: dueDate,
      userId: userId, // Send the user ID whose units you want to inspect
    }),
    credentials: "include", // Include cookies for authentication if necessary
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Inspection created successfully:", data);
      alert("Inspection created successfully!");
      // You might want to update the UI or fetch new data here
    })
    .catch((error) => {
      console.error("Failed to create inspection:", error);
      alert("Failed to create inspection: " + error.message);
    });
}

// Example of calling createSampleUnits on button click or as needed
document
  .getElementById("createSampleButton")
  .addEventListener("click", createSampleUnits);
