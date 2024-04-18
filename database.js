const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const config = require("./dbConfig.json");
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const uuid = require("uuid");
const bcrypt = require("bcrypt");

const client = new MongoClient(url, { useUnifiedTopology: true });
const db = "test";

(async function testConnection() {
  await client.connect();
  console.log("Connected to MongoDB");
  const database = client.db(db);
  await database.command({ ping: 1 });
})().catch((ex) => {
  console.log(
    `Unable to connect to database with ${url} because ${ex.message}`
  );
  process.exit(1);
});

// Connect to MongoDB
mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Define a schema for the Unit
const unitSchema = new mongoose.Schema({
  unit_number: String,
  unit_id: String,
  rooms: [
    {
      room_name: String,
      items: [
        {
          item_name: String,
          aspects: [
            {
              aspect_name: String,
            },
          ],
        },
      ],
    },
  ],
  residents: [
    {
      resident_name: String,
      resident_id: String,
      resident_email: String,
    },
  ],
});

const inspectionSchema = new mongoose.Schema({
  due_date: String,
  units: [
    {
      unit_number: String,
      unit_id: String,
      rooms: [
        {
          room_name: String,
          items: [
            {
              item_name: String,
              aspects: [
                {
                  aspect_name: String,
                  status: { type: Number, default: 0 },
                  override: { type: Boolean, default: false },
                  image_url: { type: String, default: "" },
                },
              ],
            },
          ],
        },
      ],
      residents: [
        {
          resident_name: String,
          resident_id: String,
          resident_email: String,
        },
      ],
    },
  ],
});

const residentSchema = new mongoose.Schema({
  resident_name: String,
  resident_id: String,
  resident_email: String,
  unit_id: String,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const messageSchema = new Schema({
  type: String,
  content: String,
  src: String,
  alt: String,
});

const chatSchema = new Schema({
  name: String,
  unit_id: String,
  lastActive: String,
  messages: [messageSchema],
});

const Unit = mongoose.model("Unit", unitSchema);
const Resident = mongoose.model("Resident", residentSchema);
const Inspection = mongoose.model("Inspection", inspectionSchema);
const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);

async function addUnit(unitData) {
  try {
    const unit = await Unit.create(unitData);
    console.log("Unit created successfully:", unit);
  } catch (error) {
    console.error("Error creating unit:", error);
  }
}

async function addResident(residentData) {
  try {
    const resident = await Resident.create(residentData);
    console.log("Resident created successfully:", resident);
  } catch (error) {
    console.error("Error creating resident:", error);
  }
}

async function createInspection(dueDate) {
  try {
    // Fetch all units from the database
    const units = await Unit.find({});

    // Map units to format them for the inspection
    const formattedUnits = units.map((unit) => ({
      unit_number: unit.unit_number,
      unit_id: unit.unit_id,
      rooms: unit.rooms.map((room) => ({
        room_name: room.room_name,
        items: room.items.map((item) => ({
          item_name: item.item_name,
          aspects: item.aspects.map((aspect) => ({
            aspect_name: aspect.aspect_name,
            // Initialize defaults
            status: 1,
            override: false,
            image_url:
              "https://checktaiphotos.s3.us-east-2.amazonaws.com/photo_10.jpg",
          })),
        })),
      })),
      residents: unit.residents,
    }));

    // Create a new inspection with the formatted units and the specified due date
    const newInspection = new Inspection({
      due_date: dueDate,
      units: formattedUnits,
    });

    // Save the new inspection to the database
    await newInspection.save();
    console.log("New inspection created successfully:", newInspection);
  } catch (error) {
    console.error("Error creating new inspection:", error);
  }
}

async function fetchInspections(req, res, next) {
  try {
    const inspections = await Inspection.find({});
    console.log("Inspections fetched successfully:", inspections);

    // Send the inspections back in the response
    res.json(inspections);

    next();
  } catch (error) {
    console.error("Error fetching inspections:", error);
    res.status(500).send("Error fetching inspections");
  }
}

async function overrideAspectStatus(dueDate, unitId, roomName, itemName, aspectName, newStatus) {

    try {
      const result = await Inspection.updateOne(
        {
          due_date: dueDate,
          "units.unit_id": unitId,
          "units.rooms.room_name": roomName,
          "units.rooms.items.item_name": itemName,
          "units.rooms.items.aspects.aspect_name": aspectName
        },
        {
          $set: {
            "units.$[unit].rooms.$[room].items.$[item].aspects.$[aspect].status": newStatus,
            "units.$[unit].rooms.$[room].items.$[item].aspects.$[aspect].override": true
          }
        },
        {
          arrayFilters: [
            { "unit.unit_id": unitId },
            { "room.room_name": roomName },
            { "item.item_name": itemName },
            { "aspect.aspect_name": aspectName }
          ]
        }
      );
  
      console.log("Aspect status overridden:", result);
      if (result.nModified === 0) {
        console.log("No records updated. Please check your query criteria.");
      } else {
        console.log("Aspect status updated successfully.");
      }
    } catch (error) {
      console.error("Error overriding aspect status:", error);
    }
  }
  

async function fetchUnits(req, res, next) {
  try {
    const units = await Unit.find({});

    res.json(units);
    next();
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).send("Error fetching units");
  }
}

async function fetchResidents(req, res, next) {
  try {
    const residents = await Resident.find({});
    res.json(residents);
    next();
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).send("Error fetching residents");
  }
}

async function createUser(email, password) {
  // Hash the password before we insert it into the database
  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: passwordHash,
    token: uuid.v4(),
  });

  await user.save();
}

async function getUser(email) {
  return User.findOne({ email });
}

function setAuthCookie(res, authToken) {
  res.cookie("token", authToken, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });
}

async function createSampleData() {
  try {
    // Create Chats
    const chat1 = new Chat({
      name: "John Doe",
      unit_id: "12345",
      lastActive: "Today, 9:52pm",
      messages: [
        { type: "received", content: "Hi, Can you review this photo?" },
        { type: "photo", src: "assets/fail-image.svg", alt: "Failed Image" },
        { type: "sent", content: "Hello!" },
        { type: "sent", content: "Sure! Let me give it a look." },
        { type: "photo", src: "assets/pass-image.svg", alt: "Passed Image" },
        { type: "status", content: "Congrats! The photo has been approved" },
      ],
    });

    const chat2 = new Chat({
      name: "Jane Doe",
      unit_id: "12345",
      lastActive: "Today, 9:52pm",
      messages: [
        { type: "received", content: "Hi, Can you review this photo?" },
        { type: "photo", src: "assets/fail-image.svg", alt: "Failed Image" },
        { type: "sent", content: "Hello!" },
        { type: "sent", content: "Sure! Let me give it a look." },
        { type: "photo", src: "assets/pass-image.svg", alt: "Passed Image" },
        { type: "status", content: "Congrats! The photo has been approved" },
      ],
    });
    await chat1.save();
    await chat2.save();

    console.log("Sample data created successfully!");
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

module.exports = {
  addUnit,
  addResident,
  createInspection,
  fetchInspections,
  fetchUnits,
  fetchResidents,
  createUser,
  getUser,
  setAuthCookie,
  createSampleData,
  overrideAspectStatus,
};
