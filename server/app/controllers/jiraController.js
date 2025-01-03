const {
  createJiraIssue,
  transitionJiraIssueStatus,
  jiraStatusTransitionIds,
} = require("../services/jiraService");

const createIssueAndTransitionStatus = async (req, res, logError) => {
  const {
    userName,
    userEmail,
    mongoUserId,
    issueType,
    summary,
    description,
    status,
  } = req.body;

  if (!userName || !userEmail) {
    return res.status(400).json({ error: "User name and email are required." });
  }

  try {
    const descriptionHeader = `User: ${userName}\nEmail: ${userEmail}\nMongoId: ${mongoUserId}`;
    const jiraDescription = description
      ? `${descriptionHeader}\n\nUser Submission:\n${description}`
      : descriptionHeader;

    const jiraIssue = await createJiraIssue(
      summary,
      jiraDescription,
      issueType
    );

    if (status && jiraStatusTransitionIds[status]) {
      await transitionJiraIssueStatus(
        jiraIssue.key,
        jiraStatusTransitionIds[status]
      );
    }

    res.status(200).json({
      message: "Jira issue created and status transitioned successfully.",
      issueKey: jiraIssue.key,
    });
  } catch (error) {
    logError(error);
  }
};

module.exports = { createIssueAndTransitionStatus };
