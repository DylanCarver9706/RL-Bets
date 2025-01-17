const leaderboardService = require("../services/leaderboardService");

const getAllLeaderboards = async (req, res, logError) => {
  try {
    const leaderboards = await leaderboardService.getAllLeaderboards();
    res.status(200).json(leaderboards);
  } catch (error) {
    logError(error);
  }
};

const getLeaderboardById = async (req, res, logError) => {
  try {
    const leaderboard = await leaderboardService.getLeaderboardById(
      req.params.id
    );
    if (!leaderboard) {
      return res.status(404).json({ error: "Leaderboard not found" });
    }
    res.status(200).json(leaderboard);
  } catch (error) {
    logError(error);
  }
};

const createLeaderboard = async (req, res, logError) => {
  try {
    const newLeaderboard = await leaderboardService.createLeaderboard(
      req.body
    );
    res.status(201).json(newLeaderboard);
  } catch (error) {
    logError(error);
  }
};

const updateLeaderboard = async (req, res, logError) => {
  try {
    const updatedLeaderboard = await leaderboardService.updateLeaderboard(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedLeaderboard);
  } catch (error) {
    logError(error);
  }
};

const deleteLeaderboard = async (req, res, logError) => {
  try {
    await leaderboardService.deleteLeaderboard(req.params.id);
    res.status(200).json({ message: "Leaderboard deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

const getCurrentLeaderboard = async (req, res, logError) => {
  try {
    const leaderboard = await leaderboardService.getCurrentLeaderboard();
    res.status(200).json(leaderboard);
  } catch (error) {
    logError(error);
  }
};

const getLifetimeLeaderboard = async (req, res, logError) => {
    try {
      const leaderboard = await leaderboardService.getLifetimeLeaderboard();
      res.status(200).json(leaderboard);
    } catch (error) {
      logError(error);
    }
  };

module.exports = {
  getAllLeaderboards,
  getLeaderboardById,
  createLeaderboard,
  updateLeaderboard,
  deleteLeaderboard,
  getCurrentLeaderboard,
  getLifetimeLeaderboard,
};
