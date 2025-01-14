const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

// Fetch the data tree for a given season ID
export const fetchAllSeasonsDataTree = async () => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/data-trees/season/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data tree for all seasons`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching season data tree:", err.message);
    throw err;
  }
};

// Generic function to update a document by ID
const updateDocumentById = async (endpoint, id, updateData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/${endpoint}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${endpoint} with ID: ${id}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error updating ${endpoint} with ID ${id}:`, err.message);
    throw err;
  }
};

// Update a season by ID
export const updateSeasonById = async (id, updateData) => {
  return updateDocumentById("seasons", id, updateData);
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
    const response = await fetch(`${BASE_SERVER_URL}/api/match_concluded/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update match results for match ID: ${matchId}`);
    }
    const data = await response.json();
    return data;
    } catch (err) {
    console.error(`Error updating match results for match ID ${matchId}:`, err.message);
    throw err;
    }
};

export const createSeries = async (seriesData) => {
  try {
    const response = await fetch(`${BASE_SERVER_URL}/api/series`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(seriesData),
    });

    if (!response.ok) {
      throw new Error("Failed to create series");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating series:", err.message);
    throw err;
  }
};
