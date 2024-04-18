const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const DB = require('./database.js');
const AI = require('./openai.js');
const app = express();

// DB.createSampleData();


// Port number can be set in the environment or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Parse JSON bodies
app.use(express.json());

// Use the cookie parser
app.use(cookieParser());

// Trust headers that are forwarded from the proxy so we can determine IP addresses
app.set('trust proxy', true);

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

// CreateAuth token for a new user
apiRouter.post('/auth/create', async (req, res) => {
    if (await DB.getUser(req.body.username)) {
      res.status(409).send({ msg: 'Existing user' });
    } else {
      const user = await DB.createUser(req.body.username, req.body.password);
  
      // Set the cookie
      setAuthCookie(res, user.token);
  
      res.send({
        id: user._id,
      });
    }
  });
  
  // GetAuth token for the provided credentials
  apiRouter.post('/auth/login', async (req, res) => {
    const user = await DB.getUser(req.body.username);
    if (user) {
      if (await bcrypt.compare(req.body.password, user.password)) {
        setAuthCookie(res, user.token);
        res.send({ id: user._id });
        return;
      }
    }
    res.status(401).send({ msg: 'Unauthorized' });
  });


  apiRouter.delete('/auth/logout', (_req, res) => {
    res.clearCookie(authCookieName);
    res.status(204).end();
  });

  apiRouter.post('/units', async (req, res) => {
    try {
        const unitData = req.body;
        const unit = await DB.addUnit(unitData);
        res.status(201).json(unit);
    } catch (error) {
        console.error('Failed to create unit:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

  apiRouter.post('/residents', async (req, res) => {
    try {
        const residentData = req.body;
        const resident = await DB.addResident(residentData);
        res.status(201).json(resident);
    } catch (error) {
        console.error('Failed to create resident:', error);
        res.status(500).json({ error: 'Failed to create resident' });
    }
});

apiRouter.post('/inspections', async (req, res) => {
    try {
        const { dueDate } = req.body;
        const inspection = await DB.createInspection(dueDate);
        res.status(201).json(inspection);
    } catch (error) {
        console.error('Failed to create inspection:', error);
        res.status(500).json({ error: 'Failed to create inspection' });
    }
});

app.post('/api/overrideAspectStatus', async (req, res) => {
  // console.log('Overriding aspect status');
  const { dueDate, unitId, roomName, itemName, aspectName, newStatus } = req.body;

  try {
    await DB.overrideAspectStatus(dueDate, unitId, roomName, itemName, aspectName, newStatus);
    console.log('Aspect status overridden successfully');
    res.status(200).send('Aspect status overridden successfully');
  } catch (error) {
    console.error('Error overriding aspect status:', error);
    res.status(500).json({ error: 'Error overriding aspect status' });

  }
});

app.get('/api/analyze/:dueDate', async (req, res) => {
  console.log('Analyzing inspection');
  try {
      if (!req.params.dueDate) {
          return res.status(400).json({ success: false, message: 'Missing due date' });
      }
      const result = await DB.analyzeInspection(req.params.dueDate);
      res.status(200).json({ success: result, message: 'Analysis completed successfully.' });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/inspections', DB.fetchInspections);



app.get('/api/units', DB.fetchUnits);


app.get('/api/residents', DB.fetchResidents);



    // Get the home data
apiRouter.get('/home', getHomeData, (req, res) => {
    res.send(req.data);
});

// Get the message data
apiRouter.get('/message', getMessageData, (req, res) => {
    res.send(req.data);
});

// Get the resident data

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
  resident_email: "johndoe@gmail.com",
  unit_id: "12345"
};

const testDataResident2 = {
  resident_name: "Jane Doe",
  resident_id: "654321",
  resident_email: "janedoe@example.com",
  unit_id: "12345"
};

const testDataResident3 = {
          resident_name: "Juan Doe",
          resident_id: "111111",
          resident_email: "juandoe@example.com",
          unit_id: "54321"
};

const testDataResident4 = {
          resident_name: "Juana Doe",
          resident_id: "222222",
          resident_email: "juanadoe@example.com",
          unit_id: "54321"
};


// // Function call to add the test data
// (async () => {
//   try {
//     await addUnit(testData2);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// })();

// (async () => {
//   try {
//     await DB.addResident(testDataResident);
//     await DB.addResident(testDataResident2);
//     await DB.addResident(testDataResident3);
//     await DB.addResident(testDataResident4);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// })();