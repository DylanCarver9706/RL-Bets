const logService = require("../services/logsService");

// Retrieve all logs
const getAllLogs = async (req, res) => {
  try {
    const logs = await logService.getAllLogs();
    res.status(200).json(logs);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch logs", details: err.message });
  }
};

// Retrieve a log by ID
const getLogById = async (req, res) => {
  try {
    const log = await logService.getLogById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.status(200).json(log);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch log", details: err.message });
  }
};

// Create a new log
const createLog = async (req, res) => {
  try {
    const result = await logService.createLog(req.body);
    res.status(201).json({
      message: "Log created successfully",
      logId: result.logId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create log", details: err.message });
  }
};

// Update a log by ID
const updateLogById = async (req, res) => {
  try {
    await logService.updateLogById(req.params.id, req.body);
    res.status(200).json({ message: "Log updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update log", details: err.message });
  }
};

// Delete a log by ID
const deleteLogById = async (req, res) => {
  try {
    await logService.deleteLogById(req.params.id);
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete log", details: err.message });
  }
};

// Delete all logs
const deleteAllLogs = async (req, res) => {
  try {
    const result = await logService.deleteAllLogs();
    res.status(200).json({
      message: "All logs deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete all logs", details: err.message });
  }
};

module.exports = {
  getAllLogs,
  getLogById,
  createLog,
  updateLogById,
  deleteLogById,
  deleteAllLogs,
};
