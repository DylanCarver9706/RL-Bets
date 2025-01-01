const {
    createMatch,
    getAllMatches,
    getMatchById,
    updateMatch,
    deleteMatch,
    matchConcluded,
  } = require("../services/matchesService");
  
  const create = async (req, res) => {
    try {
      const matchId = await createMatch(req.body);
      res.status(201).json({ message: "Match created successfully", matchId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create match", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const matches = await getAllMatches();
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch matches", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const match = await getMatchById(req.params.id);
      if (!match) return res.status(404).json({ error: "Match not found" });
      res.status(200).json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch match", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updateMatch(req.params.id, req.body);
      res.status(200).json({ message: "Match updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update match", details: error.message });
    }
  };

  const concludeMatch = async (req, res) => {
    try {
      const message = await matchConcluded(req.params.id, req.body);
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to update match", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deleteMatch(req.params.id);
      res.status(200).json({ message: "Match deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete match", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, concludeMatch, remove };
  