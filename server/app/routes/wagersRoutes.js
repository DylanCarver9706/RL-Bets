const express = require("express");
const router = express.Router();
const wagersController = require("../controllers/wagersController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/", verifyFirebaseToken(), wagersController.getAll);
router.get("/:id", verifyFirebaseToken(true), wagersController.getById);
router.post("/", verifyFirebaseToken(true), wagersController.create);
router.put("/:id", verifyFirebaseToken(true), wagersController.update);
router.delete("/:id", verifyFirebaseToken(true), wagersController.remove);
router.delete("/", verifyFirebaseToken(true), wagersController.removeAll);

module.exports = router;
