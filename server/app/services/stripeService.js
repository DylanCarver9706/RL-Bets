// app/services/stripeService.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  updateMongoDocument,
  createMongoDocument,
} = require("../../database/middlewares/mongo");
const { broadcastUpdate } = require("../middlewares/supabaseAdmin");
const { getUserById } = require("./usersService");

const createCheckoutSession = async (
  purchaseItems,
  mongoUserId,
  userMadeFirstPurchase
) => {
  try {
    // Fetch product details from the database
    const productIds = purchaseItems.map((item) =>
      ObjectId.createFromHexString(item._id)
    );
    const productsFromDb = await collections.productsCollection
      .find({ _id: { $in: productIds } })
      .toArray();

    let productPriceMap = null;
    const userDoc = await getUserById(mongoUserId);
    if (
      userMadeFirstPurchase === false &&
      userDoc.madeFirstPurchase === false
    ) {
      // Create a map for quick lookup
      productPriceMap = productsFromDb.reduce((acc, product) => {
        acc[product._id.toString()] = product.firstPurchaseDiscountPrice; // Store price for comparison
        return acc;
      }, {});
    } else {
      // Create a map for quick lookup
      productPriceMap = productsFromDb.reduce((acc, product) => {
        acc[product._id.toString()] = product.price;
        return acc;
      }, {});
    }

    let creditsTotal = 0;

    // Build line items with verified prices
    const lineItems = purchaseItems.map((item) => {
      const verifiedPrice = productPriceMap[item._id]; // Get price from DB
      creditsTotal += item.credits * item.quantity;
      if (!verifiedPrice) {
        throw new Error(`Product with ID ${item._id} not found in database`);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(verifiedPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${
        process.env.ENV === "production"
          ? process.env.process.env.PROD_CLIENT_URLS.split(",")[1]
          : process.env.DEV_CLIENT_URL
      }/Wagers`,
      cancel_url: `${
        process.env.ENV === "production"
          ? process.env.PROD_CLIENT_URLS.split(",")[1]
          : process.env.DEV_CLIENT_URL
      }/Credit-Shop`,
      metadata: { mongoUserId, creditsTotal, userMadeFirstPurchase },
    });

    return session;
  } catch (error) {
    console.error(
      "Error creating Stripe checkout session:",
      error.message,
      error.stack
    );
    throw error;
  }
};

const handleWebhookEvent = async (event) => {
  const session = event.data.object;

  // Handle only 'checkout.session.completed' events
  if (event.type === "checkout.session.completed") {
    const userId = session.metadata.mongoUserId;
    const creditsPurchased = session.metadata.creditsTotal;
    const userMadeFirstPurchase = session.metadata.userMadeFirstPurchase;

    try {
      const user = await collections.usersCollection.findOne({
        _id: ObjectId.createFromHexString(userId),
      });

      if (!user) {
        console.warn("User not found in database for ID:", userId);
        return;
      }

      const updatedCredits = (user.credits || 0) + parseFloat(creditsPurchased);

      let updateUserObj = { credits: updatedCredits };

      if (userMadeFirstPurchase === "false") {
        updateUserObj.madeFirstPurchase = true;
      }

      const updatedUser = await updateMongoDocument(
        collections.usersCollection,
        userId,
        { $set: updateUserObj },
        true
      );

      await broadcastUpdate("users", "updateUser", { user: updatedUser });

      // Add credit purchase to the transactions collection
      await createMongoDocument(collections.transactionsCollection, {
        user: user._id,
        credits: parseInt(creditsPurchased),
        type: "purchase",
      });
    } catch (error) {
      console.error(
        "Error handling 'checkout.session.completed' event:",
        error.message,
        error.stack
      );
      throw error;
    }
  } else {
    console.warn("Unhandled Stripe event type:", event.type);
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhookEvent,
};
