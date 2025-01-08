const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

export const createJiraIssue = async (userName, userEmail, mongoUserId, issueType, summary, description, status) => {
    try {

      const response = await fetch(`${BASE_SERVER_URL}/api/jira/create-issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName, userEmail, mongoUserId, issueType, summary, description, status }),
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
  