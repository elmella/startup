const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const config = require("./dbConfig.json");
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const AI = require("./openai.js");
const fs = require("fs").promises;
const path = require("path");

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
  .connect(url)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Define a schema for the Unit
const unitSchema = new mongoose.Schema({
  unit_number: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  resident_email: String,
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  token: String,
});

const messageSchema = new Schema({
  chat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  type: String,
  content: String,
  src: String,
  alt: String,
});

const chatSchema = new Schema({
  name: String,
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  lastActive: String,
  messages: [messageSchema],
});

const chatsSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chats: [chatSchema],
});

const Unit = mongoose.model("Unit", unitSchema);
const Resident = mongoose.model("Resident", residentSchema);
const Inspection = mongoose.model("Inspection", inspectionSchema);
const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);
const Chats = mongoose.model("Chats", chatsSchema);

async function verifyUser(req, res, next) {
  try {
    const token = req.cookies.authToken;
    console.log(`Token from cookies: ${token}`); // Debugging output
    const user = await User.findOne({ token }).exec();
    if (!user) {
      console.log("No user found with the provided token"); // Debugging output
      return res.status(401).send("Unauthorized: No valid token provided");
    }
    req.user = user;
    console.log(`User set on req object: ${req.user._id}`); // Debugging output
    next();
  } catch (error) {
    console.error("Authentication failed", error);
    res.status(500).send("Server Error: Authentication process failed");
  }
}

async function addChat(chatData) {
  try {
    const chat = new Chat(chatData);
    await chat.save();
    return chat;
  } catch (error) {
    console.error("Error adding chat:", error);
    throw error; // Rethrow to handle error in the calling function
  }
}

async function addMessage(chatId, messageData) {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    chat.messages.push(messageData);
    await chat.save();
    return chat;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
}

async function addUnit(unitData) {
  const unit = new Unit(unitData);
  await unit.save();
  return unit;
}

async function addResident(residentData) {
  const resident = new Resident(residentData);
  await resident.save();
  return resident;
}

async function createInspection(dueDate, userId) {
  try {
    // Fetch units from the database that belong to the specified user
    const units = await Unit.find({ user_id: userId });

    if (units.length === 0) {
      console.log("No units found for this user:", userId);
      return; // Optionally handle the case where no units are found
    }

    // Map units to format them for the inspection
    const formattedUnits = units.map((unit) => ({
      unit_number: unit.unit_number,
      unit_id: unit._id,
      rooms: unit.rooms.map((room) => ({
        room_name: room.room_name,
        items: room.items.map((item) => ({
          item_name: item.item_name,
          aspects: item.aspects.map((aspect) => ({
            aspect_name: aspect.aspect_name,
            // Initialize defaults
            status: 1, // Assuming status 1 means 'OK'
            override: false,
            image_url:
              "https://checktaiphotos.s3.us-east-2.amazonaws.com/photo_10.jpg",
          })),
        })),
      })),
      residents: unit.residents.map((resident) => ({
        resident_name: resident.resident_name,
        resident_id: resident.resident_id,
        resident_email: resident.resident_email,
      })),
    }));

    // Create a new inspection with the formatted units and the specified due date
    const newInspection = new Inspection({
      due_date: dueDate,
      user_id: userId, // Ensure that the inspection is also associated with the user
      units: formattedUnits,
    });

    // Save the new inspection to the database
    await newInspection.save();
    console.log("New inspection created successfully:", newInspection);
    return newInspection; // Return the new inspection for further processing if needed
  } catch (error) {
    console.error("Error creating new inspection:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
}

async function fetchInspections(req, res, next) {
  try {
    const inspections = await Inspection.find({ user_id: req.user._id });
    res.json(inspections);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    if (res) {
      res.status(500).send("Error fetching inspections");
    } else {
      console.error("Response object not available");
    }
  }
}

async function overrideAspectStatus(
  user_id,
  dueDate,
  unitId,
  roomName,
  itemName,
  aspectName,
  newStatus
) {
  try {
    const result = await Inspection.updateOne(
      {
        user_id: user_id,
        due_date: dueDate,
        "units.unit_id": unitId,
        "units.rooms.room_name": roomName,
        "units.rooms.items.item_name": itemName,
        "units.rooms.items.aspects.aspect_name": aspectName,
      },
      {
        $set: {
          "units.$[unit].rooms.$[room].items.$[item].aspects.$[aspect].status":
            newStatus,
          "units.$[unit].rooms.$[room].items.$[item].aspects.$[aspect].override": true,
        },
      },
      {
        arrayFilters: [
          { "unit.unit_id": unitId },
          { "room.room_name": roomName },
          { "item.item_name": itemName },
          { "aspect.aspect_name": aspectName },
        ],
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

async function analyzeInspection(dueDate, userId) {
  console.log(`Analyzing inspection for due date: ${dueDate}`);
  // Fetch the inspection from the database
  let inspection = await Inspection.findOne({
    due_date: dueDate,
    user_id: userId,
  });
  if (!inspection) {
    throw new Error("Inspection not found");
  }

  for (let unit of inspection.units) {
    for (let room of unit.rooms) {
      for (let item of room.items) {
        for (let aspect of item.aspects) {
          console.log(
            `Analyzing image for ${room.room_name} - ${item.item_name} - ${aspect.aspect_name}`
          );
          try {
            // if the url is empty, skip the analysis
            if (aspect.image_url !== "") {
              const result = await AI.checkImage(aspect.image_url);
              console.log(`Result for ${aspect.aspect_name}: ${result}`);
              const scores = AI.parseScores(result);
              aspect.status = scores.cleanliness; // Update status based on analysis
            } else {
              aspect.status = 0;
            }
            console.log(
              `Updated status for ${aspect.aspect_name}: ${aspect.status}`
            );
          } catch (error) {
            console.error(
              `Error analyzing image for ${aspect.aspect_name}: ${error.message}`
            );
          }
        }
      }
    }
  }

  await inspection.save(); // Save the updated inspection back to the database
  return true; // Return true to indicate success
}

async function fetchUnits(req, res, next) {
  try {
    const units = await Unit.find({ user_id: req.user._id });
    res.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    if (res) {
      res.status(500).send("Error fetching units");
    } else {
      console.error("Response object not available");
    }
  }
}

async function fetchResidents(req, res, next) {
  try {
    const residents = await Resident.find({ user_id: req.user._id });
    res.json(residents);
  } catch (error) {
    console.error("Error fetching residents:", error);
    if (res) {
      res.status(500).send("Error fetching residents");
    } else {
      console.error("Response object not available");
    }
  }
}

async function fetchChats(req, res, next) {
  try {
    const chats = await Chats.findOne({ user_id: req.user._id });
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    if (res) {
      res.status(500).send("Error fetching chats");
    } else {
      console.error("Response object not available");
    }
  }
}

async function createUser(email, password) {
  let user = await User.findOne({ email });
  if (user) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = uuid.v4();
  user = new User({
    email,
    password: hashedPassword,
    token,
  });
  await user.save();
  return user;
}

async function deleteUser(req, res, next) {
  try {
    const result = await User.findByIdAndDelete(req.user._id);
    if (!result) {
      return res.status(404).send('User not found');
    }
    return res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error("Error deleting user:", error);
    if (res) {
      res.status(500).send("Error deleting user");
    } else {
      console.error("Response object not available");
    }
  }
}
async function authenticateUser(email, password) {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Authentication failed");
  }
  return user;
}

function setAuthCookie(res, authToken) {
  const authCookieName = "authToken"; // Name of the cookie for authentication token
  res.cookie(authCookieName, authToken, {
    httpOnly: true, // The cookie is not accessible via client-side script
    secure: process.env.NODE_ENV === "production", // Use 'secure' flag in production
    sameSite: "strict", // The cookie will not be sent along with requests initiated by third party websites
  });
}

async function loadSampleUnits(req, res) {
  try {
    const dataPath = path.join(__dirname, "data", "sample-unit.json");
    const sampleDataString = await fs.readFile(dataPath, "utf8");
    const sampleData = JSON.parse(sampleDataString);

    // Assuming req.user._id is set by your authentication middleware
    sampleData.user_id = req.user._id;
    const createdUnit = await addUnit(sampleData);

    // Create residents with unit_id and user_id
    const residents = sampleData.residents.map((resident) => ({
      ...resident,
      unit_id: createdUnit._id,
      user_id: req.user._id,
    }));

    // Save all residents
    const createdResidents = await Promise.all(
      residents.map((resident) => addResident(resident))
    );

    res.status(201).json({
      message: "Sample unit and residents created successfully",
      unit: createdUnit,
      residents: createdResidents,
    });
  } catch (error) {
    console.error("Error creating sample units:", error);
    res
      .status(500)
      .send({ error: "Failed to create sample units", details: error.message });
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
  setAuthCookie,
  overrideAspectStatus,
  analyzeInspection,
  authenticateUser,
  verifyUser,
  loadSampleUnits,
  addChat,
  addMessage,
  fetchChats,
  deleteUser,
};
