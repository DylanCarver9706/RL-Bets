import React, { useEffect, useState } from "react";
import { subscribeToUpdates } from "../../../services/supabaseService";
import { createBet } from "../../../services/wagerService.js";
import { useUser } from "../../../contexts/UserContext.js";
import { getWagers } from "../../../services/userService.js";
import ToolTip from "../../common/ToolTip.js";
import CreditShop from "./CreditShop.js";
import "../../../styles/components/core/Wagers.css";

const estimatedWagerPayout = (
  betAmount,
  totalAgreeCreditsBet,
  totalDisagreeCreditsBet,
  agreeBet // true or false
) => {
  let potentialWinnings = 0;
  if (agreeBet === true) {
    potentialWinnings =
      betAmount +
      totalDisagreeCreditsBet *
        (betAmount / (betAmount + totalAgreeCreditsBet));
  } else {
    potentialWinnings =
      betAmount +
      totalAgreeCreditsBet *
        (betAmount / (betAmount + totalDisagreeCreditsBet));
  }

  // console.log("potentialWinnings", potentialWinnings);

  if (potentialWinnings < 0) {
    return 0;
  }

  return potentialWinnings;
};

const wagerPayoutFormula = (
  betAmount,
  totalWinnersBetsAmount,
  totalLosersBetsAmount,
  agreeIsTrue
) => {
  let potentialWinnings = 0;
  if (agreeIsTrue === true) {
    potentialWinnings =
      totalLosersBetsAmount * (betAmount / totalWinnersBetsAmount);
  } else {
    potentialWinnings =
      totalWinnersBetsAmount * (betAmount / totalLosersBetsAmount);
  }
  return potentialWinnings;
};

const Wagers = () => {
  const { user } = useUser();
  const [wagers, setWagers] = useState([]);
  const [filteredWagers, setFilteredWagers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Bettable");
  const [showBetInput, setShowBetInput] = useState(false);
  const [creditsWagered, setCreditsWagered] = useState(0);
  const [selectedWager, setSelectedWager] = useState(null);
  const [wagerCaseSelected, setWagerCaseSelected] = useState(null);
  const [estimatedWinnings, setEstimatedWinnings] = useState(0);
  const [showCreditShopModal, setShowCreditShopModal] = useState(false);
  const [expandedWagers, setExpandedWagers] = useState({});

  // Fetch wagers from the server and then listen for updates
  useEffect(() => {
    const fetchWagers = async () => {
      try {
        const wagers = await getWagers();
        // console.log("Fetched wagers:", wagers);
        setWagers(wagers);
        applyFilter("Bettable", wagers);
      } catch (error) {
        console.error("Error fetching wagers:", error.message);
      }
    };

    fetchWagers();
    // eslint-disable-next-line
  }, []);

  // Listen for updates from the server
  useEffect(() => {
    const subscription = subscribeToUpdates(
      "wagers",
      "wagersUpdate",
      (payload) => {
        console.log("payload", payload);
        if (Array.isArray(payload.payload.wagers)) {
          setWagers(() => {
            applyFilter(activeFilter, payload.payload.wagers);
            return payload.payload.wagers;
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, [activeFilter]);

  // Apply filters based on the selected filter option
  const applyFilter = (filter, allWagers = wagers) => {
    let filtered = allWagers;

    switch (filter) {
      case "Bettable":
        filtered = allWagers.filter(
          (wager) =>
            wager.status === "Bettable" &&
            // wager.creator !== user?.mongoUserId && // Deprecated/Future Use: Users can't make wagers, only admins can make wagers
            wager.bets.every((bet) => bet.user !== user?.mongoUserId)
        );
        break;
      case "Ongoing":
        filtered = allWagers.filter((wager) => wager.status === "Ongoing");
        break;
      case "BetOn":
        filtered = allWagers.filter((wager) =>
          wager.bets.some((bet) => bet.user === user?.mongoUserId)
        );
        break;
      default:
        filtered = allWagers;
        break;
    }

    setFilteredWagers(filtered);
    setActiveFilter(filter);
  };

  const handleFilterChange = (filter) => {
    if (activeFilter !== filter) {
      applyFilter(filter);
    }
  };

  // Handle input change for each wager
  const handleBetInputChange = (value) => {
    const betAmount = parseFloat(value) || 0;
    setCreditsWagered(betAmount);
    const estimatedPayout = estimatedWagerPayout(
      betAmount,
      selectedWager.agreeCreditsBet,
      selectedWager.disagreeCreditsBet,
      wagerCaseSelected
    );
    setEstimatedWinnings(estimatedPayout);
  };

  // Handle cancel bet
  const handleCancelBet = () => {
    setSelectedWager(null);
    setWagerCaseSelected(null);
    setShowBetInput(false);
    setEstimatedWinnings(0);
  };

  // Handle submit bet
  const handleSubmitBet = async () => {
    // Alert to confirm bet
    const confirmBet = window.confirm(
      "Are you sure you want to place this bet?"
    );
    if (!confirmBet) {
      return;
    }

    if (creditsWagered === 0 || !creditsWagered || isNaN(creditsWagered)) {
      return alert("Please enter a valid number of credits.");
    }

    if (creditsWagered > user?.credits) {
      setShowCreditShopModal(true);
      return;
    }

    const betPayload = {
      user: user?.mongoUserId,
      credits: parseFloat(creditsWagered),
      agreeBet: wagerCaseSelected,
      rlEventReference: selectedWager.rlEventReference,
      wagerId: selectedWager._id,
    };

    try {
      await createBet(betPayload);
      alert("Bet placed successfully!");
      handleCancelBet();
    } catch (error) {
      console.error("Error placing bet:", error);
    }
  };

  const handleWagerOptionClick = (wager, agreeBet) => {
    setCreditsWagered(parseInt(user?.credits / 10));
    setShowBetInput(true);

    console.log("wager", wager);
    setSelectedWager(wager);
    setWagerCaseSelected(agreeBet);

    const estimatedPayout = estimatedWagerPayout(
      parseInt(user?.credits / 10),
      wager.agreeCreditsBet,
      wager.disagreeCreditsBet,
      agreeBet
    );

    setEstimatedWinnings(estimatedPayout);
  };

  const toggleWagerDetails = (wagerId) => {
    setExpandedWagers((prev) => ({
      ...prev,
      [wagerId]: !prev[wagerId],
    }));
  };

  return (
    <div className="wagers-container">
      <div className="filter-container">
        <button
          className={`filter-button ${
            activeFilter === "Bettable" ? "active" : ""
          }`}
          onClick={() => handleFilterChange("Bettable")}
        >
          Bettable
        </button>
        <button
          className={`filter-button ${
            activeFilter === "Ongoing" ? "active" : ""
          }`}
          onClick={() => handleFilterChange("Ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`filter-button ${
            activeFilter === "BetOn" ? "active" : ""
          }`}
          onClick={() => handleFilterChange("BetOn")}
        >
          Bet On
        </button>
      </div>

      <ul className="wagers-list">
        {filteredWagers?.map((wager) => {
          let userBet = wager.bets.find(
            (bet) => bet.user === user?.mongoUserId
          );
          const totalBets = wager.agreeCreditsBet + wager.disagreeCreditsBet;
          const agreePercentage = totalBets
            ? ((wager.agreeCreditsBet / totalBets) * 100).toFixed(1)
            : 0;
          const disagreePercentage = totalBets
            ? ((wager.disagreeCreditsBet / totalBets) * 100).toFixed(1)
            : 0;

          return (
            <li key={wager._id} className="wager-item">
              <div className="wager-header">
                <h2 className="wager-name">{wager.name}</h2>
                {userBet && wager.status !== "Ended" && (
                  <strong>
                    Current Estimated Winnings:{" "}
                    {wagerPayoutFormula(
                      userBet.credits,
                      userBet.agreeBet
                        ? wager.agreeCreditsBet
                        : wager.disagreeCreditsBet,
                      userBet.agreeBet
                        ? wager.disagreeCreditsBet
                        : wager.agreeCreditsBet,
                      userBet.agreeBet
                    ).toFixed(2)}{" "}
                    Credits
                    <ToolTip infoText="This is your current estimated payout if you win. This will change as more bets are placed." />
                  </strong>
                )}
              </div>

              <div className="wager-options">
                <div className="bet-percentage-bar">
                  <div
                    className="percentage-indicator"
                    style={{
                      [agreePercentage > disagreePercentage ? "right" : "left"]:
                        "0",
                      width: `${Math.min(
                        agreePercentage,
                        disagreePercentage
                      )}%`,
                    }}
                  />
                  <div
                    className="percentage-separator"
                    style={{
                      left: `${agreePercentage}%`,
                    }}
                  />
                  <div className="percentage-text">
                    <span>Agree {agreePercentage}%</span>
                    <span>Disagree {disagreePercentage}%</span>
                  </div>
                </div>

                <div className="bet-buttons-container">
                  {!["Ongoing", "Ended"].includes(wager.status) &&
                    wager.bets.every(
                      (bet) => bet.user !== user?.mongoUserId
                    ) && (
                      <>
                        <button
                          className="bet-button"
                          onClick={() => handleWagerOptionClick(wager, true)}
                        >
                          Bet Agree
                        </button>
                        <button
                          className="bet-button"
                          onClick={() => handleWagerOptionClick(wager, false)}
                        >
                          Bet Disagree
                        </button>
                      </>
                    )}
                </div>

                <button
                  className={`dropdown-toggle ${
                    expandedWagers[wager._id] ? "open" : ""
                  }`}
                  onClick={() => toggleWagerDetails(wager._id)}
                />

                {expandedWagers[wager._id] && (
                  <div className="bet-details">
                    <div className="bet-details-section">
                      <h3>Agree</h3>
                      <p>Total Credits: {wager.agreeCreditsBet}</p>
                      <p>
                        Total Bets:{" "}
                        {wager.bets.filter((b) => b.agreeBet).length}
                      </p>
                      <p>
                        Average Bet:{" "}
                        {(
                          wager.agreeCreditsBet /
                            wager.bets.filter((b) => b.agreeBet).length || 0
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="bet-details-divider" />

                    <div className="bet-details-section">
                      <h3>Disagree</h3>
                      <p>Total Credits: {wager.disagreeCreditsBet}</p>
                      <p>
                        Total Bets:{" "}
                        {wager.bets.filter((b) => !b.agreeBet).length}
                      </p>
                      <p>
                        Average Bet:{" "}
                        {(
                          wager.disagreeCreditsBet /
                            wager.bets.filter((b) => !b.agreeBet).length || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {showBetInput && selectedWager?._id === wager._id && (
                <div className="bet-input-container">
                  <div className="bet-input-row">
                    I bet{" "}
                    <input
                      type="number"
                      className="bet-input"
                      value={creditsWagered}
                      onChange={(e) => handleBetInputChange(e.target.value)}
                      min="0"
                      step="1"
                    />{" "}
                    credits that this{" "}
                    <span className="bet-prediction">
                      {wagerCaseSelected ? "will" : "will not"}
                    </span>{" "}
                    happen{" "}
                  </div>
                  <div className="estimated-winnings">
                    Estimated Winnings: {estimatedWinnings.toFixed(2)} Credits{" "}
                    {
                      <ToolTip
                        infoText={`Total ${
                          wagerCaseSelected ? "Disagree" : "Agree"
                        } Credits Bet x ( Bet Amount / ( Bet Amount + Total ${
                          wagerCaseSelected ? "Agree" : "Disagree"
                        } Credits Bet ))`}
                      />
                    }
                  </div>
                  <div className="bet-actions">
                    <button
                      className="confirm-button"
                      onClick={handleSubmitBet}
                    >
                      Confirm
                    </button>
                    <button className="cancel-button" onClick={handleCancelBet}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {showCreditShopModal ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowCreditShopModal(false)}
              style={styles.closeButton}
            >
              ✖
            </button>
            <CreditShop />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Wagers;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    minHeight: "calc(100vh - 70px)", // Subtract navbar height
  },
  header: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  toggleContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "20px",
  },
  wagerListContainer: {
    textAlign: "left",
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
  wagerHeader: {
    fontSize: "18px",
    marginBottom: "10px",
    textAlign: "center",
  },
  wagerBody: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  agreeSection: {
    width: "45%",
    textAlign: "center",
  },
  disagreeSection: {
    width: "45%",
    textAlign: "center",
  },
  input: {
    marginTop: "10px",
    marginBottom: "10px",
    padding: "5px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "100%",
  },
  betButton: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
  },
  submitBetButton: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent background
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000, // Ensure it appears on top
  },
  modalContent: {
    backgroundColor: "#635d5d", // Modal background
    padding: "20px", // Space inside the modal
    borderRadius: "8px", // Rounded corners
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow
    maxWidth: "500px", // Limit width
    width: "90%", // Responsive width
    position: "relative", // For positioning the close button
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "white",
  },
};
