const {
  getAllWagers,
  getWagerById,
  createWager,
  updateWager,
  deleteWager,
  deleteAllWagers,
} = require("../services/wagersService");
const { createAdminLog } = require("../services/logsService");

const getAll = async (req, res, logError) => {
  try {
    const wagers = await getAllWagers();
    res.status(200).json(wagers);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const wager = await getWagerById(req.params.id);
    res.status(200).json(wager);
  } catch (error) {
    logError(error);
  }
};

const create = async (req, res, logError) => {
  try {
    const wagerId = await createWager(req.body);
    await createAdminLog({ ...req.body, type: "Wager Created", wagerId });
    res.status(201).json({ message: "Wager created successfully", wagerId });
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    const updatedWager = await updateWager(req.params.id, req.body);
    res.status(200).json(updatedWager);
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteWager(req.params.id);
    res.status(200).json({ message: "Wager deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

const removeAll = async (req, res, logError) => {
  try {
    await deleteAllWagers();
    res.status(200).json({ message: "All wagers deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { getAll, getById, create, update, remove, removeAll };
