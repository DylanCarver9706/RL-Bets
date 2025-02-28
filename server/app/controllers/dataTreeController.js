const {
  getAllTournamentsDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBettableDataTree,
  getEndedTournamentsDataTree,
  getCurrentTournamentDataTree,
  getAllEventsDataTree,
  getCurrentEventsDataTree,
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

const getBettable = async (req, res, logError) => {
  try {
    const data = await getBettableDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getCurrentDataTree = async (req, res, logError) => {
  try {
    const data = await getCurrentTournamentDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getEndedTournaments = async (req, res, logError) => {
  try {
    const data = await getEndedTournamentsDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getAllEvents = async (req, res, logError) => {
  try {
    const data = await getAllEventsDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getCurrentEvents = async (req, res, logError) => {
  try {
    const data = await getCurrentEventsDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  getAllTournaments,
  getTournament,
  getSeries,
  getBettable,
  getCurrentDataTree,
  getEndedTournaments,
  getAllEvents,
  getCurrentEvents,
};
