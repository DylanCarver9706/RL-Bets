// app/routes/stripeWebhookRoute.js
const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");

// Stripe requires raw body for webhook signature verification
router.post(
  "/",
  express.raw({ type: "application/json" }), // Raw body middleware
  stripeController.stripeWebhook
);

module.exports = router;
