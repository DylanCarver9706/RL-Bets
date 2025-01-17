const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createTournament = async (tournamentData) => {

  // Lazy load create leaderboard to avoid circular dependency
  const { createLeaderboard } = require("./leaderboardService");

  const newLeaderboard = await createLeaderboard({
    name: tournamentData.name,
    users: [],
    status: "Created",
  })

  tournamentData.leaderboard = newLeaderboard._id;

  const result = await createMongoDocument(
    collections.tournamentsCollection,
    tournamentData
  );

  await updateMongoDocument(collections.leaderboardsCollection, newLeaderboard._id.toString(), {
    $set: { tournament: result.insertedId },
  });

  return result.insertedId;
};

const getAllTournaments = async () => {
  return await collections.tournamentsCollection.find().toArray();
};

const getTournamentById = async (id) => {
  return await collections.tournamentsCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const updateTournament = async (id, updateData) => {
  if (updateData.winner)
    updateData.winner = ObjectId.createFromHexString(updateData.winner);
  if (updateData.loser)
    updateData.loser = ObjectId.createFromHexString(updateData.loser);

  await updateMongoDocument(collections.tournamentsCollection, id, {
    $set: updateData,
  });

  if (updateData.status) {
    const wagers = await collections.wagersCollection
      .find({ rlEventReference: id })
      .toArray();
    await Promise.all(
      wagers.map((wager) =>
        updateMongoDocument(
          collections.wagersCollection,
          wager._id.toString(),
          {
            $set: { status: updateData.status },
          }
        )
      )
    );

    // If the status is "Ongoing" or "Betable", update other tournaments to "Ended"
    if (["Ongoing", "Betable"].includes(updateData.status)) {
      const allTournaments = await getAllTournaments();

      await Promise.all(
        allTournaments.map((tournament) => {
          if (tournament._id.toString() !== id) {
            return updateMongoDocument(
              collections.tournamentsCollection,
              tournament._id.toString(),
              { $set: { status: "Ended" } }
            );
          }
          return null; // Skip updating the current tournament
        })
      );
    }
  }
};

const deleteTournament = async (id) => {
  const tournament = await getTournamentById(id);
  if (!tournament) throw new Error("Tournament not found");

  await collections.tournamentsCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
};

// Get the current tournament if the status is "Ongoing" or "Betable"
const getCurrentTournament = async () => {
  const currentTournament = await collections.tournamentsCollection.findOne({
    status: { $in: ["Ongoing", "Betable"] },
  });
  return currentTournament;
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  getCurrentTournament,
};
