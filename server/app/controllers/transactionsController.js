const transactionsService = require("../services/transactionsService");

const getAllTransactions = async (req, res, logError) => {
  try {
    const transactions = await transactionsService.getAllTransactions();
    res.status(200).json(transactions);
  } catch (error) {
    logError(error);
  }
};

const getTransactionById = async (req, res, logError) => {
  try {
    const transaction = await transactionsService.getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    logError(error);
  }
};

const createTransaction = async (req, res, logError) => {
  try {
    const newTransaction = await transactionsService.createTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (error) {
    logError(error);
  }
};

const updateTransaction = async (req, res, logError) => {
  try {
    const updatedTransaction = await transactionsService.updateTransaction(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedTransaction);
  } catch (error) {
    logError(error);
  }
};

const deleteTransaction = async (req, res, logError) => {
  try {
    await transactionsService.deleteTransaction(req.params.id);
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

const getTransactionsByUserId = async (req, res, logError) => {
  try {
    const transactions = await transactionsService.getUserTransactions(req.params.id);
    res.status(200).json(transactions);
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByUserId,
};
