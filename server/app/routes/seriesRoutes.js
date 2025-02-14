const express = require("express");
const router = express.Router();
const seriesController = require("../controllers/seriesController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Series Routes
router.post("/", verifyFirebaseToken, seriesController.create);
router.get("/", verifyFirebaseToken, seriesController.getAll);
router.get("/:id", verifyFirebaseToken, seriesController.getById);
router.put("/:id", verifyFirebaseToken, seriesController.update);
router.delete("/:id", verifyFirebaseToken, seriesController.remove);

module.exports = router;

