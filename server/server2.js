// server2.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const { initializeCollections } = require("./database/mongoCollections");
const { initializeFirebase } = require("./app/middlewares/firebaseAdmin");
const { initializeSocketIo } = require("./app/middlewares/socketIO");
const { errorLogger } = require("./app/middlewares/errorLogger");

// Initialize Express app
const app = express();

// WebSocket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.DEV_CLIENT_URL,
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

app.use(
  cors({
    origin: process.env.DEV_CLIENT_URL,
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

initializeCollections()
  .then(() => initializeFirebase())
  .then(() => initializeSocketIo(io))
  .then(() => console.log("Server Ready"));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Import routes
app.use("/api/users", require("./app/routes/usersRoutes"));
app.use("/api/logs", require("./app/routes/logsRoutes"));
app.use("/api/plaid", require("./app/routes/plaidRoutes"));
app.use("/api/stripe", require("./app/routes/stripeRoutes"));
app.use("/api/geofencing", require("./app/routes/geofencingRoutes"));
app.use("/api/age-restriction", require("./app/routes/ageRestrictionRoutes"));
app.use("/api/wagers", require("./app/routes/wagersRoutes"));
app.use("/api/bets", require("./app/routes/betsRoutes"));
app.use("/api/seasons", require("./app/routes/seasonsRoutes"));
app.use("/api/tournaments", require("./app/routes/tournamentsRoutes"));
app.use("/api/series", require("./app/routes/seriesRoutes"));
app.use("/api/matches", require("./app/routes/matchesRoutes"));
app.use("/api/teams", require("./app/routes/teamsRoutes"));
app.use("/api/players", require("./app/routes/playersRoutes"));
app.use("/api/data-trees", require("./app/routes/dataTreeRoutes"));
app.use("/api/jira", require("./app/routes/jiraRoutes"));
app.use("/webhook", require("./app/routes/stripeWebhookRoute"));
app.use("/api/server-utils", require("./app/routes/serverUtilsRoutes"));

app.use(errorLogger);

// Start server
const PORT = process.env.DEV_SERVER_URL_PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
