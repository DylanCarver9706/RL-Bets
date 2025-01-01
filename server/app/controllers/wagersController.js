const {
  getAllWagers,
  getWagerById,
  createWager,
  updateWager,
  deleteWager,
  deleteAllWagers,
} = require("../services/wagersService");
const { createLog } = require("../services/logsService");

const getAll = async (req, res) => {
  try {
    const wagers = await getAllWagers();
    res.status(200).json(wagers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch wagers", details: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const wager = await getWagerById(req.params.id);
    res.status(200).json(wager);
  } catch (error) {
    res
      .status(404)
      .json({ error: "Failed to fetch wager", details: error.message });
  }
};

const create = async (req, res) => {
  try {
    const wagerId = await createWager(req.body);
    await createLog({ ...req.body, type: "Wager Created", wagerId });
    res.status(201).json({ message: "Wager created successfully", wagerId });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create wager", details: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updatedWager = await updateWager(req.params.id, req.body);
    res.status(200).json(updatedWager);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update wager", details: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deleteWager(req.params.id);
    res.status(200).json({ message: "Wager deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete wager", details: error.message });
  }
};

const removeAll = async (req, res) => {
  try {
    await deleteAllWagers();
    res.status(200).json({ message: "All wagers deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete wagers", details: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, removeAll };
