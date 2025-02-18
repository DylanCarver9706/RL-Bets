import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { getLogs } from "../../../services/userService";

let BASE_SERVER_URL;
if (process.env.REACT_APP_ENV === "production") {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_PROD_SERVER_URL;
} else {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_DEV_SERVER_URL;
}

const Log = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const socket = io(BASE_SERVER_URL);

    const fetchLogs = async () => {
      try {
        const fetchedLogs = await getLogs();
        setLogs(fetchedLogs.reverse());
      } catch (error) {
        console.error("Error fetching logs:", error.message);
      }
    };

    fetchLogs();

    socket.on("updateLogs", (updatedLogs) => {
      setLogs(updatedLogs.reverse() || []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Application Logs</h2>
      <ul style={styles.wagerList}>
        {logs.length === 0 ? (
          <p>No log events available.</p>
        ) : (
          logs.map((log, index) => (
            <li key={index} style={styles.wagerItem}>
              {Object.entries(log).map(([key, value]) => (
                <p key={key} style={styles.logField}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Log;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#ffffff",
  },
  wagerList: {
    listStyle: "none",
    padding: 0,
  },
  wagerItem: {
    marginBottom: "15px",
    backgroundColor: "#4f4b4b",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
  },
  logField: {
    margin: "5px 0",
    color: "#ffffff",
  },
};
