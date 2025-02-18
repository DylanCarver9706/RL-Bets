import { makeAuthenticatedRequest } from "./authService";

// Add cache constants at the top of the file
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const fetchAllTournamentsDataTree = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/data-trees/tournament/all",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for all tournaments`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching tournament data tree:", err.message);
    throw err;
  }
};

export const fetchCurrentTournamentDataTree = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/data-trees/tournament/current",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for current tournament`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching current tournament data tree:", err.message);
    throw err;
  }
};

export const fetchEndedTournamentDataTree = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/data-trees/tournament/ended",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for ended tournament`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching ended tournament data tree:", err.message);
    throw err;
  }
};

export const fetchPlayers = async () => {
  try {
    // Check cache first
    const cache = localStorage.getItem("playersCache");
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    const response = await makeAuthenticatedRequest("/api/players", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all players`);
    }

    const data = await response.json();

    // Update cache
    localStorage.setItem(
      "playersCache",
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );

    return data;
  } catch (err) {
    console.error("Error fetching all players:", err.message);
    throw err;
  }
};

// Generic function to update a document by ID
const updateDocumentById = async (endpoint, id, updateData) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/${endpoint}/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${endpoint} with ID: ${id}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Error updating ${endpoint} with ID ${id}:`, err.message);
    throw err;
  }
};

// Update a tournament by ID
export const updateTournamentById = async (id, updateData) => {
  return updateDocumentById("tournaments", id, updateData);
};

// Update a series by ID
export const updateSeriesById = async (id, updateData) => {
  return updateDocumentById("series", id, updateData);
};

// Update a match by ID
export const updateMatchById = async (id, updateData) => {
  return updateDocumentById("matches", id, updateData);
};

export const updateMatchResults = async (matchId, updateData) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/matches/match_concluded/${matchId}`,
      {
        method: "POST",
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update match results for match ID: ${matchId}`
      );
    }

    return await response.json();
  } catch (err) {
    console.error(
      `Error updating match results for match ID ${matchId}:`,
      err.message
    );
    throw err;
  }
};

export const createSeries = async (seriesData) => {
  try {
    const response = await makeAuthenticatedRequest("/api/series", {
      method: "POST",
      body: JSON.stringify(seriesData),
    });

    if (!response.ok) {
      throw new Error("Failed to create series");
    }

    return await response.json();
  } catch (err) {
    console.error("Error creating series:", err.message);
    throw err;
  }
};

export const updateFirstBlood = async (matchId, updateData) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/matches/first_blood/${matchId}`,
      {
        method: "POST",
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update first blood for match ID: ${matchId}`);
    }

    return await response.json();
  } catch (err) {
    console.error(
      `Error updating first blood for match ID ${matchId}:`,
      err.message
    );
    throw err;
  }
};

export const getUsers = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/users", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching users:", err.message);
    throw err;
  }
};

export const sendEmailToUsers = async (users, subject, body) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/users/send_admin_email",
      {
        method: "POST",
        body: JSON.stringify({ users, subject, body }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send admin email.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error sending admin email:", err.message);
    throw err;
  }
};

export const validateUserIdv = async (userData) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/users/identity_verification_complete",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to validate user idv.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error validating user idv:", err.message);
    return false;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/products", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all products`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching all products:", err.message);
    throw err;
  }
};
