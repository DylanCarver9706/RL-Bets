const {
  getAllSeasonsDataTree,
  getSeasonDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBetableDataTree,
} = require("../services/dataTreeService");

const getAllSeasons = async (req, res, logError) => {
  try {
    const data = await getAllSeasonsDataTree();
    res.status(200).json(data);
  } catch (error) {
    logError(error);
  }
};

const getSeason = async (req, res, logError) => {
  try {
    const data = await getSeasonDataTree(req.params.id);
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

// Other methods like getSeason, getTournament, etc.

module.exports = {
  getAllSeasons,
  getSeason,
  getTournament,
  getSeries,
  getBetable,
};
