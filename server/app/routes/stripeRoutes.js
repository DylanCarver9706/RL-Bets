// app/routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Stripe API routes
router.post("/create-checkout-session", verifyFirebaseToken, stripeController.createSession);

// Stripe webhook route (uses raw body parsing)
router.post("/webhook", express.raw({ type: "application/json" }), stripeController.stripeWebhook);

module.exports = router;
