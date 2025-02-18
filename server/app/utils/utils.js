const { ObjectId } = require("mongodb");

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

module.exports = { generateAliasId, decodeAliasId };
