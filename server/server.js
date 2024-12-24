// server.js
const express = require("express");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const firebaseAdmin = require("firebase-admin");
const firebaseServiceAccountKey = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
const unitedStatesLegalStates = require(process.env.UNITED_STATES_LEGAL_STATES_PATH);
const { Configuration, PlaidEnvironments, PlaidApi } = require("plaid");

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
// ********************************************FIREBASE********************************************
// ************************************************************************************************
// ************************************************************************************************

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseServiceAccountKey)
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded token to the request
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// ************************************************************************************************
// ************************************************************************************************
// **********************************************PLAID*********************************************
// ************************************************************************************************
// ************************************************************************************************

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

// Generate a Plaid Link token for IDV
app.post("/api/plaid/idv/link-token", verifyFirebaseToken, async (req, res) => {
  try {
    const { mongoUserId } = req.body;

    if (!mongoUserId) {
      return res.status(400).json({ error: "Missing MongoDB User ID" });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(mongoUserId) });

    if (!user) {
      return res.status(404).json({ error: "User not found in MongoDB" });
    }

    const tokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: mongoUserId,
        email_address: user.email,
      },
      products: ["identity_verification"],
      identity_verification: { template_id: process.env.PLAID_TEMPLATE_ID },
      client_name: "Your App Name",
      language: "en",
      country_codes: ["US"],
    });

    res.json(tokenResponse.data);
  } catch (error) {
    console.error("Error creating Plaid Link token:", error.message);
    res.status(500).json({ error: "Failed to create Link token" });
  }
});

// Update user verification status after IDV
app.post("/api/plaid/idv/complete", verifyFirebaseToken, async (req, res) => {
  try {
    const { idvSession } = req.body;

    if (!idvSession) {
      return res.status(400).json({ error: "Missing IDV session ID" });
    }

    const idvResult = await plaidClient.identityVerificationGet({
      identity_verification_id: idvSession,
    });

    const { status, user } = idvResult.data;

    console.log("IDV Result:", idvResult.data);

    let responseBody = {
      status: status,
      idvSession: idvSession,
    };
    
    if (user?.date_of_birth) {
      responseBody.DOB = user.date_of_birth;
    }

    res.json(responseBody);
  } catch (error) {
    console.error("Error completing IDV:", error.message);
    res.status(500).json({ error: "Failed to update IDV status" });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************USERS**********************************************
// ************************************************************************************************
// ************************************************************************************************

// Create a new user (POST)
app.post("/api/users", verifyFirebaseToken, async (req, res) => {
  try {

    // Check if a user with the provided email exists and has been deleted
    const existingUser = await usersCollection.findOne({
      email: req.body.email, accountStatus: "deleted",
    });

    if (existingUser) {
      // Reactivate the deleted user
      const updateResult = await usersCollection.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            ...req.body,
            accountStatus: "active",
          },
        }
      );

      if (updateResult.acknowledged) {
        const updatedUser = await usersCollection.findOne({
          _id: existingUser._id,
        });
        return res.status(200).json(updatedUser);
      } else {
        return res.status(500).json({ error: "Failed to reactivate user" });
      }
    }

    // If no matching deleted user is found, create a new user
    const result = await usersCollection.insertOne(req.body);

    if (result.acknowledged && result.insertedId) {
      const newUser = await usersCollection.findOne({ _id: result.insertedId });
      res.status(201).json(newUser);
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create user", details: err.message });
  }
});

// Get all users (GET)
app.get("/api/users", verifyFirebaseToken, async (req, res) => {
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
app.get("/api/users/:id", verifyFirebaseToken, async (req, res) => {
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
app.put("/api/users/:id", verifyFirebaseToken, async (req, res) => {
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

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
});

// Update a user by ID (PUT) to act as a soft delete
app.put("/api/users/soft_delete/:id", async (req, res) => {
  try {
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
          name: null,
          firebaseUserId: null,
          credits: 0.0,
          earnedCredits: 0.0,
          idvStatus: "unverified",
          emailVerificationStatus: "unverified",
          accountStatus: "deleted",
        }
      }
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

    res.status(200).json()
  } catch (err) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
});

// Delete a user by ID (DELETE)
app.delete("/api/users/:id", verifyFirebaseToken, async (req, res) => {
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
app.get("/api/users/firebase/:firebaseUserId", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne({
      firebaseUserId: req.params.firebaseUserId,
    });
    if (!user) {
      return res.status(200).json({ error: "User not found" });
    }
    const response = {
      ...user,
      _id: user._id.toString(),
    } 
    res.status(200).json(response);
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
app.get('/api/logs', verifyFirebaseToken, async (req, res) => {
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

// Delete all logs (DELETE)
app.delete('/api/logs', async (req, res) => {
  try {
    const result = await logsCollection.deleteMany({});
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No logs found to delete' });
    }
    res.status(200).json({
      message: 'All logs deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to delete all logs',
      details: err.message,
    });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// *********************************************STRIPE*********************************************
// ************************************************************************************************
// ************************************************************************************************

app.post("/api/create-checkout-session", verifyFirebaseToken, async (req, res) => {
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
// *******************************************GEOFENCING*******************************************
// ************************************************************************************************
// ************************************************************************************************

// TODO: Support other countries

// Get the user's location (state) from the provided latitude and longitude
// TODO: Create stack which will prevent this from calling Nominatim API more than once per second
app.post("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude (lat) and longitude (lon) are required." });
  }

  try {
    // Call the Nominatim API
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Nominatim API failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the state from the response
    const state = data?.address?.state;

    if (!state) {
      return res.status(404).json({
        error: "Unable to retrieve state information from the Nominatim response.",
      });
    }

    // Check if the state is in the allowed list
    const isAllowed = unitedStatesLegalStates?.[state]?.legal;
    
    res.status(200).json({
      state,
      allowed: isAllowed,
      message: isAllowed
        ? "State is allowed."
        : "State is not allowed.",
      full_address: data.display_name,
    });
  } catch (error) {
    console.error("Error fetching from Nominatim API:", error.message);
    res.status(500).json({
      error: "Failed to retrieve address data.",
      details: error.message,
    });
  }
});

// ************************************************************************************************
// ************************************************************************************************
// ****************************************Age Restriction*****************************************
// ************************************************************************************************
// ************************************************************************************************

// Helper function to check if a user is old enough based on their DOB and state minAge
const isOldEnough = (dob, minAge) => {
  if (!dob || !minAge) return false;

  const birthDate = new Date(dob);
  if (isNaN(birthDate)) return false; // Invalid date check

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  // Adjust age if the birthday hasn't occurred yet this year
  const isBirthdayPassed = 
    today.getMonth() > birthDate.getMonth() || 
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  const actualAge = isBirthdayPassed ? age : age - 1;

  return actualAge >= minAge;
};

// API endpoint to check if a user is legally old enough to make wagers
app.post('/api/check-legal-age', (req, res) => {
  try {
    const { state, DOB } = req.body;

    if (!state || !DOB) {
      return res.status(400).json({ error: "State and DOB are required" });
    }

    const stateInfo = unitedStatesLegalStates?.[state];

    if (!stateInfo) {
      return res.status(400).json({ error: "Invalid state" });
    }

    const isAllowed = isOldEnough(DOB, stateInfo.minAge);

    if (!isAllowed) {
      return res.json({ isAllowed: false, message: `Due to state law, you must be at least ${stateInfo.minAge} years old in ${state}` });
    }

    res.json({ isAllowed: true, message: "User is allowed to make wagers" });
  } catch (error) {
    console.error("Error checking legal age:", error.message);
    res.status(500).json({ error: "Failed to check legal age" });
  }
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
// **********************************************JIRA**********************************************
// ************************************************************************************************
// ************************************************************************************************

const jiraStatusTransitionIds = {
  "Requests For Email Change": 9,
  "Beta Tester Feedback - Problem Reports": 4,
  "Beta Tester Feedback - Enhancement Requests": 3,
  "BETA TESTER FEEDBACK - GENERAL": 14,
  "IDV Failed": 15,
}

// Helper function to create basic auth header
const getAuthorizationHeader = () => {
  const credentials = `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN_PART_1}=${process.env.JIRA_API_TOKEN_PART_2}`;
  return `Basic ${btoa(credentials)}`; // Use Buffer for base64 encoding in Node.js
};

// Transition Jira issue status
const transitionJiraIssueStatus = async (jiraIssueKey, transitionId) => {
  try {
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${jiraIssueKey}/transitions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transition: {
          id: transitionId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to transition Jira issue status: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Error transitioning Jira issue status:", error.message);
    throw error;
  }
};

// Create Jira issue
const createJiraIssue = async (summary, description = "", issueType) => {
  try {
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthorizationHeader(),
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: process.env.JIRA_PROJECT_KEY,
          },
          summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: description
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueType,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to create issue: ${errorData.errorMessages.join(", ")}`
      );
    }

    return await response.json(); // The created issue object
  } catch (error) {
    console.error("Error adding issue to Jira:", error.message);
    throw error;
  }
};

// Create Jira issue for email update
app.post("/api/jira/create-issue", verifyFirebaseToken, async (req, res) => {
  const { userName, userEmail, mongoUserId, issueType, summary, description, status } = req.body;
  if (!userName || !userEmail) {
    return res.status(400).json({ error: "User name and email are required." });
  }

  try {
    const descriptionHeader = `User: ${userName}\nEmail: ${userEmail}\nMongoId: ${mongoUserId}`;
    const jiraDescription = description ? `${descriptionHeader}\n\nUser Submission:\n${description}` : descriptionHeader;
    const jiraIssue = await createJiraIssue(
      summary,
      jiraDescription,
      issueType,
    );

    await transitionJiraIssueStatus(
      jiraIssue.key,
      jiraStatusTransitionIds[status]
    );

    res.status(200).json({
      message: "Jira issue created and status transitioned successfully.",
      issueKey: jiraIssue.key,
    });
  } catch (error) {
    console.error("Error processing Jira issue:", error.message);
    res.status(500).json({ error: "Failed to create Jira issue." });
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
      console.log("User Paid Out:", String(user._id), " Earned Credits: ", awardedCredits)
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

    handleWagerEnded(req.params.id, agreeIsWinner)

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

    const updateData = req.body;

    // Convert `winner` and `loser` to ObjectId if they exist in the request body
    if (updateData.winner) {
      updateData.winner = new ObjectId(updateData.winner);
    }
    if (updateData.loser) {
      updateData.loser = new ObjectId(updateData.loser);
    }

    const result = await seasonsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Season not found" });
    }
    
    // Update the status of all wagers for the event if the status changes
    if (updateData?.status) {
      await wagersCollection.updateMany(
        { rlEventReference: req.params.id },
        { $set: { status: updateData.status } }
      );
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

    const updateData = req.body;

    // Convert `winner`, `loser`, and `season` to ObjectId if they exist in the request body
    if (updateData.winner) {
      updateData.winner = new ObjectId(updateData.winner);
    }
    if (updateData.loser) {
      updateData.loser = new ObjectId(updateData.loser);
    }
    if (updateData.season) {
      updateData.season = new ObjectId(updateData.season);
    }

    const result = await tournamentsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    
    // Update the status of all wagers for the event if the status changes
    if (updateData?.status) {
      await wagersCollection.updateMany(
        { rlEventReference: req.params.id },
        { $set: { status: updateData.status } }
      );
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
    const { tournament, team1, team2, best_of, name } = req.body;

    if (!tournament || !team1 || !team2 || !best_of || !name) {
      return res.status(400).json({
        error: "Tournament ID, Team 1, Team 2, Best Of value, and Name are required to create a Series.",
      });
    }

    // Create the series object
    const seriesData = {
      name,
      tournament: new ObjectId(tournament),
      teams: [new ObjectId(team1), new ObjectId(team2)],
      best_of: parseInt(best_of, 10),
      type: "series",
      status: "Created",
    };

    // Insert the new series document
    const result = await seriesCollection.insertOne(seriesData);

    // Generate matches based on the best_of value
    const matches = Array.from({ length: best_of }, (_, index) => ({
      name: `${name} - Match ${index + 1}`,
      teams: [new ObjectId(team1), new ObjectId(team2)],
      series: result.insertedId,
      status: "Created",
      type: "match",
    }));

    // Insert matches into the matches collection
    const matchInsertResult = await matchesCollection.insertMany(matches);

    // Update the series document to include the generated matches
    await seriesCollection.updateOne(
      { _id: result.insertedId },
      { $set: { matches: Object.values(matchInsertResult.insertedIds) } }
    );

    // Update the tournament document to include this series
    await tournamentsCollection.updateOne(
      { _id: new ObjectId(tournament) },
      { $push: { series: result.insertedId } }
    );

    res.status(201).json({
      message: "Series created successfully",
      seriesId: result.insertedId,
      matchIds: Object.values(matchInsertResult.insertedIds),
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create series",
      details: err.message,
    });
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

    // Convert `winner`, `loser`, `firstBlood`, and `tournament` to ObjectId if they exist in the request body
    if (updateData.winner) {
      updateData.winner = new ObjectId(updateData.winner);
    }
    if (updateData.loser) {
      updateData.loser = new ObjectId(updateData.loser);
    }
    if (updateData.firstBlood) {
      updateData.firstBlood = new ObjectId(updateData.firstBlood);
    }
    if (updateData.tournament) {
      updateData.tournament = new ObjectId(updateData.tournament);
    }

    const result = await seriesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Series not found" });
    }

    // Update the status of all wagers for the event if the status changes
    if (updateData?.status) {
      await wagersCollection.updateMany(
        { rlEventReference: req.params.id },
        { $set: { status: updateData.status } }
      );
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

    // Convert `winner`, `loser`, `firstBlood`, and `series` to ObjectId if they exist in the request body
    if (updateData.winner) {
      updateData.winner = new ObjectId(updateData.winner);
    }
    if (updateData.loser) {
      updateData.loser = new ObjectId(updateData.loser);
    }
    if (updateData.firstBlood) {
      updateData.firstBlood = new ObjectId(updateData.firstBlood);
    }
    if (updateData.series) {
      updateData.series = new ObjectId(updateData.series);
    }

    const result = await matchesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    // Update the status of all wagers for the event if the status changes
    if (updateData?.status) {
      await wagersCollection.updateMany(
        { rlEventReference: req.params.id },
        { $set: { status: updateData.status } }
      );
    }

    res.status(200).json({ message: "Match updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update match", details: err.message });
  }
});

// Function to return end of match meta like winner, loser, MVP, etc. based on match results
const getMatchOutcomes = async (matchResults, teams, agreeEvaluationObject=null) => {
  try {

    // Step 1: Retrieve the teams from the teamsCollection
    const teamsArray = await teamsCollection.find({ _id: { $in: teams } }).toArray();

    // Step 2: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap(team => team.players);

    // Step 3: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection.find({ _id: { $in: playerIds } }).toArray();

    // Initialize team goals
    let teamGoals = {
      [teams[0].toString()]: 0,
      [teams[1].toString()]: 0,
    };

    // Step 1: Retrieve players and their team associations
    const playerNames = Object.keys(matchResults);
    const players = await playersCollection.find({ name: { $in: playerNames } }).toArray();

    // Step 2: Map player goals to their respective teams
    players.forEach((player) => {
      const playerResult = matchResults[player.name];
      if (playerResult) {
        const teamId = player.team.toString();
        if (teamGoals[teamId] !== undefined) {
          teamGoals[teamId] += playerResult.goals; // Sum goals per team
        }
      }
    });

    // Step 3: Determine the winning team
    const [team1, team2] = teams.map((team) => team.toString());
    let winningTeam = null;
    let losingTeam = null;
    if (teamGoals[team1] > teamGoals[team2]) {
      winningTeam = team1;
      losingTeam = team2;
    } else if (teamGoals[team2] > teamGoals[team1]) {
      winningTeam = team2;
      losingTeam = team1;
    }

    // Step 4: Find the MVP (highest score on the winning team)
    let mvp = null;
    let highestScore = 0;

    players.forEach((player) => {
      const playerResult = matchResults[player.name];
      // console.log(player)
      if (player.team.toString() === winningTeam && playerResult.score > highestScore) {
        highestScore = playerResult.score;
        // console.log(player)
        mvp = player._id; // Assign player as MVP
      }
    });

    // Step 5: Get a team goals string to use as the agree evaluation
    const teamGoalsString = Object.entries(teamGoals)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' - ');

    const response = { 
      winningTeam, 
      losingTeam, 
      teamGoals: teamGoalsString, 
      mvp 
    };
    
    // Step 6: Optionally determine the agree evaluation of a player/team attributes wager
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (teamsArray.some(team => team._id.toString() === selectedTeamOrPlayerForBet)) {
        // Find the team for the bet
        teamOrPlayerForBet = teamsArray.find(team => team._id.toString() === selectedTeamOrPlayerForBet);

        // Calculate the total for the selected attribute from players on this team
        actualValue = 0;
        const teamPlayers = playersArray.filter(player =>
          teamOrPlayerForBet.players.map(id => id.toString()).includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = matchResults[player.name];
          if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (playersArray.some(player => player._id.toString() === selectedTeamOrPlayerForBet)) {
        // Find the player for the bet
        teamOrPlayerForBet = playersArray.find(player => player._id.toString() === selectedTeamOrPlayerForBet);

        // Get the value of the selected attribute for the player
        const playerResult = matchResults[teamOrPlayerForBet.name];
        if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        // Throw an error if neither a team nor a player was found for the bet
        throw new Error('Team or player not found');
      }

      // Evaluate the condition if actualValue is valid
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case 'exactly':
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case 'more than':
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case 'less than':
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error('Invalid bet operator');
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining match winner:", error);
    throw new Error("Failed to determine match winner");
  }
};

const handleWagerEnded = async (wagerId, agreeIsWinner) => {

 const wager = await wagersCollection.findOne({ _id: new ObjectId(wagerId) });

//  console.log("wager: ", wager)

 const updatedWager = {
   status: "Ended",
   agreeIsWinner: agreeIsWinner,
 };

 await wagersCollection.updateOne(
   { _id: new ObjectId(wager._id) },
   { $set: updatedWager }
 );

 createLog({ type: "Wager Ended", WagerId: wagerId })

 // Fetch updated wager and statistics
 const updatedWagers = await getAllWagers();
 io.emit("wagersUpdate", updatedWagers);  // Emit updated data to all clients

 await payOutBetWinners(wagerId, agreeIsWinner)
}

const calculatePlayerTotals = (matches) => {
  // Object to keep track of each player's aggregated stats across all matches
  const playerTotals = {};

  // Iterate through each match in the series
  matches.forEach(match => {
    const { results } = match;

    // Iterate through each player in the match results
    Object.entries(results).forEach(([playerName, playerStats]) => {
      // Initialize the player's total if not already present
      if (!playerTotals[playerName]) {
        playerTotals[playerName] = {
          score: 0,
          goals: 0,
          assists: 0,
          shots: 0,
          saves: 0,
          demos: 0,
        };
      }

      // Add the stats of the current match to the player's total
      Object.keys(playerStats).forEach(stat => {
        playerTotals[playerName][stat] += playerStats[stat];
      });
    });
  });

  // Return the total aggregated results for each player
  return playerTotals;
};

const getSeriesOutcomes = async (seriesId, agreeEvaluationWagerType=null, agreeEvaluationObject=null) => {
  try {

    const response = { 
      winningTeam: null,
      losingTeam: null,
      seriesScore: null,
      firstBlood: null,
      overtimeCount: null,
      agreeEvaluation: null,
    };

    const seriesDoc = await seriesCollection.findOne({ _id: new ObjectId(seriesId) })

    const seriesMatches = await matchesCollection.find({ _id: { $in: seriesDoc.matches } }).toArray();

    let teamWins = {};
    let overtimeCount = 0; // Counter for matches that went to overtime

    // Iterate through each match in the series
    seriesMatches.forEach(match => {
      const { winner, teams, wentToOvertime } = match;

      // Check if the match went to overtime and increment the counter if true
      if (wentToOvertime) {
        overtimeCount++;
      }

      // Initialize teams in the teamWins object if not already present
      teams.forEach(team => {
        if (!teamWins[team]) {
          teamWins[team] = 0;
        }
      });

      // Increment the win count for the winning team
      if (winner) {
        teamWins[winner]++;
      }
    });

    // Create the seriesScore string
    const seriesScore = Object.entries(teamWins).map(([team, wins]) => `${team}: ${wins}`).join(' - ');

    response.winningTeam = seriesDoc.winner
    response.losingTeam = seriesDoc.loser
    response.firstBlood = seriesDoc.firstBlood
    response.seriesScore = seriesScore;
    response.overtimeCount = overtimeCount;

    const seriesMatchesResults = calculatePlayerTotals(seriesMatches);

    // console.log("seriesMatchesResults: ", seriesMatchesResults)

    // Step 1: Retrieve the teams from the teamsCollection
    const teamsArray = await teamsCollection.find({ _id: { $in: seriesDoc.teams } }).toArray();

    // Step 2: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap(team => team.players);

    // Step 3: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection.find({ _id: { $in: playerIds } }).toArray();

    // Initialize team goals
    let teamGoals = {
      [seriesDoc.teams[0].toString()]: 0,
      [seriesDoc.teams[1].toString()]: 0,
    };

    // Step 1: Retrieve players and their team associations
    const playerNames = Object.keys(seriesMatchesResults);
    const players = await playersCollection.find({ name: { $in: playerNames } }).toArray();

    // Step 2: Map player goals to their respective teams
    players.forEach((player) => {
      const playerResult = seriesMatchesResults[player.name];
      if (playerResult) {
        const teamId = player.team.toString();
        if (teamGoals[teamId] !== undefined) {
          teamGoals[teamId] += playerResult.goals; // Sum goals per team
        }
      }
    });
    
    // Step 6: Optionally determine the agree evaluation of a player/team attributes wager
    if (agreeEvaluationWagerType === "Player/Team Attributes" && agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (teamsArray.some(team => team._id.toString() === selectedTeamOrPlayerForBet)) {
        // Find the team for the bet
        teamOrPlayerForBet = teamsArray.find(team => team._id.toString() === selectedTeamOrPlayerForBet);

        // Calculate the total for the selected attribute from players on this team
        actualValue = 0;
        const teamPlayers = playersArray.filter(player =>
          teamOrPlayerForBet.players.map(id => id.toString()).includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = seriesMatchesResults[player.name];
          if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (playersArray.some(player => player._id.toString() === selectedTeamOrPlayerForBet)) {
        // Find the player for the bet
        teamOrPlayerForBet = playersArray.find(player => player._id.toString() === selectedTeamOrPlayerForBet);

        // Get the value of the selected attribute for the player
        const playerResult = seriesMatchesResults[teamOrPlayerForBet.name];
        if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        // Throw an error if neither a team nor a player was found for the bet
        throw new Error('Team or player not found');
      }

      // Evaluate the condition if actualValue is valid
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case 'exactly':
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case 'more than':
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case 'less than':
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error('Invalid bet operator');
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    } else if (agreeEvaluationWagerType === "Overtime Count" && agreeEvaluationObject) {
      const {
        selectedBetOperator,
        seriesOvertimeBetInput,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(seriesOvertimeBetInput, 10);

      // Evaluate the condition if actualValue is valid
      if (attributeBetValue !== null) {
        switch (selectedBetOperator) {
          case 'exactly':
            agreeEvaluation = overtimeCount === attributeBetValue;
            break;
          case 'more than':
            agreeEvaluation = overtimeCount > attributeBetValue;
            break;
          case 'less than':
            agreeEvaluation = overtimeCount < attributeBetValue;
            break;
          default:
            throw new Error('Invalid bet operator');
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    }


    return response;
  } catch (error) {
    console.error("Error determining match winner:", error);
    throw new Error("Failed to determine match winner");
  }
};

const handleMatchWagers = async (matchId, matchOutcomes, firstBlood, matchResults, teams) => {
  
  // Get all wagers associated to this match
  const matchWagers = await wagersCollection.find({ rlEventReference: matchId, status: "Ongoing" }).toArray();

  // console.log("matchWagers: ", matchWagers)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

    for (const wager of matchWagers) {
      if (wager.wagerType === "Match Winner") {
        // wager.agreeEvaluation is an Object id of the winning team
        await handleWagerEnded(wager._id, wager.agreeEvaluation === matchOutcomes.winningTeam.toString())
      } else if (wager.wagerType === "Match Score") {
        // wager.agreeEvaluation is a string formatted as "Object id of Team1: Score - Object id of Team2 Score"
        await handleWagerEnded(wager._id, wager.agreeEvaluation === matchOutcomes.teamGoals)
      } else if (wager.wagerType === "First Blood") {
        // wager.agreeEvaluation is an Object id of the fist blood team
        await handleWagerEnded(wager._id, wager.agreeEvaluation === firstBlood)
      } else if (wager.wagerType === "Match MVP") {
        // NOTE: Assign object if of the players n the match results
        // wager.agreeEvaluation is an Object id of the mvp player
        await handleWagerEnded(wager._id, wager.agreeEvaluation === matchOutcomes.mvp.toString())
      } else if (wager.wagerType === "Player/Team Attributes") {
        // NOTE: Make wager evaluation a trimmed version of wager.name
        // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
        const matchOutcomesEval = await getMatchOutcomes(matchResults, teams, wager.agreeEvaluation)
        console.log("matchOutcomesEval: ", matchOutcomesEval)
        await handleWagerEnded(wager._id, matchOutcomesEval.agreeEvaluation);
      }
    }
}

const handleSeriesWagers = async (seriesId) => {

  // console.log("seriesId: ", seriesId)
  
  // Get all wagers associated to this match
  const seriesWagers = await wagersCollection.find({ rlEventReference: seriesId.toString(), status: "Ongoing" }).toArray();

  // console.log("seriesWagers: ", seriesWagers)

  const seriesOutcomes = await getSeriesOutcomes(seriesId)

  // console.log("seriesOutcomes: ", seriesOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

    for (const wager of seriesWagers) {
      if (wager.wagerType === "Series Winner") {
        // wager.agreeEvaluation is an Object id of the winning team
        await handleWagerEnded(wager._id, wager.agreeEvaluation === seriesOutcomes.winningTeam.toString())
      } else if (wager.wagerType === "Series Score") {
        // wager.agreeEvaluation is a string formatted as "Object id of Team1: Score - Object id of Team2 Score"
        await handleWagerEnded(wager._id, wager.agreeEvaluation === seriesOutcomes.seriesScore)
      } else if (wager.wagerType === "First Blood") {
        // wager.agreeEvaluation is an Object id of the fist blood team
        await handleWagerEnded(wager._id, wager.agreeEvaluation === seriesOutcomes.firstBlood)
      } else if (wager.wagerType === "Overtime Count") {
        // NOTE: Assign object if of the players n the match results
        // wager.agreeEvaluation is an Object id of the mvp player
        const seriesOutcomesEval = await getSeriesOutcomes(seriesId, wager.wagerType, wager.agreeEvaluation)
        // console.log("seriesOutcomesEval: ", seriesOutcomesEval)
        await handleWagerEnded(wager._id, seriesOutcomesEval.agreeEvaluation);
      } else if (wager.wagerType === "Player/Team Attributes") {
        // NOTE: Make wager evaluation a trimmed version of wager.name
        // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
        const seriesOutcomesEval = await getSeriesOutcomes(seriesId, wager.wagerType, wager.agreeEvaluation)
        // console.log("seriesOutcomesEval: ", seriesOutcomesEval)
        await handleWagerEnded(wager._id, seriesOutcomesEval.agreeEvaluation);
      }
    }
}

const getTournamentOutcomes = async (tournamentId, agreeEvaluationObject = null) => {
  try {
    const response = {
      winningTeam: null,
      losingTeam: null,
      agreeEvaluation: null,
    };

    // Step 1: Retrieve the tournament document
    const tournamentDoc = await tournamentsCollection.findOne({ _id: new ObjectId(tournamentId) });
    if (!tournamentDoc) {
      throw new Error('Tournament not found');
    }

    response.winningTeam = tournamentDoc.winner;
    response.losingTeam = tournamentDoc.loser;

    // Step 2: Get all series within the tournament
    const seriesArray = await seriesCollection.find({ _id: { $in: tournamentDoc.series } }).toArray();
    const seriesIds = seriesArray.map(series => series._id);

    // Step 3: Get all matches for these series
    const matchesArray = await matchesCollection.find({ series: { $in: seriesIds } }).toArray();

    // Step 4: Collect all unique team IDs from the series documents
    const teamIds = new Set();
    seriesArray.forEach(series => {
      series.teams.forEach(teamId => teamIds.add(teamId.toString()));
    });

    // Convert Set to an array of ObjectId
    const teamIdsArray = Array.from(teamIds).map(id => new ObjectId(id));

    // Step 5: Get all teams using the collected team IDs
    const teamsArray = await teamsCollection.find({ _id: { $in: teamIdsArray } }).toArray();

    // Step 6: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap(team => team.players);

    // Step 7: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection.find({ _id: { $in: playerIds } }).toArray();

    // Step 8: Calculate player totals for the tournament
    const tournamentMatchesResults = calculatePlayerTotals(matchesArray);

    // Step 9: Optionally determine the agree evaluation
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (teamsArray.some(team => team._id.toString() === selectedTeamOrPlayerForBet)) {
        // Team attribute bet
        teamOrPlayerForBet = teamsArray.find(team => team._id.toString() === selectedTeamOrPlayerForBet);
        actualValue = 0;
        const teamPlayers = playersArray.filter(player =>
          teamOrPlayerForBet.players.map(id => id.toString()).includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = tournamentMatchesResults[player.name];
          if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
        
      }
      // Check if the selected ID corresponds to a player
      else if (playersArray.some(player => player._id.toString() === selectedTeamOrPlayerForBet)) {
        // Player attribute bet
        teamOrPlayerForBet = playersArray.find(player => player._id.toString() === selectedTeamOrPlayerForBet);
        const playerResult = tournamentMatchesResults[teamOrPlayerForBet.name];
        if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        throw new Error('Team or player not found');
      }


      // Evaluate the bet
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case 'exactly':
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case 'more than':
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case 'less than':
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error('Invalid bet operator');
        }
      }

      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining tournament outcomes:", error);
    throw new Error("Failed to determine tournament outcomes");
  }
};

const handleTournamentWagers = async (tournamentId) => {

  // console.log("tournamentId: ", tournamentId)
  
  // Get all wagers associated to this match
  const tournamentWagers = await wagersCollection.find({ rlEventReference: tournamentId.toString(), status: "Ongoing" }).toArray();

  // console.log("tournamentWagers: ", tournamentWagers)

  const tournamentOutcomes = await getTournamentOutcomes(tournamentId)

  // console.log("tournamentOutcomes: ", tournamentOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of tournamentWagers) {
    if (wager.wagerType === "Tournament Winner") {
      // wager.agreeEvaluation is an Object id of the winning team
      await handleWagerEnded(wager._id, wager.agreeEvaluation === tournamentOutcomes.winningTeam.toString())
    } else if (wager.wagerType === "Player/Team Attributes") {
      // NOTE: Make wager evaluation a trimmed version of wager.name
      // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
      const tournamentOutcomesEval = await getTournamentOutcomes(tournamentId, wager.agreeEvaluation)
      // console.log("tournamentOutcomesEval: ", tournamentOutcomesEval)
      await handleWagerEnded(wager._id, tournamentOutcomesEval.agreeEvaluation);
    }
  }
}

const getSeasonOutcomes = async (seasonId, agreeEvaluationObject = null) => {
  try {
    const response = {
      winningTeam: null,
      agreeEvaluation: null,
    };

    // Step 1: Retrieve the season document
    const seasonDoc = await seasonsCollection.findOne({ _id: new ObjectId(seasonId) });
    if (!seasonDoc) {
      throw new Error('Season not found');
    }

    response.winningTeam = seasonDoc.winner;

    // Step 2: Get all tournaments within the season
    const tournamentsArray = await tournamentsCollection.find({ _id: { $in: seasonDoc.tournaments } }).toArray();
    const tournamentIds = tournamentsArray.map(tournament => tournament._id);

    // Step 3: Get all series within the tournaments
    const seriesArray = await seriesCollection.find({ tournament: { $in: tournamentIds } }).toArray();
    const seriesIds = seriesArray.map(series => series._id);

    // Step 4: Get all matches for these series
    const matchesArray = await matchesCollection.find({ series: { $in: seriesIds } }).toArray();

    // Step 5: Collect all unique team IDs from the series documents
    const teamIds = new Set();
    seriesArray.forEach(series => {
      series.teams.forEach(teamId => teamIds.add(teamId.toString()));
    });

    // Convert Set to an array of ObjectId
    const teamIdsArray = Array.from(teamIds).map(id => new ObjectId(id));

    // Step 6: Get all teams using the collected team IDs
    const teamsArray = await teamsCollection.find({ _id: { $in: teamIdsArray } }).toArray();

    // Step 7: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap(team => team.players);

    // Step 8: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection.find({ _id: { $in: playerIds } }).toArray();

    // Step 9: Calculate player totals for the season
    const seasonMatchesResults = calculatePlayerTotals(matchesArray);

    // Step 10: Optionally determine the agree evaluation
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (teamsArray.some(team => team._id.toString() === selectedTeamOrPlayerForBet)) {
        // Team attribute bet
        teamOrPlayerForBet = teamsArray.find(team => team._id.toString() === selectedTeamOrPlayerForBet);
        actualValue = 0;
        const teamPlayers = playersArray.filter(player =>
          teamOrPlayerForBet.players.map(id => id.toString()).includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = seasonMatchesResults[player.name];
          if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (playersArray.some(player => player._id.toString() === selectedTeamOrPlayerForBet)) {
        // Player attribute bet
        teamOrPlayerForBet = playersArray.find(player => player._id.toString() === selectedTeamOrPlayerForBet);
        const playerResult = seasonMatchesResults[teamOrPlayerForBet.name];
        if (playerResult && selectedAttributeBetType.toLowerCase() in playerResult) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        throw new Error('Team or player not found');
      }

      // Evaluate the bet
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case 'exactly':
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case 'more than':
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case 'less than':
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error('Invalid bet operator');
        }
      }

      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining season outcomes:", error);
    throw new Error("Failed to determine season outcomes");
  }
};

const handleSeasonWagers = async (seasonId) => {
  // Get all wagers associated with this season
  const seasonWagers = await wagersCollection.find({ rlEventReference: seasonId.toString(), status: "Ongoing" }).toArray();

  // console.log("seasonWagers: ", seasonWagers)

  const seasonOutcomes = await getSeasonOutcomes(seasonId);

  // console.log("seasonOutcomes: ", seasonOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of seasonWagers) {
    if (wager.wagerType === "Season Winner") {
      await handleWagerEnded(wager._id, wager.agreeEvaluation === seasonOutcomes.winningTeam.toString());
    } else if (wager.wagerType === "Player/Team Attributes") {
      const seasonOutcomesEval = await getSeasonOutcomes(seasonId, wager.agreeEvaluation);
      await handleWagerEnded(wager._id, seasonOutcomesEval.agreeEvaluation);
    }
  }
};

// Update a match by ID (PUT)
app.put("/api/match_concluded/:id", async (req, res) => {
  try {
    const { results, firstBlood, wentToOvertime, endTournament, endSeason } = req.body;

    let message = " updated successfully"
    
    // Ensure all required fields are present in the request body
    if (!results || !firstBlood) {
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

    const matchOutcomes = await getMatchOutcomes(results, matchDoc.teams);

    // console.log("matchOutcomes: ", matchOutcomes)

    // Build the update object for the match
    const updateData = {
      results: results,
      winner: new ObjectId(matchOutcomes.winningTeam),
      loser: new ObjectId(matchOutcomes.winningTeam),
      firstBlood: firstBlood,
      wentToOvertime: wentToOvertime,
      series: new ObjectId(seriesDoc._id),
      status: "Ended"
    };

    // Update the match in the database
    const updatedMatch = await matchesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (updatedMatch.matchedCount === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    createLog({ type: "Match Ended", matchId: updatedMatch.insertedId, matchOutcomes: matchOutcomes })

    message = "Match" + message


    await handleMatchWagers(req.params.id, matchOutcomes, firstBlood, results, matchDoc.teams)

    
    // Update the series document if series has ended with this match


    // Set first blood if it is not set because this would be the first match
    if (seriesDoc.firstBlood === null) {
      await seriesCollection.updateOne(
        { _id: new ObjectId(seriesDoc._id) },
        {
          $set: {
            firstBlood: firstBlood
          }
        }
      );
    }

    // Get all the matches in the series
    const seriesMatches = await matchesCollection.find({
      _id: { $in: seriesDoc.matches } // Assuming `matches` is an array of match Object IDs in the series
    }).toArray();

    // Count the number of wins for each team in the series
    let winnerWinsCount = 0;
    let overtimeCount = 0;
    seriesMatches.forEach((match) => {
      if (match.status === "Ended" && match.winner.equals(new ObjectId(matchOutcomes.winningTeam))) {
        winnerWinsCount++;
      }
      if (match.status === "Ended" && match.wentToOvertime === true) {
        overtimeCount++;
      }
    });

    // If the winner has won enough matches to win the series, update the series status and declare winner/loser
    if (winnerWinsCount >= seriesDoc.bestOf) {
      message = "Series," + message
      let seriesUpdateData = {
        status: "Ended",
        winner: new ObjectId(matchOutcomes.winningTeam),
        loser: new ObjectId(matchOutcomes.losingTeam),
        overtimeCount: overtimeCount,
      };
      await seriesCollection.updateOne(
        { _id: new ObjectId(seriesDoc._id) },
        {
          $set: seriesUpdateData
        }
      );
      createLog({ type: "Series Ended", seriesId: seriesDoc._id })
      await handleSeriesWagers(seriesDoc._id)
    }

    // Update the tournament document if tournament has ended with this match

    // Set status for Tournament if included in request body
    if (endTournament === true) {
      await tournamentsCollection.updateOne(
        { _id: new ObjectId(seriesDoc.tournament) },
        {
          $set: {
            status: "Ended",
            winner: new ObjectId(matchOutcomes.winningTeam),
            loser: new ObjectId(matchOutcomes.losingTeam),
          }
        }
      );
      createLog({ type: "Tournament Ended", tournamentId: seriesDoc.tournament })
      message = "Tournament," + message
      await handleTournamentWagers(seriesDoc.tournament)
    }

    // Update the season document if season has ended with this match
    
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
          { $set: { status: "Ended", winner: matchOutcomes.winningTeam } }
        );
      }
      createLog({ type: "Season Ended", SeasonId: seasonDoc._id })
      message = "Season," + message
      await handleSeasonWagers(seasonDoc._id)
    }

    res.status(200).json({ message: message });
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

// Get all Teams with Player Metadata (GET)
app.get("/api/teams", async (req, res) => {
  try {
    // Fetch all teams
    const teams = await teamsCollection.find().toArray();

    // Replace each team's players array with actual player metadata
    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await playersCollection.find({
          _id: { $in: team.players },  // team.players contains ObjectIDs of players
        }).toArray();
        
        // Replace players ObjectIDs with full player data
        return { ...team, players };
      })
    );

    res.status(200).json(teamsWithPlayers);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch teams with player metadata", details: err.message });
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

// Get complete information for all seasons (GET)
app.get("/api/data-trees/season/all", async (req, res) => {
  try {
    // Fetch all season documents
    const seasons = await seasonsCollection.find().toArray();

    // Iterate over each season to construct a complete data tree
    const seasonsWithData = await Promise.all(
      seasons.map(async (season) => {
        // Add type to season
        season.type = "season";

        // Convert season.tournaments IDs to ObjectId if they are strings
        season.tournaments = season.tournaments.map((id) =>
          typeof id === "string" ? new ObjectId(id) : id
        );

        // Fetch the tournaments related to this season
        const tournaments = await tournamentsCollection
          .find({ _id: { $in: season.tournaments } })
          .toArray();

        // Add type to each tournament
        const tournamentsWithType = tournaments.map((tournament) => ({
          ...tournament,
          type: "tournament",
        }));

        // Fetch all series for the tournaments
        const tournamentIds = tournamentsWithType.map((tournament) => tournament._id);
        const seriesList = await seriesCollection
          .find({ tournament: { $in: tournamentIds.map((id) => (typeof id === "string" ? new ObjectId(id) : id)) } })
          .toArray();

        // Add type to each series
        const seriesWithType = seriesList.map((series) => ({
          ...series,
          type: "series",
        }));

        // Fetch all matches for the series
        const seriesIds = seriesWithType.map((series) => series._id);
        const matches = await matchesCollection
          .find({ series: { $in: seriesIds.map((id) => (typeof id === "string" ? new ObjectId(id) : id)) } })
          .toArray();

        // Add type to each match
        const matchesWithType = matches.map((match) => ({
          ...match,
          type: "match",
        }));

        // Fetch all teams for the series and matches
        const matchTeamIds = matchesWithType.flatMap((match) =>
          match.teams.map((id) => (typeof id === "string" ? new ObjectId(id) : id))
        );
        const seriesTeamIds = seriesWithType.flatMap((series) =>
          series.teams.map((id) => (typeof id === "string" ? new ObjectId(id) : id))
        );
        const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])]; // Unique list of all team IDs

        const teams = await teamsCollection
          .find({ _id: { $in: allTeamIds } })
          .toArray();

        // Add type to each team
        const teamsWithType = teams.map((team) => ({
          ...team,
          type: "team",
        }));

        // Fetch all players for the teams
        const playerIds = teams.flatMap((team) =>
          team.players.map((id) => (typeof id === "string" ? new ObjectId(id) : id))
        );
        const players = await playersCollection
          .find({ _id: { $in: playerIds } })
          .toArray();

        // Add type to each player
        const playersWithType = players.map((player) => ({
          ...player,
          type: "player",
        }));

        // Map teams with their respective players
        const teamsWithPlayers = teamsWithType.map((team) => ({
          ...team,
          players: playersWithType.filter((player) =>
            player.team.equals(team._id)
          ), // Populate players in the team
        }));

        // Map matches with their respective teams and players
        const matchesWithTeams = matchesWithType.map((match) => ({
          ...match,
          teams: teamsWithPlayers.filter((team) =>
            match.teams.some((t) =>
              typeof t === "string" ? new ObjectId(t).equals(team._id) : t.equals(team._id)
            )
          ), // Populate teams in the match
        }));

        // Map series with their respective matches and teams
        const seriesWithMatches = seriesWithType.map((series) => ({
          ...series,
          teams: teamsWithPlayers.filter((team) =>
            series.teams.some((t) =>
              typeof t === "string" ? new ObjectId(t).equals(team._id) : t.equals(team._id)
            )
          ), // Populate teams in the series
          matches: matchesWithTeams.filter((match) =>
            typeof match.series === "string" ? new ObjectId(match.series).equals(series._id) : match.series.equals(series._id)
          ), // Populate matches in the series
        }));

        // Map tournaments with their respective series
        const tournamentsWithSeries = tournamentsWithType.map((tournament) => ({
          ...tournament,
          series: seriesWithMatches.filter((series) =>
            typeof series.tournament === "string" ? new ObjectId(series.tournament).equals(tournament._id) : series.tournament.equals(tournament._id)
          ), // Populate series in the tournament
        }));

        // Construct the complete season object with type
        return {
          ...season,
          tournaments: tournamentsWithSeries,
        };
      })
    );

    res.status(200).json(seasonsWithData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all season data", details: err.message });
  }
});

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