const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Product Routes
router.get("/", verifyFirebaseToken, productsController.getAllProducts);
router.get("/:id", verifyFirebaseToken, productsController.getProductById);
router.post("/", verifyFirebaseToken, productsController.createProduct);
router.put("/:id", verifyFirebaseToken, productsController.updateProduct);
router.delete("/:id", verifyFirebaseToken, productsController.deleteProduct);

module.exports = router;
