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

module.exports = { createJiraIssue, transitionJiraIssueStatus, jiraStatusTransitionIds };
