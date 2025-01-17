import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import socket from "../services/socket.js";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [hovered, setHovered] = useState(false);

  // Listen for updates from the server
  useEffect(() => {
    socket.on("updateUser", (updateUser) => {
      if (updateUser._id === user.mongoUserId) {
        setUser({ ...user, credits: updateUser.credits });
      }
    });

    // Cleanup listener on unmount
    return () => {
      socket.off("wagersUpdate");
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user?.mongoUserId]);

  if (!user) {
    return null; // Hide navbar if no user is logged in
  }

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.brand}>
        <Link to="/" style={styles.link}>
          RLBets.com
        </Link>
      </h2>
      <div style={styles.navLinks}>
        <Link to="/Wagers" style={styles.link}>
          Wagers
        </Link>
        <Link to="/Profile" style={styles.link}>
          Profile
        </Link>
        <Link to="/Schedule" style={styles.link}>
          Schedule
        </Link>
        <div
          style={styles.dropdownContainer}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setHovered(false)}
        >
          <span style={styles.link}>Leaderboards</span>
          {hovered && (
            <div style={styles.dropdownMenu}>
              <Link to="/Lifetime-Leaderboard" style={styles.dropdownLink}>
                Lifetime Leaderboard
              </Link>
              <Link to="/Tournament-Leaderboard" style={styles.dropdownLink}>
                Tournament Leaderboard
              </Link>
            </div>
          )}
        </div>
        <Link to="/Settings" style={styles.link}>
          Settings
        </Link>
        {user.userType === "admin" && (
          <>
            <Link to="/Admin" style={styles.link}>
              Admin
            </Link>
            <Link to="/Log" style={styles.link}>
              Logs
            </Link>
          </>
        )}
      </div>
      <div style={styles.navLinks}>
        <Link to="/Create_Wager" style={styles.link}>
          Create Wager
        </Link>
        {user?.credits !== null && (
          <Link to="/Credit-Shop" style={styles.link}>
            {parseInt(user?.credits)} Credits
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#333",
    padding: "10px 20px",
  },
  brand: {
    color: "#fff",
    margin: 0,
  },
  navLinks: {
    display: "flex",
    gap: "15px",
    position: "relative",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "16px",
    cursor: "pointer",
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#444",
    padding: "10px 0",
    borderRadius: "5px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  dropdownLink: {
    display: "block",
    padding: "5px 20px",
    color: "#fff",
    textDecoration: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  dropdownLinkHover: {
    background: "#555",
  },
};