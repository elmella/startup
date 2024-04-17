const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const DB = require('./database.js');
const app = express();

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

app.get('/inspections', fetchInspections, (req, res) => {
    res.json(req.inspections);
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

// (async () => {
//   try {
//     await addResident(testDataResident);
//     await addResident(testDataResident2);
//     await addResident(testDataResident3);
//     await addResident(testDataResident4);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// })();