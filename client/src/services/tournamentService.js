import { makeAuthenticatedRequest } from "./authService";

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
    if (process.env.ENV === "development")
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
    if (process.env.ENV === "development")
      console.error(
        "Error fetching current tournament data tree:",
        err.message
      );
    throw err;
  }
};

export const updateTournamentById = async (id, updateData) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update tournament with ID: ${id}`);
    }

    return await response.json();
  } catch (err) {
    if (process.env.ENV === "development")
      console.error(`Error updating tournament with ID ${id}:`, err.message);
    throw err;
  }
};
