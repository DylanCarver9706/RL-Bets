const express = require("express");
const router = express.Router();
const { createIssueAndTransitionStatus } = require("../controllers/jiraController");

router.post("/create-issue", createIssueAndTransitionStatus);

module.exports = router;
