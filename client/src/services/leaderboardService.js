import { makeAuthenticatedRequest } from "./authService";

export const fetchCurrentLeaderboard = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/leaderboards/current",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data for current leaderboard`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching current leaderboard data:", err.message);
    throw err;
  }
};

export const fetchCurrentTournament = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/tournaments/current",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data for current tournaments`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching current tournaments data:", err.message);
    throw err;
  }
};

export const fetchLifetimeLeaderboard = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/leaderboards/lifetime",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data for lifetime leaderboard`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching lifetime leaderboard data:", err.message);
    throw err;
  }
};
