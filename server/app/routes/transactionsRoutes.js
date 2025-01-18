const express = require("express");
const router = express.Router();
const transactionsController = require("../controllers/transactionsController");

// CRUD Routes
router.get("/", transactionsController.getAllTransactions);
router.get("/:id", transactionsController.getTransactionById);
router.get("/user/:id", transactionsController.getTransactionsByUserId);
router.post("/", transactionsController.createTransaction);
router.put("/:id", transactionsController.updateTransaction);
router.delete("/:id", transactionsController.deleteTransaction);

module.exports = router;
