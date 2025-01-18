const logService = require("../services/logsService");

// Retrieve all logs
const getAllLogs = async (req, res, logError) => {
  try {
    const logs = await logService.getAllLogs();
    res.status(200).json(logs);
  } catch (error) {
    logError(error);
  }
};

// Retrieve a log by ID
const getLogById = async (req, res, logError) => {
  try {
    const log = await logService.getLogById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.status(200).json(log);
  } catch (error) {
    logError(error);
  }
};

// Create a new log
const createLog = async (req, res, logError) => {
  try {
    const result = await logService.createLog(req.body);
    res.status(201).json({
      message: "Log created successfully",
      logId: result.logId,
    });
  } catch (error) {
    logError(error);
  }
};

// Update a log by ID
const updateLogById = async (req, res, logError) => {
  try {
    await logService.updateLogById(req.params.id, req.body);
    res.status(200).json({ message: "Log updated successfully" });
  } catch (error) {
    logError(error);
  }
};

// Delete a log by ID
const deleteLogById = async (req, res, logError) => {
  try {
    await logService.deleteLogById(req.params.id);
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

// Delete all logs
const deleteAllLogs = async (req, res, logError) => {
  try {
    const result = await logService.deleteAllLogs();
    res.status(200).json({
      message: "All logs deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logError(error);
  }
};

const getUserNotifications = async (req, res, logError) => {
  try {
    const notifications = await logService.getUserNotificationLogs(req.params.id);
    res.status(200).json(notifications);
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  getAllLogs,
  getLogById,
  createLog,
  updateLogById,
  deleteLogById,
  deleteAllLogs,
  getUserNotifications,
};
