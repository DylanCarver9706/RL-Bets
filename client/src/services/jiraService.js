import { makeAuthenticatedRequest } from "./authService";

export const createJiraIssue = async (
  userName,
  userEmail,
  mongoUserId,
  issueType,
  summary,
  description,
  status
) => {
  try {
    const response = await makeAuthenticatedRequest("/api/jira/create-issue", {
      method: "POST",
      body: JSON.stringify({
        userName,
        userEmail,
        mongoUserId,
        issueType,
        summary,
        description,
        status,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create Jira issue.");
    }

    return response;
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error("Failed to create Jira issue.");
  }
};
