import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.js";
import { subscribeToUpdates } from '../../services/supabaseService';
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
  const navigate = useNavigate();
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
  useEffect(() => {
    const subscription = subscribeToUpdates('users', 'updateUser', (payload) => {
      if (payload.payload.user._id === user?.mongoUserId) {
        setUser({ ...user, credits: payload.payload.user.credits });
      }
    });

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, [user?.mongoUserId]);

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

        {user ? (
          <div className="nav-center">
            <Link to="/wagers" className="nav-link">
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
                <Link to={`/tournament`} className="dropdown-link">
                  {currentTournament.name}
                </Link>
              )}
              <Link to={`/tournament-history`} className="dropdown-link">
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
                <Link to={`/tournament-leaderboard`} className="dropdown-link">
                  {currentTournament?.name}
                </Link>
              )}
              <Link to="/lifetime-leaderboard" className="dropdown-link">
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
                <Link to="/admin" className="dropdown-link">
                  Home
                </Link>
                <Link to="/create_wager" className="dropdown-link">
                  Create Wager
                </Link>
                <Link to="/logs" className="dropdown-link">
                  Logs
                </Link>
                <Link to="/admin-email" className="dropdown-link">
                  Email Users
                </Link>
                <Link
                  to="/admin-identity-verification"
                  className="dropdown-link"
                >
                  Identity Verification
                </Link>
              </div>
            </div>
          )}
          {user && (
            <>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </>
          )}
        </div>
        ) : (
          <button className="navbar-cta-button-browser" onClick={() => navigate("/Login")}>
            Login
          </button>
        )}

        {user && (
          <div className="user-controls">
            <Link to="/credit-shop" className="credits-display">
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
        {user ? (
          <>
            <div className="mobile-credits">
              <Link to="/credit-shop" className="credits-display">
                {parseInt(user?.credits)} Credits
              </Link>
            </div>
            <div className="mobile-notifications">
              <Notifications />
            </div>
            <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}>
              <div className="mobile-column-left">
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
                        to={`/tournament`}
                        className="mobile-nav-link"
                        onClick={handleNavLinkClick}
                      >
                        {currentTournament.name}
                      </Link>
                    )}
                    <Link
                      to={`/tournament-history`}
                      className="mobile-nav-link"
                      onClick={handleNavLinkClick}
                    >
                      Tournament History
                    </Link>
                  </div>
                </div>
                <Link
                  to="/wagers"
                  className="mobile-nav-link"
                  onClick={handleNavLinkClick}
                >
                  Wagers
                </Link>
              </div>
              <div className="mobile-column-right">
                {user && (
                  <>
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
                            to={`/tournament-leaderboard`}
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            {currentTournament?.name}
                          </Link>
                        )}
                        <Link
                          to="/lifetime-leaderboard"
                          className="mobile-nav-link"
                          onClick={handleNavLinkClick}
                        >
                          Lifetime Leaderboard
                        </Link>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="mobile-nav-link"
                      onClick={handleNavLinkClick}
                    >
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
                            to="/admin"
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            Home
                          </Link>
                          <Link
                            to="/create_wager"
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            Create Wager
                          </Link>
                          <Link
                            to="/logs"
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            Logs
                          </Link>
                          <Link
                            to="/admin-email"
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            Email Users
                          </Link>
                          <Link
                            to="/admin-identity-verification"
                            className="mobile-nav-link"
                            onClick={handleNavLinkClick}
                          >
                            Identity Verification
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button className="mobile-menu-button" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </>
        ) : (
          <button className="navbar-cta-button-mobile" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
