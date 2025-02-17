const express = require("express");
const router = express.Router();
const betsController = require("../controllers/betsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.post("/", verifyFirebaseToken(), betsController.create);
router.get("/", verifyFirebaseToken(true), betsController.getAll);
router.get("/:id", verifyFirebaseToken(true), betsController.getById);
router.put("/:id", verifyFirebaseToken(true), betsController.update);
router.delete("/:id", verifyFirebaseToken(true), betsController.remove);

module.exports = router;
