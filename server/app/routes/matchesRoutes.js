const express = require("express");
const router = express.Router();
const { create, getAll, getById, update, concludeMatch, firstBlood, remove } = require("../controllers/matchesController");

router.post("/match_concluded/:id", concludeMatch);
router.post("/first_blood/:id", firstBlood);
router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
