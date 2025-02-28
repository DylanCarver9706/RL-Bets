import { makeAuthenticatedRequest } from "./authService";

// Add cache constants at the top of the file
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const fetchWagers = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/wagers", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wagers");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching wagers:", err.message);
    throw err;
  }
};

// Create wager
export const createWager = async (wagerData) => {
  try {
    const response = await makeAuthenticatedRequest("/api/wagers", {
      method: "POST",
      body: JSON.stringify(wagerData),
    });

    if (!response.ok) {
      throw new Error("Failed to create wager");
    }

    return await response.json();
  } catch (err) {
    console.error("Error creating wager:", err.message);
    throw err;
  }
};

// Create bet
export const createBet = async (betData) => {
  try {
    const response = await makeAuthenticatedRequest("/api/bets", {
      method: "POST",
      body: JSON.stringify(betData),
    });

    if (!response.ok) {
      throw new Error("Failed to create bet");
    }

    return await response.json();
  } catch (err) {
    console.error("Error creating bet:", err.message);
    throw err;
  }
};

// Updated fetchTeams function
export const fetchTeams = async () => {
  try {
    // Check cache first
    const cache = localStorage.getItem("teamsCache");
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const response = await makeAuthenticatedRequest("/api/teams/with_players", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teams`);
    }

    const data = await response.json();

    // Update cache
    localStorage.setItem(
      "teamsCache",
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );

    return data;
  } catch (err) {
    console.error("Error fetching teams:", err.message);
    throw err;
  }
};

export const fetchBettableObjects = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/data-trees/bettable",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching data tree:", err.message);
    throw err;
  }
};

export const capitalize = (str) => {
  if (!str) return ""; // Handle empty or null strings
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
