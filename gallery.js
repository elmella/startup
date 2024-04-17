fetch('data.json')
  .then(response => response.json())
  .then(data => {
    updateGallery(data);
    updateAnalytics(data);
  });
  
function updateGallery(data) {
    const galleryContainer = document.querySelector('.gallery-grid');
    const inspectionContainer = document.querySelector('.inspection-section');
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
  
        let totalPassed = 0, totalFailed = 0, totalRemaining = 0;

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

              if (aspect.status === 1) {
                totalPassed++;
              } else if (aspect.status === 0) {
                totalFailed++;
              } else {
                totalRemaining++;
              }

            });
            });
        });


        const svg = generateDynamicSVG(totalPassed, totalFailed, totalRemaining);
        const div = document.createElement('div');
        div.className = 'row-container';
        div.innerHTML = `
        <div class="inspection-meta">
          <div class="inspection-date">${entry.due_date}</div>
          <div class="inspection-progress">${svg}</div></div>
          <div class="photo-button-item">
            <img src="assets/photo-button.svg" alt="Photo" />
          </div>
          <div class="download-button-item">
            <img src="assets/download-disabled.svg" alt="Download Disabled" />
          </div>
        `;
        inspectionContainer.appendChild(div);
        });
    }
    );
    }