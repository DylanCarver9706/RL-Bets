// app/controllers/stripeController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  createCheckoutSession,
  handleWebhookEvent,
} = require("../services/stripeService");

const createSession = async (req, res, logError) => {
  try {
    const { purchaseItems, mongoUserId, creditsTotal } = req.body;

    if (!purchaseItems || !mongoUserId || !creditsTotal) {
      console.error("Missing required fields for create session:", {
        purchaseItems,
        mongoUserId,
        creditsTotal,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await createCheckoutSession(
      purchaseItems,
      mongoUserId,
      creditsTotal
    );
    res.status(200).json(session);
  } catch (error) {
    console.error(
      "Error creating checkout session:",
      error.message,
      error.stack
    );
    logError(error);
  }
};

const stripeWebhook = async (req, res, logError) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET
    );

    await handleWebhookEvent(event);

    res.status(200).send();
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  createSession,
  stripeWebhook,
};
