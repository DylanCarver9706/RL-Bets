const { collections } = require("../../database/mongoCollections");
const {
    createMongoDocument,
    updateMongoDocument,
  } = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createTournament = async (tournamentData) => {
  if (!tournamentData.season) {
    throw new Error("Season ID is required to create a Tournament.");
  }

  const result = await createMongoDocument(collections.tournamentsCollection, tournamentData);

  await updateMongoDocument(
    collections.seasonsCollection,
    tournamentData.season,
    { $push: { tournaments: result.insertedId } }
  );

  return result.insertedId;
};

const getAllTournaments = async () => {
  return await collections.tournamentsCollection.find().toArray();
};

const getTournamentById = async (id) => {
  return await collections.tournamentsCollection.findOne({ _id: new ObjectId(id) });
};

const updateTournament = async (id, updateData) => {
  if (updateData.winner) updateData.winner = new ObjectId(updateData.winner);
  if (updateData.loser) updateData.loser = new ObjectId(updateData.loser);
  if (updateData.season) updateData.season = new ObjectId(updateData.season);

  await updateMongoDocument(collections.tournamentsCollection, id, { $set: updateData });

  if (updateData.status) {
    const wagers = await collections.wagersCollection.find({ rlEventReference: id }).toArray();
    await Promise.all(
      wagers.map((wager) =>
        updateMongoDocument(collections.wagersCollection, wager._id.toString(), {
          $set: { status: updateData.status },
        })
      )
    );
  }
};

const deleteTournament = async (id) => {
  const tournament = await getTournamentById(id);
  if (!tournament) throw new Error("Tournament not found");

  await updateMongoDocument(collections.seasonsCollection, tournament.season, {
    $pull: { tournaments: new ObjectId(id) },
  });

  await collections.tournamentsCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
};
