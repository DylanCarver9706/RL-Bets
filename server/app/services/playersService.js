const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createPlayer = async (playerData) => {
  if (!playerData.names || !playerData.team || !playerData.playerId) {
    throw new Error("Player names, team ID, and player's id are required.");
  }

  // Convert team ID to ObjectId
  playerData.team = ObjectId.createFromHexString(playerData.team);

  const result = await createMongoDocument(
    collections.playersCollection,
    playerData
  );
  await updateMongoDocument(collections.teamsCollection, playerData.team.toString(), {
    $push: { players: result.insertedId },
  });
  return { playerId: result.insertedId };
};

const getAllPlayers = async () => {
  return await collections.playersCollection.find().toArray();
};

const getPlayerById = async (id) => {
  return await collections.playersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const updatePlayer = async (id, updateData) => {
  await updateMongoDocument(collections.playersCollection, id, {
    $set: updateData,
  });
};

const deletePlayer = async (id) => {
  const playerId = ObjectId.createFromHexString(id);

  const player = await getPlayerById(id);
  if (!player) throw new Error("Player not found");

  await updateMongoDocument(collections.teamsCollection, player.team, {
    $pull: { players: playerId },
  });
  await collections.playersCollection.deleteOne({ _id: playerId });
};

module.exports = {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
};
