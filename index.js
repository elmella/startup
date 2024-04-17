const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Port number can be set in the environment or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set a simple route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', getHomeData, (req, res) => {
  res.json(req.data);
});

app.get('/messages', getMessageData, (req, res) => {
    res.json(req.data);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


function getHomeData(req, res, next) {
    fs.readFile('data/data.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error reading data');
      } else {
        req.data = JSON.parse(data);
        next();
      }
    });
  }

  function getMessageData(req, res, next) {
    fs.readFile('data/message-data.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error reading data');
      } else {
        req.data = JSON.parse(data);
        next();
      }
    });
  }