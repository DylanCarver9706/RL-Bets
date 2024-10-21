import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getUsers } from '../services/userService';

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

const Leaderboard = () => {
  const [sortedUsers, setSortedUsers] = useState([]);

  // Initialize the socket connection
  const socket = io(BASE_SERVER_URL); // Adjust the URL if needed

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await getUsers();
        setSortedUsers(getSortedUsers(usersResponse));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    // Listen for the 'updateUser' event from the server
    socket.on("updateUsers", (updatedUsers) => {
        setSortedUsers(getSortedUsers(updatedUsers));
    })
    
    // Cleanup WebSocket connection on unmount
    return () => socket.disconnect();

  }, []);

  // Function to sort users based on earnedCredits in descending order
  const getSortedUsers = (users) => {
    return users.sort((a, b) => b.earnedCredits - a.earnedCredits);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Rankings by Earned Credits</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Earned Credits</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, index) => (
            <tr key={user._id} style={styles.tr}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{user.name}</td>
              <td style={styles.td}>{user.earnedCredits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#635d5d',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  header: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    border: '1px solid #ccc',
    padding: '10px',
    backgroundColor: '#333',
    color: 'white',
  },
  tr: {
    borderBottom: '1px solid #ccc',
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #ccc',
    textAlign: 'center',
  },
};
