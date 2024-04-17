// Fetch JSON data from the server
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    updateGallery(data);
    updateAnalytics(data);
  });


// Function to dynamically create gallery items
function updateGallery(data) {
    const galleryContainer = document.querySelector('.gallery-grid');
    galleryContainer.innerHTML = ''; // Clear existing content
  
    // Check if data is an array and has content
    if (!data || !Array.isArray(data)) {
      console.error('Data is undefined or not an array');
      return;
    }
  
    // Iterate over each entry in the data array
    data.forEach(entry => {
      // Ensure units exist and are an array
      if (!entry.units || !Array.isArray(entry.units)) {
        console.error('Units are undefined or not an array in', entry);
        return;
      }
  
      // Iterate over each unit
      entry.units.forEach(unit => {
        // Ensure rooms exist and are an array
        if (!unit.rooms || !Array.isArray(unit.rooms)) {
          console.error('Rooms are undefined or not an array in', unit);
          return;
        }
  
        // Iterate over each room
        unit.rooms.forEach(room => {
          // Ensure items exist and are an array
          if (!room.items || !Array.isArray(room.items)) {
            console.error('Items are undefined or not an array in', room);
            return;
          }
  
          // Iterate over each item
          room.items.forEach(item => {
            // Ensure aspects exist and are an array
            if (!item.aspects || !Array.isArray(item.aspects)) {
              console.error('Aspects are undefined or not an array in', item);
              return;
            }
  
            // Iterate over each aspect
            item.aspects.forEach(aspect => {
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
            });
          });
        });
      });
    });
  }
  

  function updateAnalytics(data) {
    let totalAspects = 0, passed = 0, failed = 0;

    console.log('Data received for analytics:', data);

    if (!data || !Array.isArray(data)) {
      console.error('Data is undefined or not an array');
      return;
    }

    data.forEach(entry => {
      entry.units.forEach(unit => {
        unit.rooms.forEach(room => {
          room.items.forEach(item => {
            item.aspects.forEach(aspect => {
              totalAspects++;
              if (aspect.status === 1) passed++;
              if (aspect.status === 0) failed++;
            });
          });
        });
      });
    });

    const passedPercent = (passed / totalAspects * 100).toFixed(2);
    const failedPercent = (failed / totalAspects * 100).toFixed(2);
    const notDonePercent = (100 - passedPercent - failedPercent).toFixed(2);

    console.log(`Analytics - Passed: ${passedPercent}%, Failed: ${failedPercent}%, Not Done: ${notDonePercent}%`);

    const barChartContainer = document.querySelector('.bar-chart-container');
    const passedBar = barChartContainer.querySelector('.passed');
    const failedBar = barChartContainer.querySelector('.failed');
    const notDoneBar = barChartContainer.querySelector('.not-done');

    if (passedBar) {
      passedBar.style.flexBasis = `${passedPercent}%`;
      passedBar.textContent = `${passedPercent}% Passed`;
    }

    if (failedBar) {
      failedBar.style.flexBasis = `${failedPercent}%`;
      failedBar.textContent = `${failedPercent}% Failed`;
    }

    if (notDoneBar) {
      notDoneBar.style.flexBasis = `${notDonePercent}%`;
      notDoneBar.textContent = `${notDonePercent}% Not Done`;
    }
  }
