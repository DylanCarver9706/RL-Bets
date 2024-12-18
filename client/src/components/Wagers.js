import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { createBet } from "../services/wagerService.js";
import { useUser } from "../context/UserContext.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

const WagerOutcomeFormula = (
  betAmount,
  totalWinnersBetsAmount,
  totalLosersBetsAmount
) => {
  if (
    totalWinnersBetsAmount === 0 ||
    totalLosersBetsAmount === 0 ||
    isNaN(betAmount)
  ) {
    return 0;
  }
  const winnings =
    (betAmount / totalWinnersBetsAmount) * totalLosersBetsAmount + betAmount;
  // console.log(`((${betAmount} / (${totalWinnersBetsAmount})) * ${totalLosersBetsAmount}) + ${betAmount} = ${winnings}`)
  return winnings;
};

const Wagers = () => {
  const { user } = useUser();
  const [wagers, setWagers] = useState([]);
  const [filteredWagers, setFilteredWagers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showBetInput, setShowBetInput] = useState(false);
  const [creditsWagered, setCreditsWagered] = useState(0);
  const [betInputs, setBetInputs] = useState({});
  const [selectedBet, setSelectedBet] = useState({});
  const [estimatedWinnings, setEstimatedWinnings] = useState(0);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(BASE_SERVER_URL);

    // Listen for updates from the server
    socket.on("wagersUpdate", (updatedWagers) => {
      setWagers(updatedWagers || []);
      applyFilter("all", updatedWagers);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user.mongoUserId]);

  useEffect(() => {
    // Recalculate estimated winnings if credits wagered or selected wager's agree/disagree values change
    if (selectedBet.wagerId && creditsWagered > 0) {
      const wager = wagers.find((w) => w._id === selectedBet.wagerId);
      if (wager) {
        const { agreeCreditsBet = 0, disagreeCreditsBet = 0 } = wager;

        setEstimatedWinnings(
          WagerOutcomeFormula(
            creditsWagered,
            agreeCreditsBet,
            disagreeCreditsBet
          )
        );
      }
    }
  }, [creditsWagered, wagers, selectedBet]);

  // Apply filters based on the selected filter option
  const applyFilter = (filter, allWagers = wagers) => {
    let filtered = allWagers;

    switch (filter) {
      case "all":
        filtered = allWagers;
        break;
      case "Betable":
        filtered = allWagers.filter(
          (wager) =>
            wager.status === "Betable" &&
            wager.creator !== user.mongoUserId &&
            wager.bets.every((bet) => bet.user !== user.mongoUserId)
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
          wager.bets.some((bet) => bet.user === user.mongoUserId)
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
  const handleBetInputChange = (wagerId, value) => {
    const betAmount = parseInt(value, 10) || 0;
    setBetInputs((prev) => ({ ...prev, [wagerId]: betAmount }));
    setCreditsWagered(betAmount);
  };

  // Handle showing bet input
  const handleShowBetInput = (wagerId, agreeBet) => {
    setShowBetInput(true);
    setSelectedBet({ wagerId, agreeBet });
  };

  // Handle cancel bet
  const handleCancelBet = () => {
    setSelectedBet({});
    setShowBetInput(false);
    setEstimatedWinnings(0);
  };

  // Handle submit bet
  const handleSubmitBet = async (wagerId, agreeBet) => {
    const credits = betInputs[wagerId];
    if (!credits || isNaN(credits)) {
      return alert("Please enter a valid number of credits.");
    }

    const betPayload = {
      user: user.mongoUserId,
      credits: parseInt(credits, 10),
      agreeBet: agreeBet,
      rlEventReference: wagerId,
      wagerId: wagerId,
    };

    try {
      await createBet(betPayload);
      alert("Bet placed successfully!");
      setSelectedBet({});
      setBetInputs({});
      setEstimatedWinnings(0);
    } catch (error) {
      console.error("Error placing bet:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        Welcome to the Wager Dashboard, {user.mongoUserId}
      </h2>

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
            checked={activeFilter === "Betable"}
            onChange={() => handleFilterChange("Betable")}
          />
          Show Betable Wagers
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
          {filteredWagers.length === 0 ? (
            <p>No wagers available.</p>
          ) : (
            filteredWagers.map((wager) => (
              <li key={wager._id} style={styles.wagerItem}>
                <div style={styles.wagerHeader}>
                  <strong>Wager ID: {wager._id}</strong>
                  <br />
                  <strong>Event ID: {wager.rlEventReference}</strong>
                  <br />
                  <strong>Creator: {wager.creator}</strong>
                  <br />
                  <strong>Status: {wager.status}</strong>
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
                        (bet) => bet.user !== user.mongoUserId
                      ) &&
                      wager.creator !== user.mongoUserId && (
                        <button
                          style={styles.betButton}
                          onClick={() => handleShowBetInput(wager._id, true)}
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
                        (bet) => bet.user !== user.mongoUserId
                      ) &&
                      wager.creator !== user.mongoUserId && (
                        <button
                          style={styles.betButton}
                          onClick={() => handleShowBetInput(wager._id, false)}
                        >
                          Bet on Disagree
                        </button>
                      )}
                  </div>
                </div>

                {/* Show input when Bet button is clicked */}
                {showBetInput && selectedBet.wagerId === wager._id && (
                  <div>
                    I bet{" "}
                    <input
                      type="number"
                      id="numberInput"
                      value={betInputs[wager._id] || ""}
                      onChange={(e) =>
                        handleBetInputChange(wager._id, e.target.value)
                      }
                      min="0"
                      step="1"
                    />{" "}
                    credits that this{" "}
                    <strong>
                      {selectedBet.agreeBet ? "will" : "will not"}
                    </strong>{" "}
                    happen
                    <p>
                      Estimated Winnings: {parseInt(estimatedWinnings) || 0}{" "}
                      credits
                    </p>
                    <p>
                      Credits Earned: ((Bet Amount / (Total Agree Credits Bet +
                      Bet Amount)) * Total Loser's Credits Bet) + Bet Amount
                    </p>
                    <p>
                      Meaning: {creditsWagered} credits bet +{" "}
                      {parseInt(estimatedWinnings - creditsWagered) || 0}{" "}
                      credits earned = {parseInt(estimatedWinnings) || 0}{" "}
                      credits won
                    </p>
                    <button
                      style={styles.submitBetButton}
                      onClick={() =>
                        handleSubmitBet(wager._id, selectedBet.agreeBet)
                      }
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
            ))
          )}
        </ul>
      </div>
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
};
