import React, { useState, useEffect } from "react";
import {
  fetchUserNotificationLogs,
  dismissNotification,
  formatDateToUserTimezone,
} from "../services/userService";
import { useUser } from "../context/UserContext.js";
import socket from "../services/socket.js";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUserNotificationLogs(user.mongoUserId);
      console.log("Fetched data:", data);
      console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
      setNotifications(data);
    };

    fetchData();
  }, [user.mongoUserId]);

  const unreadCount = notifications.length;

  // Listen for updates from the server
  useEffect(() => {
    socket.on("updateUserLogs", (updatedUserLogs) => {
      setNotifications(updatedUserLogs);
    });

    // Cleanup listener on unmount
    return () => {
      socket.off("wagersUpdate");
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user?.mongoUserId]);

  const handleDismiss = async (notificationId) => {
    try {
      await dismissNotification(notificationId); // Call API to dismiss notification
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId)); // Update local state
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  return (
    <div
      style={styles.container}
    >
      <div
        style={styles.bellIcon}
        onClick={() => setIsDropdownVisible(true)}
      >
        <span role="img" aria-label="Notifications">
          🔔
        </span>
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </div>
      {isDropdownVisible && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h3>Notifications</h3>
            <button onClick={() => setIsDropdownVisible(false)} style={styles.closeButton}>
              ✖
            </button>
          </div>
          {notifications.length > 0 ? (
            <ul style={styles.notificationList}>
              {notifications.map((notification) => (
                <li key={notification.id} style={styles.notificationItem}>
                  {notification.type === "payout" && (
                    <p>{`Wager "${notification.wagerName}" paid out ${notification.awardedCredits} Credits. Congrats!`}</p>
                  )}
                  <span style={styles.timestamp}>
                    {formatDateToUserTimezone(notification.createdAt)}
                    {/* {notification.createdAt} */}
                  </span>
                  <button
                    onClick={() => handleDismiss(notification._id)}
                    style={styles.dismissButton}
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.noNotifications}>No notifications</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;

const styles = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  bellIcon: {
    position: "relative",
    cursor: "pointer",
    fontSize: "20px",
    color: "#fff",
  },
  badge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    backgroundColor: "red",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "12px",
  },
  dropdown: {
    position: "absolute",
    top: "120%",
    right: 0,
    backgroundColor: "#444",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    width: "300px",
    padding: "10px",
    color: "#fff",
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #666",
    paddingBottom: "5px",
    marginBottom: "10px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  notificationList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  notificationItem: {
    borderBottom: "1px solid #666",
    padding: "10px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    display: "block",
    fontSize: "12px",
    color: "#aaa",
    marginTop: "5px",
  },
  noNotifications: {
    textAlign: "center",
    color: "#aaa",
  },
  dismissButton: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    marginLeft: "10px",
  },
};
