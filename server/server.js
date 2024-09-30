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
    origin: process.env.CLIENT_URL, // Replace with your frontend URL
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
let seasonsCollection, majorsCollection, seriesCollection, matchesCollection, teamsCollection, playersCollection;

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("RLBets");
    seasonsCollection = database.collection("Seasons");
    majorsCollection = database.collection("Majors");
    seriesCollection = database.collection("Series");
    matchesCollection = database.collection("Matches");
    teamsCollection = database.collection("Teams");
    playersCollection = database.collection("Players");
    console.log("Connected to MongoDB and all collections.");
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

// ************************************************************************************************
// ************************************************************************************************
// ********************************************SEASONS*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Season
app.post("/api/seasons", async (req, res) => {
  try {
    const result = await seasonsCollection.insertOne(req.body);
    res.status(201).json({ message: "Season created successfully", seasonId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create season", details: err.message });
  }
});

// Get all Seasons
app.get("/api/seasons", async (req, res) => {
  try {
    const seasons = await seasonsCollection.find().toArray();
    res.status(200).json(seasons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch seasons", details: err.message });
  }
});

// Get a single Season by ID
app.get("/api/seasons/:id", async (req, res) => {
  try {
    const season = await seasonsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json(season);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch season", details: err.message });
  }
});

// Update a Season by ID
app.put("/api/seasons/:id", async (req, res) => {
  try {
    const result = await seasonsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json({ message: "Season updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update season", details: err.message });
  }
});

// Delete a Season by ID
app.delete("/api/seasons/:id", async (req, res) => {
  try {
    const result = await seasonsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json({ message: "Season deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete season", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************MAJORS*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Major
app.post("/api/majors", async (req, res) => {
  try {
    const majorData = req.body;
    if (!majorData.season) {
      return res.status(400).json({ error: "Season ID is required to create a Major." });
    }

    const result = await majorsCollection.insertOne(majorData);

    // Add the major to the respective season
    await seasonsCollection.updateOne(
      { _id: new ObjectId(majorData.season) },
      { $push: { majors: result.insertedId } }
    );

    res.status(201).json({ message: "Major created successfully", majorId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create major", details: err.message });
  }
});

// Get all Majors
app.get("/api/majors", async (req, res) => {
  try {
    const majors = await majorsCollection.find().toArray();
    res.status(200).json(majors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch majors", details: err.message });
  }
});

// Get a single Major by ID
app.get("/api/majors/:id", async (req, res) => {
  try {
    const major = await majorsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!major) {
      return res.status(404).json({ error: "Major not found" });
    }
    res.status(200).json(major);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch major", details: err.message });
  }
});

// Update a Major by ID
app.put("/api/majors/:id", async (req, res) => {
  try {
    const result = await majorsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Major not found" });
    }
    res.status(200).json({ message: "Major updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update major", details: err.message });
  }
});

// Delete a Major by ID
app.delete("/api/majors/:id", async (req, res) => {
  try {
    const majorId = new ObjectId(req.params.id);

    // Find the major to get the season reference
    const major = await majorsCollection.findOne({ _id: majorId });
    if (!major) {
      return res.status(404).json({ error: "Major not found" });
    }

    // Remove the major from the season
    await seasonsCollection.updateOne(
      { _id: new ObjectId(major.season) },
      { $pull: { majors: majorId } }
    );

    // Delete the major
    const result = await majorsCollection.deleteOne({ _id: majorId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete major" });
    }

    res.status(200).json({ message: "Major deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete major", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************SERIES*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Series
app.post("/api/series", async (req, res) => {
  try {
    const seriesData = req.body;
    if (!seriesData.major) {
      return res.status(400).json({ error: "Major ID is required to create a Series." });
    }

    // Insert the new series document
    const result = await seriesCollection.insertOne(seriesData);

    // If a major ID is provided, update the Major collection to include this series
    await majorsCollection.updateOne(
      { _id: new ObjectId(seriesData.major) },
      { $push: { series: result.insertedId } }
    );

    res.status(201).json({
      message: "Series created successfully",
      seriesId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create series", details: err.message });
  }
});

// Get all Series (GET)
app.get("/api/series", async (req, res) => {
  try {
    const series = await seriesCollection.find().toArray();
    res.status(200).json(series);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch series", details: err.message });
  }
});

// Get a single Series by ID (GET)
app.get("/api/series/:id", async (req, res) => {
  try {
    const series = await seriesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }
    res.status(200).json(series);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch series", details: err.message });
  }
});

// Update a Series by ID (PUT)
app.put("/api/series/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const result = await seriesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Series not found" });
    }
    res.status(200).json({ message: "Series updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update series", details: err.message });
  }
});

// Delete a Series by ID (DELETE)
app.delete("/api/series/:id", async (req, res) => {
  try {
    const seriesId = new ObjectId(req.params.id);

    // Find the series to get the major reference
    const series = await seriesCollection.findOne({ _id: seriesId });
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }

    // Remove the series from the corresponding Major
    await majorsCollection.updateOne(
      { _id: new ObjectId(series.major) },
      { $pull: { series: seriesId } }
    );

    // Delete the series
    const result = await seriesCollection.deleteOne({ _id: seriesId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete series" });
    }

    res.status(200).json({ message: "Series deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete series", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// ********************************************MATCHES*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new match (POST)
app.post("/api/matches", async (req, res) => {
  try {
    const matchData = req.body;
    if (!matchData.series) {
      return res.status(400).json({ error: "Series ID is required to create a Match." });
    }

    // Insert the new match document
    const result = await matchesCollection.insertOne(matchData);

    // If a series ID is provided, update the Series collection to include this match
    await seriesCollection.updateOne(
      { _id: new ObjectId(matchData.series) },
      { $push: { matches: result.insertedId } }
    );

    res.status(201).json({
      message: "Match created successfully",
      matchId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create match", details: err.message });
  }
});

// Get all matches (GET)
app.get("/api/matches", async (req, res) => {
  try {
    const matches = await matchesCollection.find().toArray();
    res.status(200).json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matches", details: err.message });
  }
});

// Get a single match by ID (GET)
app.get("/api/matches/:id", async (req, res) => {
  try {
    const match = await matchesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(200).json(match);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch match", details: err.message });
  }
});

// Update a match by ID (PUT)
app.put("/api/matches/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(200).json({ message: "Match updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update match", details: err.message });
  }
});

// Delete a match by ID (DELETE)
app.delete("/api/matches/:id", async (req, res) => {
  try {
    const matchId = new ObjectId(req.params.id);

    // First, find the match to get the series reference
    const match = await matchesCollection.findOne({ _id: matchId });
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Remove the match from the series it belongs to
    await seriesCollection.updateOne(
      { _id: new ObjectId(match.series) },
      { $pull: { matches: matchId } }
    );

    // Delete the match
    const result = await matchesCollection.deleteOne({ _id: matchId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete match" });
    }

    res.status(200).json({ message: "Match deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete match", details: err.message });
  }
});

// Start the server
const PORT = process.env.DEV_SERVER_URL_PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
