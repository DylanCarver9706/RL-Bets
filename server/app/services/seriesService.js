const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createSeries = async (seriesData) => {
  const { tournament, team1, team2, best_of, name } = seriesData;

  if (!tournament || !team1 || !team2 || !best_of || !name) {
    throw new Error(
      "Tournament ID, Team 1, Team 2, Best Of value, and Name are required to create a Series."
    );
  }

  const series = {
    name,
    tournament: new ObjectId(tournament),
    teams: [new ObjectId(team1), new ObjectId(team2)],
    best_of: parseInt(best_of, 10),
    type: "series",
    status: "Created",
  };

  // Create Series Document
  const seriesResult = await createMongoDocument(
    collections.seriesCollection,
    series
  );

  // Generate matches for the series based on the best_of value
  const matches = Array.from({ length: best_of }, (_, index) => ({
    name: `${name} - Match ${index + 1}`,
    teams: [new ObjectId(team1), new ObjectId(team2)],
    series: seriesResult.insertedId,
    status: "Created",
    type: "match",
  }));

  const matchIds = [];
  for (const match of matches) {
    const matchResult = await createMongoDocument(
      collections.matchesCollection,
      match
    );
    matchIds.push(matchResult.insertedId);
  }

  // Update series document with match IDs
  await updateMongoDocument(
    collections.seriesCollection,
    seriesResult.insertedId,
    {
      $set: { matches: matchIds },
    }
  );

  // Add series to the tournament
  await updateMongoDocument(collections.tournamentsCollection, tournament, {
    $push: { series: seriesResult.insertedId },
  });

  return { seriesId: seriesResult.insertedId, matchIds };
};

const getAllSeries = async () => {
  return await collections.seriesCollection.find().toArray();
};

const getSeriesById = async (id) => {
  return await collections.seriesCollection.findOne({ _id: new ObjectId(id) });
};

const updateSeries = async (id, updateData) => {
  if (updateData.winner) updateData.winner = new ObjectId(updateData.winner);
  if (updateData.loser) updateData.loser = new ObjectId(updateData.loser);
  if (updateData.firstBlood)
    updateData.firstBlood = new ObjectId(updateData.firstBlood);
  if (updateData.tournament)
    updateData.tournament = new ObjectId(updateData.tournament);

  await updateMongoDocument(collections.seriesCollection, id, {
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
  }
};

const deleteSeries = async (id) => {
  const series = await getSeriesById(id);
  if (!series) throw new Error("Series not found");

  // Remove series from the tournament
  await updateMongoDocument(
    collections.tournamentsCollection,
    series.tournament,
    {
      $pull: { series: new ObjectId(id) },
    }
  );

  await collections.seriesCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
};
