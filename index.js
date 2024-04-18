const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const DB = require('./database.js');
const AI = require('./openai.js');
const cors = require('cors');
const app = express();



// Port number can be set in the environment or default to 4000
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'https://startup.cs260party.click'
}));


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
apiRouter.use(DB.verifyUser);

// CreateAuth token for a new user

apiRouter.post('/sample-units', DB.loadSampleUnits);

app.post('/api/auth/create', async (req, res) => {
  try {
    const user = await DB.createUser(req.body.email, req.body.password);
    res.cookie('authToken', user.token, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.status(201).send({ id: user._id, msg: 'User created and logged in' });
  } catch (error) {
    res.status(409).send({ msg: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await DB.authenticateUser(req.body.email, req.body.password);
    res.cookie('authToken', user.token, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.send({ id: user._id });
  } catch (error) {
    res.status(401).send({ msg: error.message });
  }
});

app.delete('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.sendStatus(204);
});

apiRouter.post('/units', async (req, res) => {
  try {
    const unitData = {...req.body, user_id: req.user._id};
    const unit = await DB.addUnit(unitData);
    res.status(201).json(unit);
  } catch (error) {
    console.error('Failed to create unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Similarly adjust other API endpoints
apiRouter.post('/residents', async (req, res) => {
  try {
    const residentData = {...req.body, user_id: req.user._id};
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
    const inspection = await DB.createInspection(dueDate, req.user._id);
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Failed to create inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});


apiRouter.post('/overrideAspectStatus', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Authentication required');
    }

    const { dueDate, unitId, roomName, itemName, aspectName, newStatus } = req.body;
    console.log('Overriding aspect status:', dueDate, unitId, roomName, itemName, aspectName, newStatus);
    try {
        await DB.overrideAspectStatus(req.user._id, dueDate, unitId, roomName, itemName, aspectName, newStatus);
        res.status(200).send('Aspect status overridden successfully');
    } catch (error) {
        console.error('Error overriding aspect status:', error);
        res.status(500).json({ error: 'Error overriding aspect status', details: error.message });
    }
});


apiRouter.get('/analyze/:dueDate', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  console.log('Analyzing inspection');
  try {
      const userId = req.user._id;  // Assuming req.user is set from authentication
      const result = await DB.analyzeInspection(req.params.dueDate, userId);
      res.status(200).json({ success: result, message: 'Analysis completed successfully.' });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});


apiRouter.get('/units', DB.fetchUnits);

apiRouter.get('/residents', DB.fetchResidents);

apiRouter.get('/inspections', DB.fetchInspections);

apiRouter.get('/chats', DB.fetchChats);


// Get the message data
apiRouter.get('/chats/:chatId', async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat || chat.user_id.toString() !== req.user._id.toString()) {
    return res.status(403).send('Forbidden');
  }
  res.json(chat);
});


app.use('/api', apiRouter);

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


