const {
    createTournament,
    getAllTournaments,
    getTournamentById,
    updateTournament,
    deleteTournament,
  } = require("../services/tournamentsService");
  
  const create = async (req, res) => {
    try {
      const tournamentId = await createTournament(req.body);
      res.status(201).json({ message: "Tournament created successfully", tournamentId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create tournament", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const tournaments = await getAllTournaments();
      res.status(200).json(tournaments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournaments", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const tournament = await getTournamentById(req.params.id);
      if (!tournament) return res.status(404).json({ error: "Tournament not found" });
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournament", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updateTournament(req.params.id, req.body);
      res.status(200).json({ message: "Tournament updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update tournament", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deleteTournament(req.params.id);
      res.status(200).json({ message: "Tournament deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tournament", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, remove };
  