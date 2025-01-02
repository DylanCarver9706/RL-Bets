const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createSeason = async (seasonData) => {
  const result = await createMongoDocument(
    collections.seasonsCollection,
    seasonData
  );
  return result.insertedId;
};

const getAllSeasons = async () => {
  return await collections.seasonsCollection.find().toArray();
};

const getSeasonById = async (id) => {
  return await collections.seasonsCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const updateSeason = async (id, updateData) => {
  if (updateData.winner)
    updateData.winner = ObjectId.createFromHexString(updateData.winner);
  if (updateData.loser)
    updateData.loser = ObjectId.createFromHexString(updateData.loser);

  await updateMongoDocument(collections.seasonsCollection, id, {
    $set: updateData,
  });

  if (updateData.status) {
    const wagers = await collections.wagersCollection
      .find({ rlEventReference: id })
      .toArray();
    for (const wager of wagers) {
      await updateMongoDocument(collections.wagersCollection, wager._id, {
        $set: { status: updateData.status },
      });
    }
  }
};

const deleteSeason = async (id) => {
  await collections.seasonsCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
};

module.exports = {
  createSeason,
  getAllSeasons,
  getSeasonById,
  updateSeason,
  deleteSeason,
};
