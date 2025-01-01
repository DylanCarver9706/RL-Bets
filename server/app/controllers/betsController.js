const {
  createBet,
  getAllBets,
  getBetById,
  updateBet,
  deleteBet,
} = require("../services/betsService");
const { createLog } = require("../services/logsService");

const create = async (req, res) => {
  try {
    const result = await createBet(req.body);
    await createLog({ ...req.body, type: "Bet Created", betId: result.betId });
    res.status(201).json({ message: "Bet created successfully", ...result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create bet", details: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const bets = await getAllBets();
    res.status(200).json(bets);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch bets", details: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const bet = await getBetById(req.params.id);
    if (!bet) return res.status(404).json({ error: "Bet not found" });
    res.status(200).json(bet);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch bet", details: error.message });
  }
};

const update = async (req, res) => {
  try {
    await updateBet(req.params.id, req.body);
    res.status(200).json({ message: "Bet updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update bet", details: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deleteBet(req.params.id);
    res.status(200).json({ message: "Bet deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete bet", details: error.message });
  }
};

module.exports = { create, getAll, getById, update, remove };
