const express = require("express");
const router = express.Router();
const transactionsController = require("../controllers/transactionsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// CRUD Routes
router.get("/", verifyFirebaseToken, transactionsController.getAllTransactions);
router.get("/:id", verifyFirebaseToken, transactionsController.getTransactionById);
router.get("/user/:id", verifyFirebaseToken, transactionsController.getTransactionsByUserId);
router.post("/", verifyFirebaseToken, transactionsController.createTransaction);
router.put("/:id", verifyFirebaseToken, transactionsController.updateTransaction);
router.delete("/:id", verifyFirebaseToken, transactionsController.deleteTransaction);

module.exports = router;
