const express = require("express");
const router = express.Router();
const jiraController = require("../controllers/jiraController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Route to create a Jira issue and transition its status
router.post("/create-issue", verifyFirebaseToken, jiraController.createIssueAndTransitionStatus);

module.exports = router;
