import React, { useEffect, useState } from "react";
import socket from "../services/socket";
import { fetchCurrentLeaderboard } from "../services/leaderboardService";

const CurrentTournamentLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState(null); // Initialize as null

  // Fetch leaderboard on component mount
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const leaderboardData = await fetchCurrentLeaderboard();
        setLeaderboardData(leaderboardData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Fetch leaderboard on WebSocket update
  useEffect(() => {
    // Listen for the 'updateLeaderboard' event from the server
    socket.on("updateLeaderboard", (updatedLeaderboard) => {
      setLeaderboardData(updatedLeaderboard);
    });

    // Cleanup WebSocket connection on unmount
    return () => socket.disconnect();
  }, []);

  // Ensure leaderboardData is loaded and has a users array
  if (!leaderboardData || !Array.isArray(leaderboardData.users)) {
    return <p>No Active Tournaments At This Time</p>;
  }

  return (
    <div style={styles.container}>
      <div>
        <h2 style={styles.header}>
          User Rankings by Earned Credits for "{leaderboardData.name}"
        </h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Earned Credits</th>
              <th style={styles.th}>Reward</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.users.map((user, index) => (
              <tr key={index} style={styles.tr}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>
                  {parseFloat(user.earnedCredits).toFixed(4)}
                </td>
                <td style={styles.td}>{leaderboardData.rewards[index + 1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentTournamentLeaderboard;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  header: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #ccc",
    padding: "10px",
    backgroundColor: "#333",
    color: "white",
  },
  tr: {
    borderBottom: "1px solid #ccc",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ccc",
    textAlign: "center",
  },
};
