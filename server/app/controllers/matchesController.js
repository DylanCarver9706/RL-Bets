const {
  createMatch,
  getAllMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  matchConcluded,
} = require("../services/matchesService");

const create = async (req, res, logError) => {
  try {
    const matchId = await createMatch(req.body);
    res.status(201).json({ message: "Match created successfully", matchId });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const matches = await getAllMatches();
    res.status(200).json(matches);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.status(200).json(match);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateMatch(req.params.id, req.body);
    res.status(200).json({ message: "Match updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const concludeMatch = async (req, res, logError) => {
  try {
    const message = await matchConcluded(req.params.id, req.body);
    res.status(200).json(message);
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteMatch(req.params.id);
    res.status(200).json({ message: "Match deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, concludeMatch, remove };
