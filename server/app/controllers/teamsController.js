const {
  createTeam,
  getAllTeamsWithPlayers,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../services/teamsService");

const create = async (req, res, logError) => {
  try {
    const result = await createTeam(req.body);
    res.status(201).json({ message: "Team created successfully", ...result });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const teams = await getAllTeamsWithPlayers();
    res.status(200).json(teams);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const team = await getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.status(200).json(team);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateTeam(req.params.id, req.body);
    res.status(200).json({ message: "Team updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteTeam(req.params.id);
    res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
