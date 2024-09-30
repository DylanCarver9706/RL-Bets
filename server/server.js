// server.js
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors
require("dotenv").config();

const app = express();

// CORS Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: "GET,PUT,POST,DELETE", // Allowed methods
    credentials: true, // Enable credentials (cookies, authorization headers)
  })
);

// Use this for testing only
// app.use(cors({ origin: "*" }));

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
const uri = `${process.env.MONGO_DB_BASE_URI.replace(
  "MONGO_DB_SECRET_KEY",
  process.env.MONGO_DB_SECRET
)}/?retryWrites=true&w=majority&appName=${
  process.env.MONGO_DB_URI_PARAM_APP_NAME
}`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB and define the collections
let usersCollection;
let wagersCollection;

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("RLBets");
    usersCollection = database.collection("Users");
    wagersCollection = database.collection("Wagers");
    console.log("Connected to MongoDB and 'users' and 'wagers' collections.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call connectToDatabase when the app starts
connectToDatabase();


// ************************************************************************************************
// ************************************************************************************************
// *********************************************USERS**********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new user (POST)
app.post("/api/users", async (req, res) => {
  try {
    const result = await usersCollection.insertOne(req.body);
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId, // TODO: SALT this id when returning
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
});

// Get all users (GET)
app.get("/api/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});

// Get a single user by ID (GET)
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await usersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
});

// Update a user by ID (PUT)
app.put("/api/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
});

// Delete a user by ID (DELETE)
app.delete("/api/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
});

// Find a user by Firebase ID (GET)
app.get("/api/users/firebase/:firebaseUserId", async (req, res) => {
  try {
    const user = await usersCollection.findOne({ firebaseUserId: req.params.firebaseUserId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************WAGERS*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new wager (POST)
app.post("/api/wagers", async (req, res) => {
  try {
    const result = await wagersCollection.insertOne(req.body);
    res.status(201).json({
      message: "Wager created successfully",
      wagerId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create wager", details: err.message });
  }
});

// Get all wagers (GET)
app.get("/api/wagers", async (req, res) => {
  try {
    const wagers = await wagersCollection.find().toArray();
    res.status(200).json(wagers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wagers", details: err.message });
  }
});

// Get a single wager by ID (GET)
app.get("/api/wagers/:id", async (req, res) => {
  try {
    const wager = await wagersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!wager) {
      return res.status(404).json({ error: "Wager not found" });
    }
    res.status(200).json(wager);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wager", details: err.message });
  }
});

// Update a wager by ID (PUT)
app.put("/api/wagers/:id", async (req, res) => {
  try {
    const result = await wagersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Wager not found" });
    }
    res.status(200).json({ message: "Wager updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update wager", details: err.message });
  }
});

// Delete a wager by ID (DELETE)
app.delete("/api/wagers/:id", async (req, res) => {
  try {
    const result = await wagersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Wager not found" });
    }
    res.status(200).json({ message: "Wager deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete wager", details: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
