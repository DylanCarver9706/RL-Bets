// app/services/plaidService.js
const { Configuration, PlaidEnvironments, PlaidApi } = require("plaid");
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");

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

const createLinkToken = async (mongoUserId) => {
  const user = await collections.usersCollection.findOne({
    _id: ObjectId.createFromHexString(mongoUserId),
  });

  if (!user) {
    throw new Error("User not found in MongoDB");
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

  return tokenResponse.data;
};

const completeIDVSession = async (idvSession) => {
  const idvResult = await plaidClient.identityVerificationGet({
    identity_verification_id: idvSession,
  });

  return idvResult.data;
};

module.exports = { createLinkToken, completeIDVSession };
