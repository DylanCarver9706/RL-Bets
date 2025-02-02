import React, { useEffect, useState } from "react";
import socket from "../services/socket.js";
import { createBet } from "../services/wagerService.js";
import { useUser } from "../contexts/UserContext.js";
import { getWagers } from "../services/userService.js";
import ToolTip from "./ToolTip.js";
import CreditShop from "./CreditShop.js";

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

const WagerPayoutFormula = (
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [showBetInput, setShowBetInput] = useState(false);
  const [creditsWagered, setCreditsWagered] = useState(0);
  const [selectedWager, setSelectedWager] = useState(null);
  const [wagerCaseSelected, setWagerCaseSelected] = useState(null);
  const [estimatedWinnings, setEstimatedWinnings] = useState(0);
  const [showCreditShopModal, setShowCreditShopModal] = useState(false);

  // Fetch wagers from the server and then listen for updates
  useEffect(() => {
    const fetchWagers = async () => {
      try {
        const wagers = await getWagers();
        // console.log("Fetched wagers:", wagers);
        setWagers(wagers);
        applyFilter("all", wagers);
      } catch (error) {
        console.error("Error fetching wagers:", error.message);
      }
    };

    fetchWagers();
    // eslint-disable-next-line
  }, []);

  // Listen for updates from the server
  useEffect(() => {
    const handleWagersUpdate = (updatedWagers) => {
      if (Array.isArray(updatedWagers)) {
        setWagers(updatedWagers || []);
        applyFilter(activeFilter, updatedWagers);
      } else {
        throw new Error(
          "Invalid data received from wagersUpdate:",
          updatedWagers
        );
      }
    };

    socket.on("wagersUpdate", handleWagersUpdate);

    return () => {
      socket.off("wagersUpdate", handleWagersUpdate);
    };
    // eslint-disable-next-line
  }, [user?.mongoUserId]);

  // Apply filters based on the selected filter option
  const applyFilter = (filter, allWagers = wagers) => {
    let filtered = allWagers;

    switch (filter) {
      case "all":
        filtered = allWagers;
        break;
      case "Bettable":
        filtered = allWagers.filter(
          (wager) =>
            wager.status === "Bettable" &&
            wager.creator !== user?.mongoUserId &&
            wager.bets.every((bet) => bet.user !== user?.mongoUserId)
        );
        break;
      case "Ongoing":
        filtered = allWagers.filter((wager) => wager.status === "Ongoing");
        break;
      case "Ended":
        filtered = allWagers.filter((wager) => wager.status === "Ended");
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
    // const credits = betInputs[wagerId];
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

  return (
    <>
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
    ) : (
    <div style={styles.container}>
      <div style={styles.toggleContainer}>
        <label>
          <input
            type="radio"
            checked={activeFilter === "all"}
            onChange={() => handleFilterChange("all")}
          />
          Show All Wagers
        </label>
        <label>
          <input
            type="radio"
            checked={activeFilter === "Bettable"}
            onChange={() => handleFilterChange("Bettable")}
          />
          Show Bettable Wagers
        </label>
        <label>
          <input
            type="radio"
            checked={activeFilter === "BetOn"}
            onChange={() => handleFilterChange("BetOn")}
          />
          Show Wagers You've Bet On
        </label>
        <label>
          <input
            type="radio"
            checked={activeFilter === "Ongoing"}
            onChange={() => handleFilterChange("Ongoing")}
          />
          Show Ongoing Wagers
        </label>
        <label>
          <input
            type="radio"
            checked={activeFilter === "Ended"}
            onChange={() => handleFilterChange("Ended")}
          />
          Show Ended Wagers
        </label>
      </div>

      <div style={styles.wagerListContainer}>
        <ul style={styles.wagerList}>
          {filteredWagers?.length === 0 ? (
            <p>No wagers available.</p>
          ) : (
            filteredWagers?.map((wager) => {
              let userBet = null;
              userBet = wager.bets.find((bet) => bet.user === user?.mongoUserId);
              // console.log(`userBet for ${userBet?.wagerId}`, userBet);
              return (
                <li key={wager._id} style={styles.wagerItem}>
                  <div style={styles.wagerHeader}>
                    <strong>Wager ID: {wager._id}</strong>
                    <br />
                    <strong>Event ID: {wager.rlEventReference}</strong>
                    <br />
                    <strong>Creator: {wager.creator}</strong>
                    <br />
                    <strong>Status: {wager.status}</strong>
                    <br />
                    {userBet && wager.status !== "Ended" && (
                      <strong>
                        {" "}
                        Current Estimated Winnings:{" "}
                        {estimatedWagerPayout(
                          userBet.credits,
                          userBet.agreeBet
                            ? wager.agreeCreditsBet - userBet.credits
                            : wager.agreeCreditsBet,
                          !userBet.agreeBet
                            ? wager.disagreeCreditsBet - userBet.credits
                            : wager.disagreeCreditsBet,
                          userBet.agreeBet
                        ).toFixed(2)}{" "}
                        Credits{" "}
                        {
                          <ToolTip
                            infoText={`Bet Amount: ${
                              userBet.credits
                            } + Current Potential Winnings: ${(
                              estimatedWagerPayout(
                                userBet.credits,
                                userBet.agreeBet
                                  ? wager.agreeCreditsBet - userBet.credits
                                  : wager.agreeCreditsBet,
                                !userBet.agreeBet
                                  ? wager.disagreeCreditsBet - userBet.credits
                                  : wager.disagreeCreditsBet,
                                userBet.agreeBet
                              ) - userBet.credits
                            ).toFixed(2)}`}
                          />
                        }
                      </strong>
                    )}
                    {userBet && wager.status === "Ended" && (
                      <strong>
                        {" "}
                        Credits Earned:{" "}
                        {(
                          WagerPayoutFormula(
                            userBet.credits,
                            userBet.agreeBet
                              ? wager.agreeCreditsBet
                              : wager.disagreeCreditsBet,
                            userBet.agreeBet
                              ? wager.disagreeCreditsBet
                              : wager.agreeCreditsBet,
                            userBet.agreeBet
                          ) + userBet.credits
                        ).toFixed(2)}{" "}
                        Credits{" "}
                        {
                          <ToolTip
                            infoText={`Bet Amount: ${
                              userBet.credits
                            } + Bet Winnings: ${(
                              estimatedWagerPayout(
                                userBet.credits,
                                userBet.agreeBet
                                  ? wager.agreeCreditsBet - userBet.credits
                                  : wager.agreeCreditsBet,
                                !userBet.agreeBet
                                  ? wager.disagreeCreditsBet - userBet.credits
                                  : wager.disagreeCreditsBet,
                                userBet.agreeBet
                              ) - userBet.credits
                            ).toFixed(2)}`}
                          />
                        }
                      </strong>
                    )}
                    <p>
                      <br />
                      {wager.name}
                    </p>
                    <br />
                  </div>
                  <div style={styles.wagerBody}>
                    <div style={styles.agreeSection}>
                      <div>
                        <strong>Agree:</strong> {wager.agreePercentage}%
                        <strong>
                          <br />
                          Agree Bets Count:
                        </strong>{" "}
                        {wager.agreeBetsCount}
                        <strong>
                          <br />
                          Total Agree Credits Bet:
                        </strong>{" "}
                        {wager.agreeCreditsBet}
                      </div>
                      {!["Ongoing", "Ended"].includes(wager.status) &&
                        wager.bets.every(
                          (bet) => bet.user !== user?.mongoUserId
                        ) &&
                        wager.creator !== user?.mongoUserId && (
                          <button
                            style={styles.betButton}
                            onClick={() => handleWagerOptionClick(wager, true)}
                          >
                            Bet on Agree
                          </button>
                        )}
                    </div>

                    <div style={styles.disagreeSection}>
                      <div>
                        <strong>Disagree:</strong> {wager.disagreePercentage}%
                        <strong>
                          <br />
                          Disagree Bets Count:
                        </strong>{" "}
                        {wager.disagreeBetsCount}
                        <strong>
                          <br />
                          Total Disagree Credits Bet:
                        </strong>{" "}
                        {wager.disagreeCreditsBet}
                      </div>
                      {!["Ongoing", "Ended"].includes(wager.status) &&
                        wager.bets.every(
                          (bet) => bet.user !== user?.mongoUserId
                        ) &&
                        wager.creator !== user?.mongoUserId && (
                          <button
                            style={styles.betButton}
                            onClick={() => handleWagerOptionClick(wager, false)}
                          >
                            Bet on Disagree
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Show input when Bet button is clicked */}
                  {showBetInput && selectedWager?._id === wager._id && (
                    <div>
                      I bet{" "}
                      <input
                        type="number"
                        id="numberInput"
                        value={creditsWagered}
                        onChange={(e) => handleBetInputChange(e.target.value)}
                        min="0"
                        step="1"
                      />{" "}
                      credits that this{" "}
                      <strong>{wagerCaseSelected ? "will" : "will not"}</strong>{" "}
                      happen
                      <p>
                        Estimated Winnings:{" "}
                        {parseFloat(estimatedWinnings - creditsWagered).toFixed(
                          2
                        ) || 0}{" "}
                        credits{" "}
                        {
                          <ToolTip
                            infoText={`Total ${
                              wagerCaseSelected ? "Disagree" : "Agree"
                            } Credits Bet x ( Bet Amount / ( Bet Amount + Total ${
                              wagerCaseSelected ? "Agree" : "Disagree"
                            } Credits Bet ))`}
                          />
                        }
                      </p>
                      {wagerCaseSelected ? (
                        <p>
                          Meaning: {creditsWagered} credits bet +{" "}
                          {parseFloat(
                            estimatedWinnings - creditsWagered
                          ).toFixed(2) > 0
                            ? parseFloat(
                                estimatedWinnings - creditsWagered
                              ).toFixed(2)
                            : 0}{" "}
                          credits won ={" "}
                          {parseFloat(estimatedWinnings).toFixed(2) || 0}{" "}
                          credits earned
                        </p>
                      ) : (
                        <p>
                          Meaning: {creditsWagered} credits bet +{" "}
                          {parseFloat(
                            estimatedWinnings - creditsWagered
                          ).toFixed(2) > 0
                            ? parseFloat(
                                estimatedWinnings - creditsWagered
                              ).toFixed(2)
                            : 0}{" "}
                          credits won ={" "}
                          {parseFloat(estimatedWinnings).toFixed(2) || 0}{" "}
                          credits earned
                        </p>
                      )}
                      <button
                        style={styles.submitBetButton}
                        onClick={() => handleSubmitBet()}
                      >
                        Submit Bet
                      </button>
                      <button
                        style={styles.submitBetButton}
                        onClick={() => handleCancelBet()}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
    )}
    </>
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
