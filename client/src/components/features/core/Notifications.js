import React, { useState, useEffect } from "react";
import {
  fetchUserNotificationLogs,
  dismissNotification,
} from "../../../services/userService.js";
import { useUser } from "../../../contexts/UserContext.js";
import { subscribeToUpdates } from "../../../services/supabaseService.js";
import { formatDateToUserTimezone } from "../../../services/dateService.js";
import "../../../styles/components/core/Notifications.css";

const BellIcon = () => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUserNotificationLogs(user.mongoUserId);
      setNotifications(data);
    };

    fetchData();
  }, [user.mongoUserId]);

  const unreadCount = notifications.length;

  // Listen for updates from the server
  useEffect(() => {
    const subscription = subscribeToUpdates('userLogs', 'updateUserLogs', (payload) => {
      setNotifications(payload.userLogs);
    });

    return () => {
      subscription.unsubscribe();
    };
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
    <div className="notifications-container">
      <div className="bell-icon" onClick={() => setIsDropdownVisible(true)}>
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      
      {isDropdownVisible && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <button
              className="close-button"
              onClick={() => setIsDropdownVisible(false)}
            >
              ✖
            </button>
          </div>
          
          {notifications.length > 0 ? (
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li key={notification._id} className="notification-item">
                  <div className="notification-content">
                    {notification.type === "payout" && (
                      <p>{`Wager "${notification.wagerName}" paid out ${notification.awardedCredits} Credits. Congrats!`}</p>
                    )}
                    {notification.type === "welcome" && (
                      <p>{notification.message}</p>
                    )}
                    {notification.type === "info" && (
                      <p>{notification.message}</p>
                    )}
                    <span className="notification-timestamp">
                      {formatDateToUserTimezone(notification.createdAt)}
                    </span>
                  </div>
                  <button
                    className="dismiss-button"
                    onClick={() => handleDismiss(notification._id)}
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-notifications">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
