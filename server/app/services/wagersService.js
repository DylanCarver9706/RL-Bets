// app/services/wagerService.js
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { broadcastUpdate } = require('../middlewares/supabaseAdmin');

const wagersWithStats = async (wagers) => {
  try {

    const wagersWithStats = await Promise.all(
      wagers.map(async (wager) => {
        const betIds = wager.bets || [];
        const bets = await collections.betsCollection
          .find({ _id: { $in: betIds } })
          .toArray();

        const agreeBets = bets.filter((bet) => bet.agreeBet === true);
        const disagreeBets = bets.filter((bet) => bet.agreeBet === false);

        const agreeCreditsBet = agreeBets.reduce(
          (sum, bet) => sum + bet.credits,
          0
        );
        const disagreeCreditsBet = disagreeBets.reduce(
          (sum, bet) => sum + bet.credits,
          0
        );
        const agreeBetsCount = agreeBets.length;
        const disagreeBetsCount = disagreeBets.length;

        const totalBets = agreeBetsCount + disagreeBetsCount;
        const agreePercentage = totalBets
          ? ((agreeBetsCount / totalBets) * 100).toFixed(1)
          : 0;
        const disagreePercentage = totalBets
          ? ((disagreeBetsCount / totalBets) * 100).toFixed(1)
          : 0;

        return {
          ...wager,
          agreeCreditsBet,
          disagreeCreditsBet,
          agreeBetsCount,
          disagreeBetsCount,
          agreePercentage: parseFloat(agreePercentage),
          disagreePercentage: parseFloat(disagreePercentage),
          bets,
        };
      })
    );

    return wagersWithStats;
  } catch (error) {
    console.error("Error fetching wagers:", error.message);
    throw error;
  }
};

const getAllWagers = async () => {
  try {
    const wagers = await collections.wagersCollection.find().toArray();

    return wagersWithStats(wagers);
  } catch (error) {
    console.error("Error fetching wagers:", error.message);
    throw error;
  }
};

const getWagerById = async (id) => {
  const wager = await collections.wagersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });

  if (!wager) throw new Error("Wager not found");

  const betIds = wager.bets || [];
  const bets = await collections.betsCollection
    .find({ _id: { $in: betIds } })
    .toArray();

  const agreeBets = bets.filter((bet) => bet.agreeBet === true);
  const disagreeBets = bets.filter((bet) => bet.agreeBet === false);

  const agreeCreditsBet = agreeBets.reduce((sum, bet) => sum + bet.credits, 0);
  const disagreeCreditsBet = disagreeBets.reduce(
    (sum, bet) => sum + bet.credits,
    0
  );
  const agreeBetsCount = agreeBets.length;
  const disagreeBetsCount = disagreeBets.length;

  return {
    ...wager,
    agreeCreditsBet,
    disagreeCreditsBet,
    agreeBetsCount,
    disagreeBetsCount,
  };
};

const createWager = async (wagerData) => {
  const result = await createMongoDocument(
    collections.wagersCollection,
    wagerData
  );
  return result.insertedId;
};

const updateWager = async (id, updateData) => {
  await updateMongoDocument(collections.wagersCollection, id, {
    $set: updateData,
  });
  const updatedWagers = await getAllWagers();
  await broadcastUpdate('wagers', 'wagersUpdate', { wagers: updatedWagers });
  return await collections.wagersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const deleteWager = async (id) => {
  await collections.betsCollection.deleteMany({
    wagerId: ObjectId.createFromHexString(id),
  });
  await collections.wagersCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const deleteAllWagers = async () => {
  await collections.betsCollection.deleteMany({});
  await collections.wagersCollection.deleteMany({});
};

module.exports = {
  getAllWagers,
  getWagerById,
  createWager,
  updateWager,
  deleteWager,
  deleteAllWagers,
};
