const {
    createSeason,
    getAllSeasons,
    getSeasonById,
    updateSeason,
    deleteSeason,
  } = require("../services/seasonsService");
  
  const create = async (req, res) => {
    try {
      const seasonId = await createSeason(req.body);
      res.status(201).json({ message: "Season created successfully", seasonId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create season", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const seasons = await getAllSeasons();
      res.status(200).json(seasons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seasons", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const season = await getSeasonById(req.params.id);
      if (!season) return res.status(404).json({ error: "Season not found" });
      res.status(200).json(season);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch season", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updateSeason(req.params.id, req.body);
      res.status(200).json({ message: "Season updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update season", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deleteSeason(req.params.id);
      res.status(200).json({ message: "Season deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete season", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, remove };
  