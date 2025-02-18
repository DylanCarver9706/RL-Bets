import React, { useEffect, useState } from "react";
import socket from "../../../services/socketService";
import { fetchLifetimeLeaderboard } from "../../../services/leaderboardService";

const LifetimeLeaderboard = () => {
  const [sortedUsers, setSortedUsers] = useState([]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await fetchLifetimeLeaderboard();
        setSortedUsers(usersResponse);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    // Listen for the 'updateUser' event from the server
    socket.on("updateUsers", (updatedUsers) => {
      setSortedUsers(updatedUsers);
    });

    // Cleanup WebSocket connection on unmount
    return () => socket.disconnect();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Rankings by Lifetime Earned Credits</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Lifetime Earned Credits</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, index) => (
            <tr key={index} style={styles.tr}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{user.name}</td>
              <td style={styles.td}>{user.lifetimeEarnedCredits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LifetimeLeaderboard;

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
