const { ObjectId } = require("mongodb");

const getTimestamp = () => {
  const now = new Date();

  // Get the offset for CST in minutes (-360 minutes for CST)
  const offset = -parseInt(process.env.UTC_TIMEZONE_OFFSET) * 60; // CST offset is UTC-6
  const localDate = new Date(now.getTime() + offset * 60 * 1000);

  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(localDate.getUTCDate()).padStart(2, "0");
  const hour = String(localDate.getUTCHours()).padStart(2, "0");
  const minute = String(localDate.getUTCMinutes()).padStart(2, "0");
  const second = String(localDate.getUTCSeconds()).padStart(2, "0");
  // console.log(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
};

/**
 * Helper function to generate aliasId from MongoDB _id
 * @param {ObjectId} mongoId - The MongoDB ObjectId
 * @returns {string} - Base64 encoded aliasId
 */
const generateAliasId = (mongoId) => {
  if (!ObjectId.isValid(mongoId)) {
    throw new Error("Invalid MongoDB ObjectId");
  }
  return Buffer.from(mongoId.toString()).toString("base64");
};

/**
 * Helper function to decode aliasId back to MongoDB _id
 * @param {string} aliasId - The Base64 encoded aliasId
 * @returns {ObjectId} - The MongoDB ObjectId
 */
const decodeAliasId = (aliasId) => {
  try {
    const decoded = Buffer.from(aliasId, "base64").toString("utf-8");
    if (!ObjectId.isValid(decoded)) {
      throw new Error("Decoded aliasId is not a valid MongoDB ObjectId");
    }
    return ObjectId.createFromHexString(decoded);
  } catch (error) {
    throw new Error("Failed to decode aliasId: " + error.message);
  }
};

module.exports = { getTimestamp, generateAliasId, decodeAliasId };
