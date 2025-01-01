const {
    getAllSeasonsDataTree,
    getSeasonDataTree,
    getTournamentDataTree,
    getSeriesDataTree,
    getBetableDataTree,
  } = require("../services/dataTreeService");
  
  const getAllSeasons = async (req, res) => {
    try {
      const data = await getAllSeasonsDataTree();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data trees", details: error.message });
    }
  };

  const getSeason = async (req, res) => {
    try {
      const data = await getSeasonDataTree(req.params.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data tree", details: error.message });
    }
  };

  const getTournament = async (req, res) => {
    try {
      const data = await getTournamentDataTree(req.params.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data tree", details: error.message });
    }
  };

  const getSeries = async (req, res) => {
    try {
      const data = await getSeriesDataTree(req.params.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data tree", details: error.message });
    }
  };

  const getBetable = async (req, res) => {
    try {
      const data = await getBetableDataTree();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data tree", details: error.message });
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
  