const {
    createPlayer,
    getAllPlayers,
    getPlayerById,
    updatePlayer,
    deletePlayer,
  } = require("../services/playersService");
  
  const create = async (req, res) => {
    try {
      const result = await createPlayer(req.body);
      res.status(201).json({ message: "Player created successfully", ...result });
    } catch (error) {
      res.status(500).json({ error: "Failed to create player", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const players = await getAllPlayers();
      res.status(200).json(players);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch players", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const player = await getPlayerById(req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      res.status(200).json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch player", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updatePlayer(req.params.id, req.body);
      res.status(200).json({ message: "Player updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update player", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deletePlayer(req.params.id);
      res.status(200).json({ message: "Player deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete player", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, remove };
  