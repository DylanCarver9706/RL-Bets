const {
  getAllTournamentsDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBetableDataTree,
} = require("../services/dataTreeService");
const { getCurrentTournament } = require("../services/tournamentsService");

const getAllTournaments = async (req, res, logError) => {
  try {
    const data = await getAllTournamentsDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getTournament = async (req, res, logError) => {
  try {
    const data = await getTournamentDataTree(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getSeries = async (req, res, logError) => {
  try {
    const data = await getSeriesDataTree(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getBetable = async (req, res, logError) => {
  try {
    const data = await getBetableDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getCurrentDataTree = async (req, res, logError) => {
  try {
    const currentTournament = await getCurrentTournament();
    const data = await getTournamentDataTree(currentTournament._id.toString());
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  getAllTournaments,
  getTournament,
  getSeries,
  getBetable,
  getCurrentDataTree,
};
