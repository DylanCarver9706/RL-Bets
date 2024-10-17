// server.js
const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)


// ************************************************************************************************
// ************************************************************************************************
// *******************************************MIDDLEWARE*******************************************
// ************************************************************************************************
// ************************************************************************************************
const app = express();
app.use(bodyParser.json());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Replace with your frontend URL
    methods: "GET,PUT,POST,DELETE", // Allowed methods
    credentials: true, // Enable credentials (cookies, authorization headers)
  })
);

// Use this for testing only
// app.use(cors({ origin: "*" }));

// ************************************************************************************************
// ************************************************************************************************
// ********************************************MONGODB*********************************************
// ************************************************************************************************
// ************************************************************************************************

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
let usersCollection,
  wagersCollection,
  seasonsCollection,
  tournamentsCollection,
  seriesCollection,
  matchesCollection,
  teamsCollection,
  playersCollection;

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("RLBets");
    usersCollection = database.collection("Users");
    wagersCollection = database.collection("Wagers");
    seasonsCollection = database.collection("Seasons");
    tournamentsCollection = database.collection("Tournaments");
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
// *****************************************API ENDPOINTS******************************************
// ************************************************************************************************
// ************************************************************************************************

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
    res
      .status(500)
      .json({ error: "Failed to create user", details: err.message });
  }
});

// Get all users (GET)
app.get("/api/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch users", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch user", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to update user", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to delete user", details: err.message });
  }
});

// Find a user by Firebase ID (GET)
app.get("/api/users/firebase/:firebaseUserId", async (req, res) => {
  try {
    const user = await usersCollection.findOne({
      firebaseUserId: req.params.firebaseUserId,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************STRIPE*********************************************
// ************************************************************************************************
// ************************************************************************************************

app.post("/api/create-checkout-session", async (req, res) => {
  const { purchaseItems } = req.body;

  const lineItems = purchaseItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100), // Round to ensure valid cents
    },
    quantity: item.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.DEV_CLIENT_URL}`,
      cancel_url: `${process.env.DEV_CLIENT_URL}/Credits`,
    });

    res.json(session);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session." });
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
    res
      .status(500)
      .json({ error: "Failed to create wager", details: err.message });
  }
});

// Get all wagers (GET)
app.get("/api/wagers", async (req, res) => {
  try {
    const wagers = await wagersCollection.find().toArray();

    // Calculate percentages for agree/disagree bets
    const wagersWithPercentages = wagers.map((wager) => {
      const totalBets = wager.agreeBetsCount + wager.disagreeBetsCount;
      const agreePercentage = totalBets ? ((wager.agreeBetsCount / totalBets) * 100).toFixed(1) : 0;
      const disagreePercentage = totalBets ? ((wager.disagreeBetsCount / totalBets) * 100).toFixed(1) : 0;

      return {
        ...wager,
        agreePercentage: parseFloat(agreePercentage),
        disagreePercentage: parseFloat(disagreePercentage),
      };
    });

    res.status(200).json(wagersWithPercentages);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch wagers", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch wager", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to update wager", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to delete wager", details: err.message });
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
    res
      .status(201)
      .json({
        message: "Season created successfully",
        seasonId: result.insertedId,
      });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create season", details: err.message });
  }
});

// Get all Seasons
app.get("/api/seasons", async (req, res) => {
  try {
    const seasons = await seasonsCollection.find().toArray();
    res.status(200).json(seasons);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch seasons", details: err.message });
  }
});

// Get a single Season by ID
app.get("/api/seasons/:id", async (req, res) => {
  try {
    const season = await seasonsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json(season);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch season", details: err.message });
  }
});

// Update a Season by ID
app.put("/api/seasons/:id", async (req, res) => {
  try {
    const result = await seasonsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json({ message: "Season updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update season", details: err.message });
  }
});

// Delete a Season by ID
app.delete("/api/seasons/:id", async (req, res) => {
  try {
    const result = await seasonsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.status(200).json({ message: "Season deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete season", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// ******************************************Tournaments*******************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Tournament
app.post("/api/tournaments", async (req, res) => {
  try {
    const tournamentData = req.body;
    if (!tournamentData.season) {
      return res
        .status(400)
        .json({ error: "Season ID is required to create a Tournament." });
    }

    const result = await tournamentsCollection.insertOne(tournamentData);

    // Add the tournament to the respective season
    await seasonsCollection.updateOne(
      { _id: new ObjectId(tournamentData.season) },
      { $push: { tournaments: result.insertedId } }
    );

    res
      .status(201)
      .json({
        message: "Tournament created successfully",
        tournamentId: result.insertedId,
      });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create tournament", details: err.message });
  }
});

// Get all Tournaments
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await tournamentsCollection.find().toArray();
    res.status(200).json(tournaments);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch tournaments", details: err.message });
  }
});

// Get a single Tournament by ID
app.get("/api/tournaments/:id", async (req, res) => {
  try {
    const tournament = await tournamentsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.status(200).json(tournament);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch tournament", details: err.message });
  }
});

// Update a Tournament by ID
app.put("/api/tournaments/:id", async (req, res) => {
  try {
    const result = await tournamentsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.status(200).json({ message: "Tournament updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update tournament", details: err.message });
  }
});

// Delete a Tournament by ID
app.delete("/api/tournaments/:id", async (req, res) => {
  try {
    const tournamentId = new ObjectId(req.params.id);

    // Find the tournament to get the season reference
    const tournament = await tournamentsCollection.findOne({ _id: tournamentId });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Remove the tournament from the season
    await seasonsCollection.updateOne(
      { _id: new ObjectId(tournament.season) },
      { $pull: { tournaments: tournamentId } }
    );

    // Delete the tournament
    const result = await tournamentsCollection.deleteOne({ _id: tournamentId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete tournament" });
    }

    res.status(200).json({ message: "Tournament deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete tournament", details: err.message });
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
    if (!seriesData.tournament) {
      return res
        .status(400)
        .json({ error: "Tournament ID is required to create a Series." });
    }

    // Insert the new series document
    const result = await seriesCollection.insertOne(seriesData);

    // If a tournament ID is provided, update the Tournament collection to include this series
    await tournamentsCollection.updateOne(
      { _id: new ObjectId(seriesData.tournament) },
      { $push: { series: result.insertedId } }
    );

    res.status(201).json({
      message: "Series created successfully",
      seriesId: result.insertedId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create series", details: err.message });
  }
});

// Get all Series (GET)
app.get("/api/series", async (req, res) => {
  try {
    const series = await seriesCollection.find().toArray();
    res.status(200).json(series);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch series", details: err.message });
  }
});

// Get a single Series by ID (GET)
app.get("/api/series/:id", async (req, res) => {
  try {
    const series = await seriesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }
    res.status(200).json(series);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch series", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to update series", details: err.message });
  }
});

// Delete a Series by ID (DELETE)
app.delete("/api/series/:id", async (req, res) => {
  try {
    const seriesId = new ObjectId(req.params.id);

    // Find the series to get the tournament reference
    const series = await seriesCollection.findOne({ _id: seriesId });
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }

    // Remove the series from the corresponding Tournament
    await tournamentsCollection.updateOne(
      { _id: new ObjectId(series.tournament) },
      { $pull: { series: seriesId } }
    );

    // Delete the series
    const result = await seriesCollection.deleteOne({ _id: seriesId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete series" });
    }

    res.status(200).json({ message: "Series deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete series", details: err.message });
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
      return res
        .status(400)
        .json({ error: "Series ID is required to create a Match." });
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
    res
      .status(500)
      .json({ error: "Failed to create match", details: err.message });
  }
});

// Get all matches (GET)
app.get("/api/matches", async (req, res) => {
  try {
    const matches = await matchesCollection.find().toArray();
    res.status(200).json(matches);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch matches", details: err.message });
  }
});

// Get a single match by ID (GET)
app.get("/api/matches/:id", async (req, res) => {
  try {
    const match = await matchesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(200).json(match);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch match", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to update match", details: err.message });
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
    res
      .status(500)
      .json({ error: "Failed to delete match", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// **********************************************TEAMS*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Team (POST)
app.post("/api/teams", async (req, res) => {
  try {
    const teamData = req.body;
    if (!teamData.name) {
      return res.status(400).json({ error: "Team name is required." });
    }

    // Insert the new team document
    const result = await teamsCollection.insertOne(teamData);

    res.status(201).json({
      message: "Team created successfully",
      teamId: result.insertedId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create team", details: err.message });
  }
});

// Get all Teams (GET)
app.get("/api/teams", async (req, res) => {
  try {
    const teams = await teamsCollection.find().toArray();
    res.status(200).json(teams);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch teams", details: err.message });
  }
});

// Get a single Team by ID (GET)
app.get("/api/teams/:id", async (req, res) => {
  try {
    const team = await teamsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.status(200).json(team);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch team", details: err.message });
  }
});

// Update a Team by ID (PUT)
app.put("/api/teams/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const result = await teamsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.status(200).json({ message: "Team updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update team", details: err.message });
  }
});

// Delete a Team by ID (DELETE)
app.delete("/api/teams/:id", async (req, res) => {
  try {
    const teamId = new ObjectId(req.params.id);

    // Check if the team exists
    const team = await teamsCollection.findOne({ _id: teamId });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Remove the players that belong to this team
    await playersCollection.deleteMany({ team: teamId });

    // Delete the team
    const result = await teamsCollection.deleteOne({ _id: teamId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete team" });
    }

    res.status(200).json({ message: "Team deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete team", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// ********************************************PLAYERS*********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new Player (POST)
app.post("/api/players", async (req, res) => {
  try {
    const playerData = req.body;
    if (!playerData.name || !playerData.team) {
      return res
        .status(400)
        .json({ error: "Player name and team ID are required." });
    }

    // Insert the new player document
    const result = await playersCollection.insertOne(playerData);

    // Add the player to the corresponding team
    await teamsCollection.updateOne(
      { _id: new ObjectId(playerData.team) },
      { $push: { players: result.insertedId } }
    );

    res.status(201).json({
      message: "Player created successfully",
      playerId: result.insertedId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create player", details: err.message });
  }
});

// Get all Players (GET)
app.get("/api/players", async (req, res) => {
  try {
    const players = await playersCollection.find().toArray();
    res.status(200).json(players);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch players", details: err.message });
  }
});

// Get a single Player by ID (GET)
app.get("/api/players/:id", async (req, res) => {
  try {
    const player = await playersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.status(200).json(player);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch player", details: err.message });
  }
});

// Update a Player by ID (PUT)
app.put("/api/players/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const result = await playersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.status(200).json({ message: "Player updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update player", details: err.message });
  }
});

// Delete a Player by ID (DELETE)
app.delete("/api/players/:id", async (req, res) => {
  try {
    const playerId = new ObjectId(req.params.id);

    // Find the player to get the team reference
    const player = await playersCollection.findOne({ _id: playerId });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Remove the player from the team
    await teamsCollection.updateOne(
      { _id: new ObjectId(player.team) },
      { $pull: { players: playerId } }
    );

    // Delete the player
    const result = await playersCollection.deleteOne({ _id: playerId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Failed to delete player" });
    }

    res.status(200).json({ message: "Player deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete player", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *******************************************DATA TREES*******************************************
// ************************************************************************************************
// ************************************************************************************************

// Get complete information for a season (GET)
app.get("/api/data-trees/season/:id", async (req, res) => {
  try {
    // Fetch the season document
    const season = await seasonsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }

    // Fetch the tournaments related to this season
    const tournaments = await tournamentsCollection
      .find({ _id: { $in: season.tournaments } })
      .toArray();

    // Fetch all series for the tournaments
    const seriesList = await seriesCollection
      .find({ tournament: { $in: season.tournaments } })
      .toArray();

    // Fetch all matches for the series
    const seriesIds = seriesList.map((series) => series._id);
    const matches = await matchesCollection
      .find({ series: { $in: seriesIds } })
      .toArray();

    // Fetch all teams for the series and matches
    const matchTeamIds = matches.flatMap((match) => match.teams);
    const seriesTeamIds = seriesList.flatMap((series) => series.teams);
    const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])]; // Unique list of all team IDs
    const teams = await teamsCollection
      .find({ _id: { $in: allTeamIds } })
      .toArray();

    // Fetch all players for the teams
    const playerIds = teams.flatMap((team) => team.players);
    const players = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Map teams with their respective players
    const teamsWithPlayers = teams.map((team) => ({
      ...team,
      players: players.filter((player) => player.team.equals(team._id)), // Populate players in the team
    }));

    // Map matches with their respective teams and players
    const matchesWithTeams = matches.map((match) => ({
      ...match,
      teams: teamsWithPlayers.filter((team) =>
        match.teams.some((t) => t.equals(team._id))
      ), // Populate teams in the match
    }));

    // Map series with their respective matches and teams
    const seriesWithMatches = seriesList.map((series) => ({
      ...series,
      teams: teamsWithPlayers.filter((team) =>
        series.teams.some((t) => t.equals(team._id))
      ), // Populate teams in the series
      matches: matchesWithTeams.filter((match) =>
        match.series.equals(series._id)
      ), // Populate matches in the series
    }));

    // Map tournaments with their respective series
    const tournamentsWithSeries = tournaments.map((tournament) => ({
      ...tournament,
      series: seriesWithMatches.filter((series) =>
        series.tournament.equals(tournament._id)
      ), // Populate series in the tournament
    }));

    // Construct the complete season object
    const seasonWithTournaments = {
      ...season,
      tournaments: tournamentsWithSeries,
    };

    res.status(200).json(seasonWithTournaments);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch season data", details: err.message });
  }
});

// Get complete information for a tournament (GET)
app.get("/api/data-trees/tournament/:id", async (req, res) => {
  try {
    // Fetch the tournament document
    const tournament = await tournamentsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Fetch all series for this tournament
    const seriesList = await seriesCollection
      .find({ tournament: tournament._id })
      .toArray();

    // Fetch all matches for the series
    const seriesIds = seriesList.map((series) => series._id);
    const matches = await matchesCollection
      .find({ series: { $in: seriesIds } })
      .toArray();

    // Fetch all teams for the series and matches
    const matchTeamIds = matches.flatMap((match) => match.teams);
    const seriesTeamIds = seriesList.flatMap((series) => series.teams);
    const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])];
    const teams = await teamsCollection
      .find({ _id: { $in: allTeamIds } })
      .toArray();

    // Fetch all players for the teams
    const playerIds = teams.flatMap((team) => team.players);
    const players = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Map teams with their respective players
    const teamsWithPlayers = teams.map((team) => ({
      ...team,
      players: players.filter((player) => player.team.equals(team._id)),
    }));

    // Map matches with their respective teams and players
    const matchesWithTeams = matches.map((match) => ({
      ...match,
      teams: teamsWithPlayers.filter((team) =>
        match.teams.some((t) => t.equals(team._id))
      ),
    }));

    // Map series with their respective matches and teams
    const seriesWithMatches = seriesList.map((series) => ({
      ...series,
      teams: teamsWithPlayers.filter((team) =>
        series.teams.some((t) => t.equals(team._id))
      ),
      matches: matchesWithTeams.filter((match) =>
        match.series.equals(series._id)
      ),
    }));

    // Construct the complete tournament object
    const tournamentWithSeries = {
      ...tournament,
      series: seriesWithMatches,
    };

    res.status(200).json(tournamentWithSeries);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch tournament data", details: err.message });
  }
});

// Get complete information for a series (GET)
app.get("/api/data-trees/series/:id", async (req, res) => {
  try {
    // Fetch the series document
    const series = await seriesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }

    // Fetch all matches for this series
    const matches = await matchesCollection
      .find({ series: series._id })
      .toArray();

    // Fetch all teams for the series and matches
    const matchTeamIds = matches.flatMap((match) => match.teams);
    const seriesTeamIds = series.teams || [];
    const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])];
    const teams = await teamsCollection
      .find({ _id: { $in: allTeamIds } })
      .toArray();

    // Fetch all players for the teams
    const playerIds = teams.flatMap((team) => team.players);
    const players = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Map teams with their respective players
    const teamsWithPlayers = teams.map((team) => ({
      ...team,
      players: players.filter((player) => player.team.equals(team._id)),
    }));

    // Map matches with their respective teams and players
    const matchesWithTeams = matches.map((match) => ({
      ...match,
      teams: teamsWithPlayers.filter((team) =>
        match.teams.some((t) => t.equals(team._id))
      ),
    }));

    // Construct the complete series object
    const seriesWithMatches = {
      ...series,
      teams: teamsWithPlayers,
      matches: matchesWithTeams,
    };

    res.status(200).json(seriesWithMatches);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch series data", details: err.message });
  }
});

// Get items that are able to be bet on (GET)
app.get("/api/data-trees/betable", async (req, res) => {
  try {
    // Fetch all betable matches
    const betableMatches = await matchesCollection
      .find({ status: "Betable" })
      .toArray();

    const seriesIds = betableMatches.map((match) => match.series);

    // Fetch the series for the betable matches
    const betableSeries = await seriesCollection
      .find({
        $or: [{ status: "Betable" }, { _id: { $in: seriesIds } }],
      })
      .toArray();

    const tournamentIds = betableSeries.map((series) => series.tournament);

    // Fetch the tournaments for the betable series
    const betableTournaments = await tournamentsCollection
      .find({
        $or: [{ status: "Betable" }, { _id: { $in: tournamentIds } }],
      })
      .toArray();

    const seasonIds = betableTournaments.map((tournament) => tournament.season);

    // Fetch the seasons for the betable tournaments
    const betableSeasons = await seasonsCollection
      .find({
        $or: [{ status: "Betable" }, { _id: { $in: seasonIds } }],
      })
      .toArray();

    // Fetch all teams related to the betable matches and series
    const allTeamIds = [
      ...new Set(
        betableMatches.flatMap((match) => match.teams).concat(
          betableSeries.flatMap((series) => series.teams)
        )
      ),
    ];

    const teams = await teamsCollection
      .find({ _id: { $in: allTeamIds } })
      .toArray();

    // Fetch all players from the fetched teams
    const playerIds = teams.flatMap((team) => team.players);

    const players = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Map teams with their players
    const teamsWithPlayers = teams.map((team) => ({
      ...team,
      players: players.filter((player) => player.team.equals(team._id)),
    }));

    // Map matches with their teams
    const matchesWithTeams = betableMatches.map((match) => ({
      ...match,
      teams: teamsWithPlayers.filter((team) =>
        match.teams.some((t) => t.equals(team._id))
      ),
    }));

    // Map series with their matches and teams
    const seriesWithMatches = betableSeries.map((series) => ({
      ...series,
      matches: matchesWithTeams.filter((match) =>
        match.series.equals(series._id)
      ),
      teams: teamsWithPlayers.filter((team) =>
        series.teams.some((t) => t.equals(team._id))
      ),
    }));

    // Map tournaments with their series
    const tournamentsWithSeries = betableTournaments.map((tournament) => ({
      ...tournament,
      series: seriesWithMatches.filter((series) =>
        series.tournament.equals(tournament._id)
      ),
    }));

    // Map seasons with their tournaments
    const seasonsWithTournaments = betableSeasons.map((season) => ({
      ...season,
      tournaments: tournamentsWithSeries.filter((tournament) =>
        tournament.season.equals(season._id)
      ),
    }));

    res.status(200).json(seasonsWithTournaments);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch betable data", details: err.message });
  }
});


// ************************************************************************************************
// ************************************************************************************************
// ******************************************START SERVER******************************************
// ************************************************************************************************
// ************************************************************************************************

// Start the server
const PORT = process.env.DEV_SERVER_URL_PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
