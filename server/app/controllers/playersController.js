const {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require("../services/playersService");

const create = async (req, res, logError) => {
  try {
    const result = await createPlayer(req.body);
    res.status(201).json({ message: "Player created successfully", ...result });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const players = await getAllPlayers();
    res.status(200).json(players);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const player = await getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.status(200).json(player);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updatePlayer(req.params.id, req.body);
    res.status(200).json({ message: "Player updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deletePlayer(req.params.id);
    res.status(200).json({ message: "Player deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
