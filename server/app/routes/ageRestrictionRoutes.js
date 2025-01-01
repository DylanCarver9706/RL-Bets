const express = require("express");
const router = express.Router();
const { handleCheckLegalAge } = require("../controllers/ageRestrictionController");

router.post("/check-legal-age", handleCheckLegalAge);

module.exports = router;
