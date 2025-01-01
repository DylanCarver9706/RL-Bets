const express = require("express");
const router = express.Router();
const { create, getAll, getById, update, remove } = require("../controllers/seriesController");

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
