const express = require("express");
const router = express.Router();
const jiraController = require("../controllers/jiraController");

// Route to create a Jira issue and transition its status
router.post("/create-issue", jiraController.createIssueAndTransitionStatus);

module.exports = router;
