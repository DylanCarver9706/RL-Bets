// server.js
const express = require("express");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// ************************************************************************************************
// ************************************************************************************************
// *******************************************MIDDLEWARE*******************************************
// ************************************************************************************************
// ************************************************************************************************

const app = express();

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();  // Skip JSON body parsing for the webhook route
  } else {
    express.json()(req, res, next);  // Use JSON body parser for all other routes
  }
});

const server = http.createServer(app);  // Use the same HTTP server for Express and WebSocket

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,  // Allow the React client to connect
  },
});

// CORS middleware for Express
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
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
  logsCollection,
  wagersCollection,
  betsCollection,
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
    logsCollection = database.collection("Logs");
    wagersCollection = database.collection("Wagers");
    betsCollection = database.collection("Bets");
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
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
});

// Update a user by ID (PUT) and emit a WebSocket event to update the client in real time
app.put("/api/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch the updated user data
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });

    // Emit 'updateUser' event with updated user data to all connected clients
    io.emit("updateUser", updatedUser);

    // Fetch all users after the update
    const allUsers = await usersCollection.find().toArray();

    // Emit 'updateUsers' event with all users to all connected clients
    io.emit("updateUsers", allUsers);

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
// **********************************************LOGS**********************************************
// ************************************************************************************************
// ************************************************************************************************

// Function to create a new log
const createLog = async (logData) => {
  try {
    const result = await logsCollection.insertOne(logData);
    
    const logs = await getAllLogs()
    io.emit("updatedLogs", logs)

    return { logId: result.insertedId };
  } catch (err) {
    throw new Error('Failed to create log: ' + err.message);
  }
};

// Function to retrieve all logs
const getAllLogs = async () => {
  try {
    return await logsCollection.find().toArray();
  } catch (err) {
    throw new Error('Failed to retrieve logs: ' + err.message);
  }
};

// Create a new log (POST)
app.post('/api/logs', async (req, res) => {
  try {
    const logData = req.body; // Accept any fields from the request body
    const result = await createLog(logData);

    const updatedLogs = await getAllLogs();
    io.emit("updatedLogs", updatedLogs)

    res.status(201).json({
      message: 'Log created successfully',
      logId: result.logId,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Retrieve all logs (GET)
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getAllLogs();
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Retrieve a log by ID (GET)
app.get('/api/logs/:id', async (req, res) => {
  try {
    const log = await logsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.status(200).json(log);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve log',
      details: err.message,
    });
  }
});

// Update a log by ID (PUT)
app.put('/api/logs/:id', async (req, res) => {
  try {
    const logData = req.body; // Accept any fields from the request body
    const result = await logsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: logData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.status(200).json({ message: 'Log updated successfully' });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to update log',
      details: err.message,
    });
  }
});

// Delete a log by ID (DELETE)
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const result = await logsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.status(200).json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to delete log',
      details: err.message,
    });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************STRIPE*********************************************
// ************************************************************************************************
// ************************************************************************************************

app.post("/api/create-checkout-session", async (req, res) => {
  const { purchaseItems, mongoUserId, creditsTotal } = req.body;

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
      metadata: {
        mongoUserId: mongoUserId,
        creditsTotal: creditsTotal
      },
    });

    res.json(session);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

// Webhooks
app.post('/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':  // You can also use payment_intent.succeeded
      const session = event.data.object;

      // Extract the user ID from the session metadata (assuming you passed it during checkout creation)
      const userId = session.metadata.mongoUserId;
      const creditsPurchased = session.metadata.creditsTotal;  // Custom field to track credits purchased

      try {
        // Fetch the current user's credits
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (user) {
          // Calculate new credits
          const updatedCredits = (user.credits || 0) + parseFloat(creditsPurchased);

          // Update the user's credits in the database
          await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { credits: updatedCredits } }
          );

          // Optionally emit an update to WebSocket clients
          const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
          io.emit('updateUser', updatedUser);  // Notify clients about the update
        }
      } catch (error) {
        console.error('Error updating user credits:', error.message);
      }

      break;

    // Handle other Stripe event types here (e.g., payment_intent.failed)
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.status(200).send();
});

// ************************************************************************************************
// ************************************************************************************************
// *******************************************SOCKET.IO********************************************
// ************************************************************************************************
// ************************************************************************************************

// WebSocket connection handler
io.on("connection", async (socket) => {
  // console.log("New client connected");

  // Fetch wagers and send them to the client immediately upon connection
  const wagers = await getAllWagers();
  socket.emit("wagersUpdate", wagers);

  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
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

    // Fetch wagers and send them to the client immediately upon connection
    const wagers = await getAllWagers();
    io.emit("wagersUpdate", wagers);

    createLog({ ...req.body, type: "Wager Created", wagerId: result.insertedId })

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
// Helper function to fetch and calculate wager percentages
const getAllWagers = async () => {
  try {
    const wagers = await wagersCollection.find().toArray();

    const wagersWithStats = await Promise.all(
      wagers.map(async (wager) => {
        const betIds = wager.bets || [];
        const bets = await betsCollection.find({ _id: { $in: betIds } }).toArray();

        // Calculate agree/disagree counts and credit totals
        const agreeBets = bets.filter((bet) => bet.agreeBet === true);
        const disagreeBets = bets.filter((bet) => bet.agreeBet === false);

        const agreeCreditsBet = agreeBets.reduce((sum, bet) => sum + bet.credits, 0);
        const disagreeCreditsBet = disagreeBets.reduce((sum, bet) => sum + bet.credits, 0);
        const agreeBetsCount = agreeBets.length;
        const disagreeBetsCount = disagreeBets.length;

        // Calculate percentages for agree/disagree bets
        const totalBets = agreeBetsCount + disagreeBetsCount;
        const agreePercentage = totalBets ? ((agreeBetsCount / totalBets) * 100).toFixed(1) : 0;
        const disagreePercentage = totalBets ? ((disagreeBetsCount / totalBets) * 100).toFixed(1) : 0;

        return {
          ...wager,
          agreeCreditsBet,
          disagreeCreditsBet,
          agreeBetsCount,
          disagreeBetsCount,
          agreePercentage: parseFloat(agreePercentage),  // Return as float
          disagreePercentage: parseFloat(disagreePercentage),  // Return as float
          bets: bets
        };
      })
    );

    return wagersWithStats;
  } catch (err) {
    console.error("Failed to fetch wagers", err);
    return [];
  }
};

// HTTP route for getting wagers (for fallback or initial load)
app.get("/api/wagers", async (req, res) => {
  const wagers = await getAllWagers();
  res.status(200).json(wagers);
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

    // Fetch bet data for this wager
    const betIds = wager.bets || [];
    const bets = await betsCollection.find({ _id: { $in: betIds } }).toArray();

    // Calculate agree/disagree counts and credit totals
    const agreeBets = bets.filter((bet) => bet.agreeBet === true);
    const disagreeBets = bets.filter((bet) => bet.agreeBet === false);

    const agreeCreditsBet = agreeBets.reduce((sum, bet) => sum + bet.credits, 0);
    const disagreeCreditsBet = disagreeBets.reduce((sum, bet) => sum + bet.credits, 0);
    const agreeBetsCount = agreeBets.length;
    const disagreeBetsCount = disagreeBets.length;

    const wagerWithStats = {
      ...wager,
      agreeCreditsBet,
      disagreeCreditsBet,
      agreeBetsCount,
      disagreeBetsCount,
    };

    res.status(200).json(wagerWithStats);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch wager", details: err.message });
  }
});

const WagerOutcomeFormula = (betAmount, totalWinnersBetsAmount, totalLosersBetsAmount) => {
  return ((betAmount / totalWinnersBetsAmount) * totalLosersBetsAmount) + betAmount
}

// Function to pay out bets
const payOutBetWinners = async (wagerId, agreeIsWinner) => {
  // Find all wagers where rlEventReference matches the converted ObjectId
  const wager = await wagersCollection.findOne({ _id: new ObjectId(wagerId) });

  // console.log(wager)

  // Get all the bets in the wager
  const wagerBets = await betsCollection.find({
    _id: { $in: wager.bets }
  }).toArray();

  // Calculate the total credits for the winner and loser bets
  let loserCredits = 0
  let winnerCredits = 0
  for (let index = 0; index < wagerBets.length; index++) {
    const bet = wagerBets[index];
    if (bet.agreeBet !== agreeIsWinner) {
      loserCredits += bet.credits
    } else {
      winnerCredits += bet.credits
    }
  }

  // Update users credits field to add the credits they won
  for (let index = 0; index < wagerBets.length; index++) {
    const bet = wagerBets[index];
    if (bet.agreeBet == agreeIsWinner) {
      const user = await usersCollection.findOne({ _id: new ObjectId(bet.user) });
      awardedCredits = WagerOutcomeFormula(bet.credits, winnerCredits, loserCredits)
      console.log(user._id, awardedCredits)
      await usersCollection.updateOne(
        { _id: new ObjectId(bet.user) },
        { $set: { earnedCredits: user.earnedCredits + awardedCredits, credits: user.credits + awardedCredits } }
      );
      
      createLog({ wagerId: wagerId, earnedCredits: awardedCredits, type: "User Paid Out", user: user._id })

      // Fetch the updated user data
      const updatedUser = await usersCollection.findOne({ _id: new ObjectId(user._id) });

      // Emit 'updateUser' event with updated user data to all connected clients
      io.emit("updateUser", updatedUser);
    }
  }
}

// Update a wager after it has ended by ID (PUT)
// Used by admin client
app.put("/api/wager_ended/:id", async (req, res) => {
  try {
    const { agreeIsWinner } = req.body;

    const updatedWager = {
      status: "Ended",
      agreeIsWinner: agreeIsWinner,
    };

    const result = await wagersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedWager }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Wager not found" });
    }

    createLog({ ...req.body, type: "Wager Ended", WagerId: req.params.id })

    // Fetch updated wager and statistics
    const updatedWagers = await getAllWagers();
    io.emit("wagersUpdate", updatedWagers);  // Emit updated data to all clients

    await payOutBetWinners(req.params.id, agreeIsWinner)

    res.status(200).json({ message: "Wager updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update wager", details: err.message });
  }
});

// Update a wager by ID (PUT)
// Used by admin client
app.put("/api/wagers/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updatedWager = {
      status: status,
    };

    const result = await wagersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedWager }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Wager not found" });
    }

    // Fetch updated wager and statistics
    const updatedWagers = await getAllWagers();
    io.emit("wagersUpdate", updatedWagers);  // Emit updated data to all clients

    createLog({ ...req.body, type: `Wager ${status}`, wagerId: req.params.id })

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
    const wagerId = new ObjectId(req.params.id);

    // Delete the wager
    const wagerResult = await wagersCollection.deleteOne({ _id: wagerId });
    if (wagerResult.deletedCount === 0) {
      return res.status(404).json({ error: "Wager not found" });
    }

    // Delete associated bets
    await betsCollection.deleteMany({ wagerId: wagerId });

    res.status(200).json({ message: "Wager and associated bets deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete wager and bets", details: err.message });
  }
});

// Delete all wagers and their associated bets (DELETE)
app.delete("/api/wagers", async (req, res) => {
  try {
    // Delete all wagers
    const wagerResult = await wagersCollection.deleteMany({});
    if (wagerResult.deletedCount === 0) {
      return res.status(404).json({ error: "No wagers found to delete" });
    }

    // Delete all associated bets
    await betsCollection.deleteMany({});

    res.status(200).json({ message: "All wagers and associated bets deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete wagers and bets", details: err.message });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// **********************************************BETS**********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new bet (POST)
app.post("/api/bets", async (req, res) => {
  const { user, credits, agreeBet, rlEventReference, wagerId } = req.body;

  try {
    // Ensure all required fields are present
    if (!user || !credits || agreeBet === undefined || !rlEventReference || !wagerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch the user's current credits
    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user) });
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure the user has enough credits to place the bet
    if (userDoc.credits < credits) {
      return res.status(400).json({ error: "Insufficient credits" });
    }

    // Create the new bet document
    const newBet = {
      user: new ObjectId(user),
      credits: credits,
      agreeBet: agreeBet,
      rlEventReference: new ObjectId(rlEventReference),
      wagerId: new ObjectId(wagerId)
    };

    // Insert the bet into the Bets collection
    const betResult = await betsCollection.insertOne(newBet);
    const betId = betResult.insertedId;

    createLog({ ...req.body, type: "Bet Created", betId: betId })

    // Append the new bet's ObjectId to the `bets` array in the associated wager
    await wagersCollection.updateOne(
      { _id: new ObjectId(wagerId) },
      { $push: { bets: betId } }
    );

    // Deduct the bet amount from the user's credits
    const updatedCredits = userDoc.credits - credits;
    await usersCollection.updateOne(
      { _id: new ObjectId(user) },
      { $set: { credits: updatedCredits } }
    );

    // Fetch the updated user data
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(user) });

    // Emit 'updateUser' event with updated user data to all connected clients
    io.emit("updateUser", updatedUser);

    // Send success response
    res.status(201).json({
      message: "Bet created, user's credits updated, and added to wager successfully",
      betId: betId,
      updatedCredits: updatedCredits  // Return updated credits for client if needed
    });

    // Fetch wagers and send them to the client immediately upon connection
    const wagers = await getAllWagers();
    io.emit("wagersUpdate", wagers);

  } catch (err) {
    console.error("Error creating bet:", err);
    res.status(500).json({ error: "Failed to create bet", details: err.message });
  }
});

// Get all bets (GET)
app.get("/api/bets", async (req, res) => {
  try {
    const bets = await betsCollection.find().toArray();
    res.status(200).json(bets);
  } catch (err) {
    console.error("Error fetching bets:", err);
    res.status(500).json({ error: "Failed to fetch bets", details: err.message });
  }
});

// Get a single bet by ID (GET)
app.get("/api/bets/:id", async (req, res) => {
  try {
    const bet = await betsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }
    res.status(200).json(bet);
  } catch (err) {
    console.error("Error fetching bet:", err);
    res.status(500).json({ error: "Failed to fetch bet", details: err.message });
  }
});

// Update a bet by ID (PUT)
app.put("/api/bets/:id", async (req, res) => {
  const { credits, agreeBet, rlEventReference, wagerId } = req.body;

  try {
    // Ensure required fields are provided
    if (!wagerId) {
      return res.status(400).json({ error: "Missing wagerId" });
    }

    // Only update provided fields
    const updateFields = {};
    if (credits !== undefined) updateFields.credits = credits;
    if (agreeBet !== undefined) updateFields.agreeBet = agreeBet;
    if (rlEventReference) updateFields.rlEventReference = new ObjectId(rlEventReference);

    const result = await betsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Bet not found" });
    }

    res.status(200).json({ message: "Bet updated successfully" });
  } catch (err) {
    console.error("Error updating bet:", err);
    res.status(500).json({ error: "Failed to update bet", details: err.message });
  }
});

// Delete a bet by ID (DELETE)
app.delete("/api/bets/:id", async (req, res) => {
  try {
    const result = await betsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Bet not found" });
    }

    res.status(200).json({ message: "Bet deleted successfully" });
  } catch (err) {
    console.error("Error deleting bet:", err);
    res.status(500).json({ error: "Failed to delete bet", details: err.message });
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

// Update a match by ID (PUT)
app.put("/api/match_concluded/:id", async (req, res) => {
  try {
    const { results, winner, loser, endTournament, endSeason } = req.body;

    let message = " updated successfully"
    
    // Ensure all required fields are present in the request body
    if (!results || !winner || !loser) {
      return res.status(400).json({ error: "Missing required fields in the request body" });
    }

    // Find the match by its ID
    const matchDoc = await matchesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!matchDoc) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Find the series by its ID
    const seriesDoc = await seriesCollection.findOne({ _id: new ObjectId(matchDoc.series) });
    if (!seriesDoc) {
      return res.status(404).json({ error: "Series not found" });
    }

    // Build the update object for the match
    const updateData = {
      results: results,
      winner: new ObjectId(winner),
      loser: new ObjectId(loser),
      series: new ObjectId(seriesDoc._id),
      status: "Ended"
    };

    // Update the match in the database
    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    createLog({ ...req.body, type: "Match Ended", matchId: result.insertedId })

    message = "Match" + message
    
    // Update the series document
    const bestOf = seriesDoc.bestOf; // Int32 value representing the number of wins required

    // Get all the matches in the series
    const seriesMatches = await matchesCollection.find({
      _id: { $in: seriesDoc.matches } // Assuming `matches` is an array of match Object IDs in the series
    }).toArray();

    // Count the number of wins for each team in the series
    let winnerWinsCount = 0;
    seriesMatches.forEach((match) => {
      if (match.status === "Ended" && match.winner.equals(new ObjectId(winner))) {
        winnerWinsCount++;
      }
    });

    // If the winner has won enough matches to win the series, update the series status and declare winner/loser
    if (winnerWinsCount >= bestOf) {
      message = "Series," + message
      await seriesCollection.updateOne(
        { _id: new ObjectId(seriesDoc._id) },
        {
          $set: {
            status: "Ended",
            winner: new ObjectId(winner),
            loser: new ObjectId(loser),
          }
        }
      );
      createLog({ ...req.body, type: "Series Ended", seriesId: seriesDoc._id })
    }

    // Set status for Tournament if included in request body
    if (endTournament === true) {
      await tournamentsCollection.updateOne(
        { _id: new ObjectId(seriesDoc.tournament) },
        {
          $set: {
            status: "Ended",
            winner: new ObjectId(winner),
            loser: new ObjectId(loser),
          }
        }
      );
      createLog({ ...req.body, type: "Tournament Ended", tournamentId: seriesDoc.tournament })
      message = "Tournament," + message
    }
    
    // Set status for Season if included in request body
    if (endSeason === true) {
      // Find the season that contains the tournament in its tournaments array
      const seasonDoc = await seasonsCollection.findOne({
        tournaments: { $in: [new ObjectId(seriesDoc.tournament)] }
      });

      if (seasonDoc) {
        // Update the status of the season to "Ended"
        await seasonsCollection.updateOne(
          { _id: seasonDoc._id },
          { $set: { status: "Ended", winner: winner, loser: loser } }
        );
      }
      createLog({ ...req.body, type: "Season Ended", SeasonId: seasonDoc._id })
      message = "Season," + message
    }

    res.status(200).json({ message: message, winnerWinsCount: winnerWinsCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to update match or series", details: err.message });
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

const PORT = process.env.DEV_SERVER_URL_PORT;

// Start Express and Socket.io websocket server
// Ensure the database is connected before starting the server
connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});