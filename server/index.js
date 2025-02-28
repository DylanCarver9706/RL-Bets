// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const { initializeCollections } = require("./database/mongoCollections");
const { initializeFirebase } = require("./app/middlewares/firebaseAdmin");
const { initializeSocketIo } = require("./app/middlewares/socketIO");
const { errorLogger } = require("./app/middlewares/errorLogger");
const {
  scheduleDailyEmail,
  scheduleSoftDeleteUsersCheck,
} = require("./app/middlewares/nodeCron");

// Initialize Express app
const app = express();

// Set CORS origins
let allowedOrigins = null;

if (process.env.ENV === "production") {
  allowedOrigins = [process.env.PROD_CLIENT_URL];
} else if (process.env.ENV === "development") {
  allowedOrigins = [process.env.DEV_CLIENT_URL, process.env.PROD_CLIENT_URL];
}

// WebSocket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PROD_CLIENT_URL,
    // credentials: true,
  },
});

app.set("io", io);

// Initialize middleware
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next(); // Skip JSON body parsing for the webhook route
  } else {
    express.json()(req, res, next); // Use JSON body parser for all other routes
  }
});

// Update the main CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

// Instead of chaining promises, use async/await and initialize everything before setting up routes
const startServer = async () => {
  try {
    await initializeCollections();
    await initializeFirebase();
    await initializeSocketIo(io);
    console.log("Server Ready");

    // Log all requests
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    // Move all route definitions here, after initialization is complete
    app.get("/", (req, res) => {
      res.json({ message: "Hello World!" });
    });

    // Import routes
    app.use("/api/users", require("./app/routes/usersRoutes"));
    app.use("/api/logs", require("./app/routes/logsRoutes"));
    app.use("/api/plaid", require("./app/routes/plaidRoutes"));
    app.use("/api/stripe", require("./app/routes/stripeRoutes"));
    app.use("/api/geofencing", require("./app/routes/geofencingRoutes"));
    app.use(
      "/api/age-restriction",
      require("./app/routes/ageRestrictionRoutes")
    );
    app.use("/api/wagers", require("./app/routes/wagersRoutes"));
    app.use("/api/bets", require("./app/routes/betsRoutes"));
    app.use("/api/tournaments", require("./app/routes/tournamentsRoutes"));
    app.use("/api/series", require("./app/routes/seriesRoutes"));
    app.use("/api/matches", require("./app/routes/matchesRoutes"));
    app.use("/api/teams", require("./app/routes/teamsRoutes"));
    app.use("/api/players", require("./app/routes/playersRoutes"));
    app.use("/api/data-trees", require("./app/routes/dataTreeRoutes"));
    app.use("/api/jira", require("./app/routes/jiraRoutes"));
    app.use("/webhook", require("./app/routes/stripeWebhookRoute"));
    app.use("/api/server-utils", require("./app/routes/serverUtilsRoutes"));
    app.use("/api/promotions", require("./app/routes/promotionsRoutes"));
    app.use("/api/leaderboards", require("./app/routes/leaderboardRoutes"));
    app.use("/api/transactions", require("./app/routes/transactionsRoutes"));
    app.use("/api/agreements", require("./app/routes/agreementsRoutes"));
    app.use("/api/openai", require("./app/routes/openaiRoutes"));
    app.use("/api/firebase", require("./app/routes/firebaseRoutes"));
    app.use("/api/products", require("./app/routes/productsRoutes"));

    app.use(errorLogger);

    if (process.env.ENV === "production") {
      // Cron Jobs
      scheduleDailyEmail();
      scheduleSoftDeleteUsersCheck();
    }

    // Start server
    const PORT = process.env.DEV_SERVER_URL_PORT;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
