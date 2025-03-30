import { makeAuthenticatedRequest } from "./authService";

export const fetchUserNotificationLogs = async (userId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/logs/notifications/user/${userId}`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user notification logs.");
    }

    return await response.json();
  } catch (err) {
    if (process.env.ENV === "development")
      console.error("Error fetching user notification logs:", err.message);
    return [];
  }
};

export const dismissNotification = async (notificationId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/logs/${notificationId}`,
      {
        method: "PUT",
        body: JSON.stringify({ cleared: true }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to dismiss notification.");
    }

    return await response.json();
  } catch (err) {
    if (process.env.ENV === "development")
      console.error("Error dismissing notification:", err.message);
    return false;
  }
};
