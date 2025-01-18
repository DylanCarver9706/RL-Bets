const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { getSocketIo } = require("../middlewares/socketIO");

const getAllLogs = async () => {
  try {
    return await collections.logsCollection.find().toArray();
  } catch (error) {
    throw new Error("Failed to retrieve logs: " + error.message);
  }
};

const getLogById = async (logId) => {
  try {
    return await collections.logsCollection.findOne({
      _id: ObjectId.createFromHexString(logId),
    });
  } catch (error) {
    throw new Error("Failed to retrieve log: " + error.message);
  }
};

const createLog = async (logData) => {
  try {
    
    if (logData.user) {
      logData = {
        ...logData,
        user: ObjectId.createFromHexString(logData.user),
      };
    }

    const result = await createMongoDocument(
      collections.logsCollection,
      logData
    );

    // Emit updated logs via WebSocket
    const logs = await getAllLogs();
    const io = getSocketIo();
    io.emit("updatedLogs", logs);

    return { logId: result.insertedId };
  } catch (error) {
    throw new Error("Failed to create log: " + error.message);
  }
};

const createAdminLog = async (logData) => {
  try {
    const result = await createMongoDocument(
      collections.logsCollection,
      logData = {
        ...logData,
        logType: "Admin Notification"
      }
    );

    // Emit updated logs via WebSocket
    const logs = await getAllLogs();
    const io = getSocketIo();
    io.emit("updateLogs", logs);

    return { logId: result.insertedId };
  } catch (error) {
    throw new Error("Failed to create log: " + error.message);
  }
};

const createUserNotificationLog = async (logData) => {
  try {
    const result = await createMongoDocument(
      collections.logsCollection,
      logData = {
        ...logData,
        logType: "User Notification",
        cleared: false,
        user: ObjectId.createFromHexString(logData.user),
      }
    );

    // Emit updated logs via WebSocket
    const logs = await getUserNotificationLogs(logData.user.toString());
    const io = getSocketIo();
    io.emit("updateUserLogs", logs);

    return { logId: result.insertedId };
  } catch (error) {
    throw new Error("Failed to create log: " + error.message);
  }
};

const updateLogById = async (logId, updateData) => {
  try {
    await updateMongoDocument(collections.logsCollection, logId, {
      $set: updateData,
    });
  } catch (error) {
    throw new Error("Failed to update log: " + error.message);
  }
};

const deleteLogById = async (logId) => {
  try {
    const result = await collections.logsCollection.deleteOne({
      _id: ObjectId.createFromHexString(logId),
    });
    if (result.deletedCount === 0) throw new Error("Log not found");
  } catch (error) {
    throw new Error("Failed to delete log: " + error.message);
  }
};

const deleteAllLogs = async () => {
  try {
    return await collections.logsCollection.deleteMany({});
  } catch (error) {
    throw new Error("Failed to delete all logs: " + error.message);
  }
};

module.exports = {
  getAllLogs,
  getLogById,
  createLog,
  updateLogById,
  deleteLogById,
  deleteAllLogs,
  createUserNotificationLog,
  createAdminLog,
};
