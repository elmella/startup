const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const app = express();

const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);

// Connect to MongoDB
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Define a schema for the Unit
const unitSchema = new mongoose.Schema({
    unit_number: String,
    unit_id: String,
    rooms: [{
        room_name: String,
        items: [{
            item_name: String,
            aspects: [{
                aspect_name: String,
            }]
        }]
    }],
    residents: [{
        resident_name: String,
        resident_id: String,
        resident_email: String
    }]
});

const residentSchema = new mongoose.Schema({
    resident_name: String,
    resident_id: String,
    resident_email: String,
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }
});

// Create a model from the schema
const Unit = mongoose.model('Unit', unitSchema);
const Resident = mongoose.model('Resident', residentSchema);

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

async function addUnit(unitData) {
  try {
    const unit = await Unit.create(unitData);
    console.log('Unit created successfully:', unit);
  } catch (error) {
    console.error('Error creating unit:', error);
  }
}

async function addResident(residentData) {
  try {
      const resident = await Resident.create(residentData);
      console.log('Resident created successfully:', resident);
  } catch (error) {
      console.error('Error creating resident:', error);
  }
}

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


// const testData = {
//   unit_number: "101",
//   unit_id: "12345",
//   rooms: [
//       {
//           room_name: "Kitchen",
//           items: [
//               {
//                   item_name: "Fridge",
//                   aspects: [
//                       {
//                           aspect_name: "Fridge Outside",
//                       },
//                       {
//                           aspect_name: "Fridge Inside",
//                       }
//                   ]
//               },
//               {
//                   item_name: "Oven",
//                   aspects: [
//                       {
//                           aspect_name: "Oven Outside",
//                       },
//                       {
//                           aspect_name: "Oven Inside",
//                       }
//                   ]
//               }
//           ]
//       },
//       {
//           room_name: "Living Room",
//           items: [
//               {
//                   item_name: "Sofa",
//                   aspects: [
//                       {
//                           aspect_name: "Sofa Cushions",
//                       },
//                       {
//                           aspect_name: "Sofa Frame",
//                       }
//                   ]
//               }
//           ]
//       }
//   ],
//   residents: [
//       {
//           resident_name: "John Doe",
//           resident_id: "123456",
//           resident_email: "johndoe@example.com"
//       },
//       {
//           resident_name: "Jane Doe",
//           resident_id: "654321",
//           resident_email: "janedoe@example.com"
//       }
//   ]
// };
// const testData2 = {
//   unit_number: "202",
//   unit_id: "54321",
//   rooms: [
//       {
//           room_name: "Kitchen",
//           items: [
//               {
//                   item_name: "Fridge",
//                   aspects: [
//                       {
//                           aspect_name: "Fridge Outside",
//                       },
//                       {
//                           aspect_name: "Fridge Inside",
//                       }
//                   ]
//               },
//               {
//                   item_name: "Oven",
//                   aspects: [
//                       {
//                           aspect_name: "Oven Outside",
//                       },
//                       {
//                           aspect_name: "Oven Inside",
//                       }
//                   ]
//               }
//           ]
//       },
//       {
//           room_name: "Living Room",
//           items: [
//               {
//                   item_name: "Sofa",
//                   aspects: [
//                       {
//                           aspect_name: "Sofa Cushions",
//                       },
//                       {
//                           aspect_name: "Sofa Frame",
//                       }
//                   ]
//               }
//           ]
//       }
//   ],
//   residents: [
//       {
//           resident_name: "Juan Doe",
//           resident_id: "111111",
//           resident_email: "juandoe@example.com"
//       },
//       {
//           resident_name: "Juana Doe",
//           resident_id: "222222",
//           resident_email: "juanadoe@example.com"
//       }
//   ]
// };
const testDataResident = {
  resident_name: "John Doe",
  resident_id: "123456",
  resident_email: "johndoe@gmail.com"
};

const testDataResident2 = {
  resident_name: "Jane Doe",
  resident_id: "654321",
  resident_email: "janedoe@example.com"
};

const testDataResident3 = {
          resident_name: "Juan Doe",
          resident_id: "111111",
          resident_email: "juandoe@example.com"

};

const testDataResident4 = {
          resident_name: "Juana Doe",
          resident_id: "222222",
          resident_email: "juanadoe@example.com"
};

// // Function call to add the test data
// (async () => {
//   try {
//     await addUnit(testData2);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// })();

(async () => {
  try {
    // await addResident(testDataResident);
    await addResident(testDataResident2);
    await addResident(testDataResident3);
    await addResident(testDataResident4);
  } catch (error) {
    console.error('Error:', error);
  }
})();