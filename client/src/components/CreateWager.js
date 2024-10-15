import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { fetchBetableObjects, createWager } from "../services/wagerService";

const CreateWager = () => {
  // Load data
  const [data, setData] = useState(null);
  const seasonId = "66fa1588cbd894f17aa0363a"; // Hardcoded for demonstration; replace with dynamic as needed

  // Betting vars
  const [betString, setBetString] = useState("");
  const [betNode, setBetNode] = useState(null);

  // Series bet
  const [selectedEventTypeForBet, setSelectedEventTypeForBet] = useState(null);
  const [selectedTeamForBet, setSelectedTeamForBet] = useState(null);
  const [selectedSeriesBetType, setSelectedSeriesBetType] = useState(null);
  const [
    selectedSeriesOvertimeBetOperator,
    setSelectedSeriesOvertimeBetOperator,
  ] = useState("");
  const [seriesOvertimeBetInput, setSeriesOvertimeBetInput] = useState(0);

  const navigate = useNavigate();
  const { mongoUserId } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchBetableObjects(seasonId);
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, [seasonId]);

  const handleBetClick = async (node) => {
    console.log(node);

    // Set the event type the user wants to bet on like Series or Match
    setSelectedEventTypeForBet(node.type);

    // Save meta data for event in state for later use
    setBetNode(node);
  };

  // Collapsible component to handle toggling
  const CollapsibleSection = ({ title, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div style={{ marginLeft: "20px", marginTop: "10px" }}>
        <button
          style={{
            marginBottom: "5px",
            background: "#b3b1b1",
            color: "white",
            border: "none",
            padding: "5px 10px",
            cursor: "pointer",
          }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▶" : "▼"} {title}
        </button>
        {!isCollapsed && <div style={{ paddingLeft: "15px" }}>{children}</div>}
      </div>
    );
  };

  // Recursive render function to display nested data
  const renderDataTree = (node, level = 0) => {
    if (!node || typeof node !== "object") return null;

    if (Array.isArray(node)) {
      return (
        <ul
          style={{
            listStyleType: "none",
            paddingLeft: level > 0 ? "20px" : "0",
          }}
        >
          {node.map((item, index) => (
            <li key={index}>{renderDataTree(item, level + 1)}</li>
          ))}
        </ul>
      );
    } else {
      return (
        <div>
          {Object.entries(node)
            .filter(([key, value]) => {
              // Exclude keys like "_id", "id", or reference fields that contain IDs
              const excludedKeys = [
                "_id",
                "id",
                "season",
                "tournament",
                "series",
                "team",
                "status",
                "results",
                "type",
              ];
              return !excludedKeys.includes(key) || typeof value !== "string";
            })
            .map(([key, value]) => {
              // Determine the collapsible title based on the key
              let title = "";
              if (key === "tournaments") title = "Tournaments";
              else if (key === "series") title = "Series";
              else if (key === "matches") title = "Matches";
              else if (key === "teams") title = "Teams";
              else if (key === "players") title = "Players";

              // Handle series: include team names in the series title if they exist
              if (key === "series" && Array.isArray(value)) {
                return value.map((seriesItem) => {
                  const seriesId = seriesItem._id;
                  const seriesName = seriesItem.name || "Series";

                  // If the series has teams, extract their names
                  const teamNames = (seriesItem.teams || [])
                    .map((team) => team.name)
                    .join(" vs ");
                  const seriesTitle = teamNames
                    ? `${seriesName}: [${teamNames}]`
                    : seriesName;

                  // Render the series with the updated title
                  return (
                    <CollapsibleSection key={seriesId} title={seriesTitle}>
                      {renderDataTree(seriesItem, level + 1, key)}
                    </CollapsibleSection>
                  );
                });
              }

              // Skip rendering teams directly under matches or series
              // Skip rendering matches under a series if there are no matches
              if (
                key === "teams" ||
                (key === "matches" && value.length === 0)
              ) {
                return null;
              }

              // Recursively render if the value is an object or array
              return typeof value === "object" ? (
                <CollapsibleSection key={key} title={title || key}>
                  {renderDataTree(value, level + 1, key)}
                </CollapsibleSection>
              ) : (
                <div key={key} style={{ marginBottom: "5px" }}>
                  <strong>{value}</strong>
                  {/* Only show Bet button for tournaments, series, or matches */}
                  {node.status === "Betable" && (
                    <button
                      onClick={() => handleBetClick(node)}
                      style={{
                        marginLeft: "10px",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Bet
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      );
    }
  };

  const handleTeamSelect = (e) => {
    const teamName = e.target.value;
    setSelectedTeamForBet(teamName);
  };

  const handleSeriesBetTypeSelect = (e) => {
    const betType = e.target.value;
    setSelectedSeriesBetType(betType);
  };

  const handleSeriesOvertimeBetInput = (e) => {
    const value = parseInt(e.target.value);
    setSeriesOvertimeBetInput(value);
  };

  const handleSeriesOvertimeBetSelect = (e) => {
    const operator = e.target.value;
    setSelectedSeriesOvertimeBetOperator(operator);
  };

  const resetBetState = () => {
    setBetString("");
    setBetNode(null);
    setSelectedEventTypeForBet(null);
    setSelectedTeamForBet(null);
    setSelectedSeriesBetType(null);
    setSelectedSeriesOvertimeBetOperator("");
    setSeriesOvertimeBetInput(0);
  };

  const handleBetSubmit = () => {
    console.log("Bet Submitted: ", betString);
    createWager({
      name: betString,
      creator: mongoUserId,
      eventReference: betNode._id,
    }); // Submit the bet via API
    resetBetState(); // Reset state
    navigate("/"); // Navigate to the desired page
  };

  const handleBetCancel = () => {
    resetBetState(); // Reset state on cancel
  };

  useEffect(() => {
    // Update bet string whenever selected team or event type changes
    if (selectedEventTypeForBet === "Series") {
      if (selectedSeriesBetType === "Series Win" && selectedTeamForBet) {
        setBetString(
          `I bet that the team ${selectedTeamForBet} will win the ${betNode.name}`
        );
      } else if (
        selectedSeriesBetType === "First Blood" &&
        selectedTeamForBet
      ) {
        setBetString(
          `I bet that the team ${selectedTeamForBet} will score the first goal in the ${betNode.name} series`
        );
      } else if (
        selectedSeriesBetType === "Overtime Count" &&
        selectedSeriesOvertimeBetOperator &&
        seriesOvertimeBetInput
      ) {
        setBetString(
          `I bet that there will be ${selectedSeriesOvertimeBetOperator} ${seriesOvertimeBetInput} overtimes in the ${betNode.name} series`
        );
      }
    }
  }, [
    selectedEventTypeForBet,
    selectedTeamForBet,
    selectedSeriesBetType,
    seriesOvertimeBetInput,
    selectedSeriesOvertimeBetOperator,
    betNode,
  ]);

  return (
    <div>
      <h2>Welcome to the Create Wager Page</h2>
      <h3>Active Data Tree</h3>
      {data ? <div>{renderDataTree(data)}</div> : <p>Failed to load data.</p>}

      {/* User inputs for bet */}
      {selectedEventTypeForBet === "Series" && !selectedSeriesBetType && (
        <div>
          <h3>
            What type of bet would you like to make on this '{betNode.name}'
            series?
          </h3>
          <select
            value={""}
            onChange={handleSeriesBetTypeSelect}
            style={{ marginRight: "10px" }}
          >
            <option value="">Select a Bet Type</option>
            <option value="Series Win">Series Win</option>
            <option value="First Blood">First Blood</option>
            <option value="Overtime Count">Overtime Count</option>
          </select>
          <button
            onClick={handleBetCancel}
            style={{
              background: "#e01616",
              color: "white",
              border: "none",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {selectedEventTypeForBet === "Series" &&
        selectedSeriesBetType === "Series Win" && (
          <div style={{ marginTop: "20px" }}>
            <h3>
              I bet that the team{" "}
              <select
                value={selectedTeamForBet || ""}
                onChange={handleTeamSelect}
                style={{ marginRight: "10px" }}
              >
                <option value="">Select a team</option>
                {betNode.teams.map((team) => (
                  <option key={team._id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
              will win the {betNode.name}
            </h3>
            <button
              onClick={handleBetSubmit}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Confirm Bet
            </button>
            <button
              onClick={handleBetCancel}
              style={{
                background: "#e01616",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      {selectedEventTypeForBet === "Series" &&
        selectedSeriesBetType === "First Blood" && (
          <div style={{ marginTop: "20px" }}>
            <h3>
              I bet that the team{" "}
              <select
                value={selectedTeamForBet || ""}
                onChange={handleTeamSelect}
                style={{ marginRight: "10px" }}
              >
                <option value="">Select a team</option>
                {betNode.teams.map((team) => (
                  <option key={team._id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
              will score the first goal in the '{betNode.name}' series
            </h3>
            <button
              onClick={handleBetSubmit}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Confirm Bet
            </button>
            <button
              onClick={handleBetCancel}
              style={{
                background: "#e01616",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      {selectedEventTypeForBet === "Series" &&
        selectedSeriesBetType === "Overtime Count" && (
          <div style={{ marginTop: "20px" }}>
            <h3>
              I bet that there will be{" "}
              <select
                value={selectedSeriesOvertimeBetOperator}
                onChange={handleSeriesOvertimeBetSelect}
                style={{ marginRight: "10px" }}
              >
                <option value="exactly">exactly</option>
                <option value="more than">more than</option>
                <option value="less than">less than</option>
              </select>
              <input
                type="number"
                id="numberInput"
                value={seriesOvertimeBetInput}
                onChange={handleSeriesOvertimeBetInput}
                min="0"
                step="1"
              />{" "}
              overtime(s) in the '{betNode.name}' series
            </h3>
            <button
              onClick={handleBetSubmit}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Confirm Bet
            </button>
            <button
              onClick={handleBetCancel}
              style={{
                background: "#e01616",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
    </div>
  );
};

export default CreateWager;
