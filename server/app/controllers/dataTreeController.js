const {
  getAllTournamentsDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBetableDataTree,
} = require("../services/dataTreeService");

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

module.exports = {
  getAllTournaments,
  getTournament,
  getSeries,
  getBetable,
};
