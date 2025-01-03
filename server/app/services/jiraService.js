const fetch = require("node-fetch");

const jiraStatusTransitionIds = {
  "Requests For Email Change": 9,
  "Beta Tester Feedback - Problem Reports": 4,
  "Beta Tester Feedback - Enhancement Requests": 3,
  "BETA TESTER FEEDBACK - GENERAL": 14,
  "IDV Failed": 15,
  "App Error Occurred": 16,
};

const getAuthorizationHeader = () => {
  const credentials = `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN_PART_1}=${process.env.JIRA_API_TOKEN_PART_2}`;
  return `Basic ${btoa(credentials)}`;
};

const transitionJiraIssueStatus = async (jiraIssueKey, transitionId) => {
  const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${jiraIssueKey}/transitions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transition: { id: transitionId } }),
  });

  if (!response.ok) {
    throw new Error(`Failed to transition Jira issue: ${response.statusText}`);
  }
};

const createJiraIssue = async (summary, description, issueType) => {
  const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: process.env.JIRA_PROJECT_KEY },
        summary,
        description: {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text: description }] }],
        },
        issuetype: { name: issueType },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create Jira issue: ${errorData.errorMessages.join(", ")}`);
  }

  return response.json();
};

const createAndTransitionJiraIssue = async (userName, userEmail, mongoUserId, issueType, summary, description, status) => {
  try {
    // Construct the detailed description
    const descriptionHeader = `User: ${userName}\nEmail: ${userEmail}\nMongoId: ${mongoUserId}`;
    const jiraDescription = description
      ? `${descriptionHeader}\n\nUser Submission:\n${description}`
      : descriptionHeader;

    // Step 1: Create the Jira issue
    console.log("Creating Jira issue...");
    const jiraIssue = await createJiraIssue(summary, jiraDescription, issueType);
    console.log(`Jira issue created successfully: ${jiraIssue.key}`);

    // Step 2: Transition the Jira issue's status if applicable
    if (status && jiraStatusTransitionIds[status]) {
      console.log(`Transitioning Jira issue status to: ${status} (ID: ${jiraStatusTransitionIds[status]})`);
      await transitionJiraIssueStatus(jiraIssue.key, jiraStatusTransitionIds[status]);
      console.log("Jira issue status transitioned successfully.");
    } else {
      console.log("No status transition required for this issue.");
    }

    // Return the Jira issue key for further use
    return jiraIssue.key;
  } catch (error) {
    console.error("Error creating or transitioning Jira issue:", error.message);
    throw error;
  }
};

module.exports = { createJiraIssue, transitionJiraIssueStatus, createAndTransitionJiraIssue, jiraStatusTransitionIds };
