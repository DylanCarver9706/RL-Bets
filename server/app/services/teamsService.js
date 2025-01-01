const { collections } = require("../../database/mongoCollections");
const {
    createMongoDocument,
    updateMongoDocument,
  } = require("../../database/middlewares/mongo");
const { ObjectId } = require("mongodb");

const createTeam = async (teamData) => {
  if (!teamData.name) {
    throw new Error("Team name is required.");
  }
  const result = await createMongoDocument(collections.teamsCollection, teamData);
  return { teamId: result.insertedId };
};

const getAllTeamsWithPlayers = async () => {
  const teams = await collections.teamsCollection.find().toArray();
  return await Promise.all(
    teams.map(async (team) => {
      const players = await collections.playersCollection
        .find({ _id: { $in: team.players } })
        .toArray();
      return { ...team, players };
    })
  );
};

const getTeamById = async (id) => {
  return await collections.teamsCollection.findOne({ _id: new ObjectId(id) });
};

const updateTeam = async (id, updateData) => {
  await updateMongoDocument(collections.teamsCollection, id, { $set: updateData });
};

const deleteTeam = async (id) => {
  const teamId = new ObjectId(id);

  const team = await getTeamById(id);
  if (!team) throw new Error("Team not found");

  await collections.playersCollection.deleteMany({ team: teamId });
  await collections.teamsCollection.deleteOne({ _id: teamId });
};

module.exports = {
  createTeam,
  getAllTeamsWithPlayers,
  getTeamById,
  updateTeam,
  deleteTeam,
};
