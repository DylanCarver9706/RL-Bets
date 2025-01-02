const express = require("express");
const router = express.Router();
const { createIssueAndTransitionStatus } = require("../controllers/jiraController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.post("/create-issue", verifyFirebaseToken, createIssueAndTransitionStatus);

module.exports = router;
