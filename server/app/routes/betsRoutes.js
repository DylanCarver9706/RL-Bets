const express = require("express");
const router = express.Router();
const betsController = require("../controllers/betsController");

router.post("/", betsController.create);
router.get("/", betsController.getAll);
router.get("/:id", betsController.getById);
router.put("/:id", betsController.update);
router.delete("/:id", betsController.remove);

module.exports = router;
