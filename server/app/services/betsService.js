const { collections } = require("../../database/mongoCollections");
const {
    createMongoDocument,
    updateMongoDocument,
  } = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createBet = async (betData) => {
  const { user, credits, agreeBet, rlEventReference, wagerId } = betData;

  // Validate user and their credits
  const userDoc = await collections.usersCollection.findOne({ _id: new ObjectId(user) });
  if (!userDoc) throw new Error("User not found");
  if (userDoc.credits < credits) throw new Error("Insufficient credits");

  const newBet = {
    user: new ObjectId(user),
    credits,
    agreeBet,
    rlEventReference: new ObjectId(rlEventReference),
    wagerId: new ObjectId(wagerId),
  };

  const result = await createMongoDocument(collections.betsCollection, newBet);

  // Update wager with the new bet
  await updateMongoDocument(collections.wagersCollection, wagerId, { $push: { bets: result.insertedId } });

  // Deduct credits from user
  await updateMongoDocument(collections.usersCollection, user, { $set: { credits: userDoc.credits - credits } });

  return { betId: result.insertedId, updatedCredits: userDoc.credits - credits };
};

const getAllBets = async () => {
  return await collections.betsCollection.find().toArray();
};

const getBetById = async (id) => {
  return await collections.betsCollection.findOne({ _id: new ObjectId(id) });
};

const updateBet = async (id, updateData) => {
  if (updateData.rlEventReference) {
    updateData.rlEventReference = new ObjectId(updateData.rlEventReference);
  }
  await updateMongoDocument(collections.betsCollection, id, { $set: updateData });
};

const deleteBet = async (id) => {
  await collections.betsCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = { createBet, getAllBets, getBetById, updateBet, deleteBet };
