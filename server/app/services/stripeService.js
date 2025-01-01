// app/services/stripeService.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const { updateMongoDocument } = require("../../database/middlewares/mongo");

const createCheckoutSession = async (
  purchaseItems,
  mongoUserId,
  creditsTotal
) => {
  const lineItems = purchaseItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }));

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.DEV_CLIENT_URL}`,
    cancel_url: `${process.env.DEV_CLIENT_URL}/Credits`,
    metadata: { mongoUserId, creditsTotal },
  });
};

const handleWebhookEvent = async (event, io) => {
  const session = event.data.object;

  // Handle only 'checkout.session.completed' events
  if (event.type === "checkout.session.completed") {
    const userId = session.metadata.mongoUserId;
    const creditsPurchased = session.metadata.creditsTotal;

    const user = await collections.usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (user) {
      const updatedCredits = (user.credits || 0) + parseFloat(creditsPurchased);

      const updatedUser = await updateMongoDocument(
        collections.usersCollection,
        userId,
        { $set: { credits: updatedCredits } },
        true
      );

      // Emit WebSocket updates
      io.emit("updateUser", updatedUser);
    }
  }

  return;
};

module.exports = {
  createCheckoutSession,
  handleWebhookEvent,
};
