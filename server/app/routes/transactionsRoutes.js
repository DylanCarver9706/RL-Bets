const express = require("express");
const router = express.Router();
const transactionsController = require("../controllers/transactionsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// CRUD Routes
router.get("/", verifyFirebaseToken(true), transactionsController.getAllTransactions);
router.get("/:id", verifyFirebaseToken(true), transactionsController.getTransactionById);
router.get("/user/:id", verifyFirebaseToken(), transactionsController.getTransactionsByUserId);
router.post("/", verifyFirebaseToken(true), transactionsController.createTransaction);
router.put("/:id", verifyFirebaseToken(true), transactionsController.updateTransaction);
router.delete("/:id", verifyFirebaseToken(true), transactionsController.deleteTransaction);

module.exports = router;
