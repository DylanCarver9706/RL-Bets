const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");

const getAllLogs = async () => {
  try {
    return await collections.logsCollection.find().toArray();
  } catch (err) {
    throw new Error("Failed to retrieve logs: " + err.message);
  }
};

const getLogById = async (logId) => {
  try {
    return await collections.logsCollection.findOne({ _id: ObjectId.createFromHexString(logId) });
  } catch (err) {
    throw new Error("Failed to retrieve log: " + err.message);
  }
};

const createLog = async (logData, io) => {
  try {
    const result = await createMongoDocument(collections.logsCollection, logData);

    // Emit updated logs via WebSocket
    const logs = await getAllLogs();
    io.emit("updatedLogs", logs);

    return { logId: result.insertedId };
  } catch (err) {
    throw new Error("Failed to create log: " + err.message);
  }
};

const updateLogById = async (logId, updateData) => {
  try {
    await updateMongoDocument(
      collections.logsCollection,
      logId,
      { $set: updateData }
    );
  } catch (err) {
    throw new Error("Failed to update log: " + err.message);
  }
};

const deleteLogById = async (logId) => {
  try {
    const result = await collections.logsCollection.deleteOne({ _id: ObjectId.createFromHexString(logId) });
    if (result.deletedCount === 0) throw new Error("Log not found");
  } catch (err) {
    throw new Error("Failed to delete log: " + err.message);
  }
};

const deleteAllLogs = async () => {
  try {
    return await collections.logsCollection.deleteMany({});
  } catch (err) {
    throw new Error("Failed to delete all logs: " + err.message);
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
