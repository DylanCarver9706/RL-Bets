const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Product Routes
router.get("/", verifyFirebaseToken(), productsController.getAllProducts);
router.get("/:id", verifyFirebaseToken(true), productsController.getProductById);
router.post("/", verifyFirebaseToken(true), productsController.createProduct);
router.put("/:id", verifyFirebaseToken(true), productsController.updateProduct);
router.delete("/:id", verifyFirebaseToken(true), productsController.deleteProduct);

module.exports = router;
