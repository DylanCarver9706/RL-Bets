// app/routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Stripe API routes
router.post("/create-checkout-session", verifyFirebaseToken, stripeController.createSession);

module.exports = router;
