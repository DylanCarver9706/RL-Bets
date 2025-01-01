const {
    createTeam,
    getAllTeamsWithPlayers,
    getTeamById,
    updateTeam,
    deleteTeam,
  } = require("../services/teamsService");
  
  const create = async (req, res) => {
    try {
      const result = await createTeam(req.body);
      res.status(201).json({ message: "Team created successfully", ...result });
    } catch (error) {
      res.status(500).json({ error: "Failed to create team", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const teams = await getAllTeamsWithPlayers();
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const team = await getTeamById(req.params.id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.status(200).json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updateTeam(req.params.id, req.body);
      res.status(200).json({ message: "Team updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update team", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deleteTeam(req.params.id);
      res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, remove };
  