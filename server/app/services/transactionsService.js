const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { broadcastUpdate } = require("../middlewares/supabaseAdmin");

const getAllTransactions = async () => {
  return await collections.transactionsCollection.find().toArray();
};

const getTransactionById = async (id) => {
  return await collections.transactionsCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const createTransaction = async (transactionData) => {
  // Create a new transaction document
  const newTransaction = await createMongoDocument(
    collections.transactionsCollection,
    transactionData,
    true
  );

  // Emit real-time updates
  await broadcastUpdate("transactions", "newTransaction", {
    transaction: newTransaction,
  });

  return newTransaction;
};

const updateTransaction = async (id, updateData) => {
  // Update the transaction document
  await updateMongoDocument(collections.transactionsCollection, id, {
    $set: updateData,
  });

  // Fetch the updated transaction
  const updatedTransaction = await collections.transactionsCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });

  // Emit updates
  await broadcastUpdate("transactions", "updateTransaction", {
    transaction: updatedTransaction,
  });

  return updatedTransaction;
};

const deleteTransaction = async (id) => {
  // Delete the transaction document
  const result = await collections.transactionsCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });

  if (result.deletedCount === 0) {
    throw new Error("Transaction not found");
  }

  // Emit real-time updates
  await broadcastUpdate("transactions", "deleteTransaction", {
    transactionId: id,
  });
};

const getUserTransactions = async (userId) => {
  try {
    // Fetch all transactions for the user
    const transactions = await collections.transactionsCollection
      .find({ user: ObjectId.createFromHexString(userId) })
      .toArray();

    // Handle case where no transactions are found
    if (!transactions || transactions.length === 0) {
      return []; // Return an empty array if no transactions exist
    }

    // Sort transactions by `createdAt` in descending order
    return transactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (error) {
    console.error("Error fetching user transactions:", error.message);
    throw new Error("Failed to fetch user transactions");
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getUserTransactions,
};
