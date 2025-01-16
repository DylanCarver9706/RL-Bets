// server/middlewares/errorLogger.js
const { createAndTransitionJiraIssue } = require("../services/jiraService");

const errorLogger = async (error, req, res, next) => {
  console.error("Error occurred:", error);

  // Create a Jira issue for the error
  try {
    const summary = "Server App Error Occurred";
    const description = `
      **Error Message:** ${error.message}
      **Stack Trace:** ${error.stack}
      **Request Details:**
      - URL: ${req.url}
      - Method: ${req.method}
      - Body: ${JSON.stringify(req.body, null, 2)}
      - Headers: ${JSON.stringify(req.headers, null, 2)}
    `;
    console.log("Logging error to Jira...");
    if (process.env.ENV === "production") {
      const jiraIssueKey = await createAndTransitionJiraIssue(
        "admin",
        "admin",
        "admin",
        "Problem Report",
        summary,
        description,
        "App Error Occurred"
      );
      console.log(`Logged error as Jira issue: ${jiraIssueKey}`);
    } else {
      console.log("Error logging to Jira skipped in non-production environment");
    }
  } catch (jiraError) {
    console.error("Failed to log error to Jira:", jiraError.message);
  }

  // Send a response to the client
  res.status(error.status || 500).json({
    error: "An internal error occurred. The issue has been logged.",
    details: error.message,
  });
};

module.exports = { errorLogger };
