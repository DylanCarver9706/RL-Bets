const {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
} = require("../services/tournamentsService");

const create = async (req, res, logError) => {
  try {
    const tournamentId = await createTournament(req.body);
    res
      .status(201)
      .json({ message: "Tournament created successfully", tournamentId });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const tournaments = await getAllTournaments();
    res.status(200).json(tournaments);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const tournament = await getTournamentById(req.params.id);
    if (!tournament)
      return res.status(404).json({ error: "Tournament not found" });
    res.status(200).json(tournament);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateTournament(req.params.id, req.body);
    res.status(200).json({ message: "Tournament updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteTournament(req.params.id);
    res.status(200).json({ message: "Tournament deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
