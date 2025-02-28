import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.js";
// import socket from "../../services/socketService.js";
import { fetchCurrentTournament } from "../../services/leaderboardService.js";
import Notifications from "../features/core/Notifications.js";
import { auth } from "../../config/firebaseConfig.js";
import "../../styles/components/common/Navbar.css";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [currentTournament, setCurrentTournament] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    // Fetch the current tournament data
    const fetchTournament = async () => {
      const tournamentData = await fetchCurrentTournament();
      setCurrentTournament(tournamentData);
    };
    const currentUser = auth.currentUser;
    if (currentUser) {
      fetchTournament();
    }
  }, []);

  // Listen for updates from the server
  // useEffect(() => {
  //   socket.on("updateUser", (updateUser) => {
  //     if (updateUser._id === user?.mongoUserId) {
  //       setUser({ ...user, credits: updateUser.credits });
  //     }
  //   });

  //   // Cleanup listener on unmount
  //   return () => {
  //     socket.off("wagersUpdate");
  //     socket.disconnect();
  //   };
  //   // eslint-disable-next-line
  // }, [user?.mongoUserId]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setHoveredDropdown(null);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    if (window.innerWidth <= 768) {
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    }
  };

  const handleMouseEnter = (dropdownName) => {
    if (window.innerWidth > 768) {
      setHoveredDropdown(dropdownName);
    }
  };

  const handleMouseLeave = (dropdownName) => {
    if (window.innerWidth > 768) {
      setTimeout(() => {
        // Ensure the user is not still hovering over the dropdown menu
        if (hoveredDropdown === dropdownName) {
          setHoveredDropdown(null);
        }
      }, 600); // Small delay to allow moving cursor to dropdown menu
    }
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <nav className="navbar">
      {/* Desktop Navigation */}
      <div className="desktop-nav">
        <h2 className="brand">
          <Link to="/" className="brand-link">
            RLBets
          </Link>
        </h2>

        <div className="nav-center">
          <Link to="/Wagers" className="nav-link">
            Wagers
          </Link>
          <div
            className="dropdown-container"
            onMouseEnter={() => handleMouseEnter("tournaments")}
            onMouseLeave={() => handleMouseLeave("tournaments")}
          >
            <span className="nav-link">Tournaments</span>
            <div
              className={`dropdown-menu ${
                hoveredDropdown === "tournaments" ? "active" : ""
              }`}
            >
              {currentTournament && (
                <Link to={`/Tournament`} className="dropdown-link">
                  {currentTournament.name}
                </Link>
              )}
              <Link to={`/Tournament-History`} className="dropdown-link">
                Tournament History
              </Link>
            </div>
          </div>
          <div
            className="dropdown-container"
            onMouseEnter={() => handleMouseEnter("leaderboards")}
            onMouseLeave={() => handleMouseLeave("leaderboards")}
          >
            <span className="nav-link">Leaderboards</span>
            <div
              className={`dropdown-menu ${
                hoveredDropdown === "leaderboards" ? "active" : ""
              }`}
            >
              {currentTournament && (
                <Link to={`/Tournament-Leaderboard`} className="dropdown-link">
                  {currentTournament?.name}
                </Link>
              )}
              <Link to="/Lifetime-Leaderboard" className="dropdown-link">
                Lifetime
              </Link>
            </div>
          </div>
          {user?.userType === "admin" && (
            <div
              className="dropdown-container"
              onMouseEnter={() => handleMouseEnter("admin")}
              onMouseLeave={() => handleMouseLeave("admin")}
            >
              <span className="nav-link">Admin</span>
              <div
                className={`dropdown-menu ${
                  hoveredDropdown === "admin" ? "active" : ""
                }`}
              >
                <Link to="/Admin" className="dropdown-link">
                  Home
                </Link>
                <Link to="/Create_Wager" className="dropdown-link">
                  Create Wager
                </Link>
                <Link to="/Log" className="dropdown-link">
                  Logs
                </Link>
                <Link to="/Admin-Email" className="dropdown-link">
                  Email Users
                </Link>
                <Link
                  to="/Admin-Identity-Verification"
                  className="dropdown-link"
                >
                  Identity Verification
                </Link>
              </div>
            </div>
          )}
          {user && (
            <>
              <Link to="/Profile" className="nav-link">
                Profile
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="user-controls">
            <Link to="/Credit-Shop" className="credits-display">
              {parseInt(user?.credits)} Credits
            </Link>
            <div className="desktop-notifications">
              <Notifications />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <h2 className="mobile-brand">
          <Link
            to="/"
            className="mobile-brand-nav-link"
            onClick={handleNavLinkClick}
          >
            RLBets
          </Link>
        </h2>
        {user && (
          <>
            <div className="mobile-credits">
              <Link to="/Credit-Shop" className="credits-display">
                {parseInt(user?.credits)} Credits
              </Link>
            </div>
            <div className="mobile-notifications">
              <Notifications />
            </div>
          </>
        )}
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}>
          <div className="mobile-column-left">
            <Link to="/Wagers" className="mobile-nav-link" onClick={handleNavLinkClick}>
              Wagers
            </Link>
            <div className="mobile-dropdown">
              <span
                className="mobile-nav-link"
                onClick={() => toggleDropdown("tournaments")}
              >
                Tournaments
              </span>
              <div
                className={`mobile-dropdown-menu ${
                  activeDropdown === "tournaments" ? "active" : ""
                }`}
              >
                {currentTournament && (
                  <Link
                    to={`/Tournament`}
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    {currentTournament.name}
                  </Link>
                )}
                <Link
                  to="/Tournament-History"
                  className="mobile-nav-link"
                  onClick={handleNavLinkClick}
                >
                  Tournament History
                </Link>
              </div>
            </div>
          </div>
          <div className="mobile-column-right">
            <div className="mobile-dropdown">
              <span
                className="mobile-nav-link"
                onClick={() => toggleDropdown("leaderboards")}
              >
                Leaderboards
              </span>
              <div
                className={`mobile-dropdown-menu ${
                  activeDropdown === "leaderboards" ? "active" : ""
                }`}
              >
                {currentTournament && (
                  <Link
                    to={`/Tournament-Leaderboard`}
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    {currentTournament.name}
                  </Link>
                )}
                <Link
                  to="/Lifetime-Leaderboard"
                  className="mobile-nav-link"
                  onClick={handleNavLinkClick}
                >
                  Lifetime
                </Link>
              </div>
            </div>
            <Link to="/Profile" className="mobile-nav-link" onClick={handleNavLinkClick}>
              Profile
            </Link>
            {user?.userType === "admin" && (
              <div className="mobile-dropdown">
                <span
                  className="mobile-nav-link"
                  onClick={() => toggleDropdown("admin")}
                >
                  Admin
                </span>
                <div
                  className={`mobile-dropdown-menu ${
                    activeDropdown === "admin" ? "active" : ""
                  }`}
                >
                  <Link
                    to="/Admin"
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    Home
                  </Link>
                  <Link
                    to="/Create_Wager"
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    Create Wager
                  </Link>
                  <Link
                    to="/Log"
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    Logs
                  </Link>
                  <Link
                    to="/Admin-Email"
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    Email Users
                  </Link>
                  <Link
                    to="/Admin-Identity-Verification"
                    className="mobile-nav-link"
                    onClick={handleNavLinkClick}
                  >
                    Identity Verification
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
