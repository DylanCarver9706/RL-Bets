const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createSeries = async (seriesData) => {
  const { tournament, team1, team2, best_of, name, historical } = seriesData;

  if (!tournament || !team1 || !team2 || !best_of || !name || !historical) {
    throw new Error(
      "Tournament ID, Team 1, Team 2, Best Of value, name, and historical are required to create a Series."
    );
  }

  const series = {
    name,
    tournament: ObjectId.createFromHexString(tournament),
    teams: [
      ObjectId.createFromHexString(team1),
      ObjectId.createFromHexString(team2),
    ],
    best_of: parseInt(best_of, 10),
    type: "series",
    status: historical ? "Ended" : "Created",
    historical: historical,
  };

  // Create Series Document
  const seriesResult = await createMongoDocument(
    collections.seriesCollection,
    series
  );

  // Add series to the tournament
  await updateMongoDocument(collections.tournamentsCollection, tournament, {
    $push: { series: seriesResult.insertedId },
  });

  if (!historical) {
    // Generate matches for the series based on the best_of value
    const matches = Array.from({ length: best_of }, (_, index) => ({
      name: `${name} - Match ${index + 1}`,
      teams: [
        ObjectId.createFromHexString(team1),
        ObjectId.createFromHexString(team2),
      ],
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
      seriesResult.insertedId.toString(),
      {
        $set: { matches: matchIds },
      }
    );
  
  }

  return { seriesId: seriesResult.insertedId };
};

const getAllSeries = async () => {
  return await collections.seriesCollection.find().toArray();
};

const getSeriesById = async (id) => {
  return await collections.seriesCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const updateSeries = async (id, updateData) => {
  if (updateData.winner)
    updateData.winner = ObjectId.createFromHexString(updateData.winner);
  if (updateData.loser)
    updateData.loser = ObjectId.createFromHexString(updateData.loser);
  if (updateData.firstBlood)
    updateData.firstBlood = ObjectId.createFromHexString(updateData.firstBlood);
  if (updateData.tournament)
    updateData.tournament = ObjectId.createFromHexString(updateData.tournament);

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
      $pull: { series: ObjectId.createFromHexString(id) },
    }
  );

  await collections.seriesCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
};

module.exports = {
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
};
