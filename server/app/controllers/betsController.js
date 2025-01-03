const {
  createBet,
  getAllBets,
  getBetById,
  updateBet,
  deleteBet,
} = require("../services/betsService");
const { createLog } = require("../services/logsService");

const create = async (req, res, logError) => {
  try {
    const result = await createBet(req.body);
    await createLog({ ...req.body, type: "Bet Created", betId: result.betId });
    res.status(201).json({ message: "Bet created successfully", ...result });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const bets = await getAllBets();
    res.status(200).json(bets);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const bet = await getBetById(req.params.id);
    if (!bet) return res.status(404).json({ error: "Bet not found" });
    res.status(200).json(bet);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateBet(req.params.id, req.body);
    res.status(200).json({ message: "Bet updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteBet(req.params.id);
    res.status(200).json({ message: "Bet deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
