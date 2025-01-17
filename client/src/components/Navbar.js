import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import socket from "../services/socket.js";
import { fetchCurrentTournament } from "../services/leaderboardService.js";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [currentTournament, setCurrentTournament] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState(null); // Manage hover state for each dropdown

  useEffect(() => {
    // Fetch the current tournament data
    const fetchTournament = async () => {
      setCurrentTournament(await fetchCurrentTournament());
    }
    fetchTournament();
  }, []);
  
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
        <div
          style={styles.dropdownContainer}
          onMouseEnter={() => setHoveredDropdown("tournaments")}
          onMouseLeave={() => setHoveredDropdown(null)}
          onClick={() => setHoveredDropdown(null)}
        >
          <span style={styles.link}>Tournaments</span>
          {hoveredDropdown === "tournaments" && (
            <div style={styles.dropdownMenu}>
              {currentTournament && (
                <Link
                  to={`/Tournament`}
                  style={styles.dropdownLink}
                >
                  {currentTournament.name}
                </Link>
              )}
              <Link
                  to={`/Tournament-History`}
                  style={styles.dropdownLink}
                >
                  Tournament History
                </Link>
            </div>
          )}
        </div>
        <div
          style={styles.dropdownContainer}
          onMouseEnter={() => setHoveredDropdown("leaderboards")}
          onMouseLeave={() => setHoveredDropdown(null)}
          onClick={() => setHoveredDropdown(null)}
        >
          <span style={styles.link}>Leaderboards</span>
          {hoveredDropdown === "leaderboards" && (
            <div style={styles.dropdownMenu}>
              {currentTournament && (
                <Link
                  to={`/Tournament-Leaderboard`}
                  style={styles.dropdownLink}
                >
                  {currentTournament.name}
                </Link>
              )}
              <Link to="/Lifetime-Leaderboard" style={styles.dropdownLink}>
                Lifetime Leaderboard
              </Link>
            </div>
          )}
        </div>
        {user.userType === "admin" && (
        <div
          style={styles.dropdownContainer}
          onMouseEnter={() => setHoveredDropdown("admin")}
          onMouseLeave={() => setHoveredDropdown(null)}
          onClick={() => setHoveredDropdown(null)}
        >
          <span style={styles.link}>Admin</span>
          {hoveredDropdown === "admin" && (
            <div style={styles.dropdownMenu}>
              <Link to="/Admin" style={styles.dropdownLink}>
              Home
            </Link>
            <Link to="/Create_Wager" style={styles.dropdownLink}>
              Create Wager
            </Link>
            <Link to="/Log" style={styles.dropdownLink}>
              Logs
            </Link>
            </div>
          )}
        </div>
        )}
      </div>
      <div style={styles.navLinks}>
        <Link to="/Profile" style={styles.link}>
          Profile
        </Link>
        <Link to="/Settings" style={styles.link}>
          Settings
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
