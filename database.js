const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const config = require('./dbConfig.json');
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const uuid = require('uuid');
const bcrypt = require('bcrypt');

(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
  })().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  });


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

const inspectionSchema = new mongoose.Schema({
  due_date: Date,
  units: [{
    unit_number: String,
    unit_id: String,
    rooms: [{
        room_name: String,
        items: [{
            item_name: String,
            aspects: [{
              aspect_name: String,
              status: { type: Number, default: 0 },
              override: { type: Boolean, default: false },
              image_url: { type: String, default: '' }
            }]
        }]
    }],
    residents: [{
        resident_name: String,
        resident_id: String,
        resident_email: String
    }]
  }]
});


const residentSchema = new mongoose.Schema({
    resident_name: String,
    resident_id: String,
    resident_email: String,
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String
    })


const Unit = mongoose.model('Unit', unitSchema);
const Resident = mongoose.model('Resident', residentSchema);
const Inspection = mongoose.model('Inspection', inspectionSchema);
const User = mongoose.model('User', userSchema);



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



async function createInspection(dueDate) {
    try {
        // Fetch all units from the database
        const units = await Unit.find({});
  
        // Map units to format them for the inspection
        const formattedUnits = units.map(unit => ({
            unit_number: unit.unit_number,
              unit_id: unit.unit_id,
            rooms: unit.rooms.map(room => ({
                room_name: room.room_name,
                items: room.items.map(item => ({
                    item_name: item.item_name,
                    aspects: item.aspects.map(aspect => ({
                        aspect_name: aspect.aspect_name,
                        // Initialize defaults
                        status: 1,
                        override: false,
                        image_url: 'https://checktaiphotos.s3.us-east-2.amazonaws.com/photo_10.jpg'
                    }))
                }))
            })),
            residents: unit.residents
        }
  
      
      ));
  
        // Create a new inspection with the formatted units and the specified due date
        const newInspection = new Inspection({
            due_date: dueDate,
            units: formattedUnits
        });
  
        // Save the new inspection to the database
        await newInspection.save();
        console.log('New inspection created successfully:', newInspection);
    } catch (error) {
        console.error('Error creating new inspection:', error);
    }
  }
  
  async function fetchInspections(req, res, next) {
      try {
        const inspections = await Inspection.find({});
        req.inspections = inspections;
        next();
      } catch (error) {
        console.error('Error fetching inspections:', error);
        res.status(500).send('Error fetching inspections');
      }
    }

async function fetchUnits(req, res, next) {
    try {
        const units = await Unit.find({});
        req.units = units;
        next();
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).send('Error fetching units');
    }
}

async function fetchResidents(req, res, next) {
    try {
        const residents = await Resident.find({});
        req.residents = residents;
        next();
    } catch (error) {
        console.error('Error fetching residents:', error);
        res.status(500).send('Error fetching residents');
    }
}

async function createUser(email, password) {
    // Hash the password before we insert it into the database
    const passwordHash = await bcrypt.hash(password, 10);
  
    const user = new User({
        email,
        password: passwordHash,
        token: uuid.v4()
        });

    await user.save();
  }

