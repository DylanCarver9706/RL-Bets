import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSeasonDataTree, fetchTeams, createWager } from "../services/wagerService";

const CreateWager = () => {
  // Load data
  const [data, setData] = useState(null);
  const [teams, setTeams] = useState([]);
  const seasonId = "66fa1588cbd894f17aa0363a"; // Hardcoded for demonstration; replace with dynamic as needed
  
  // Track wager related info
  const [wagerString, setWagerString] = useState("");
  const [selectedWagerMajor, setSelectedWagerMajor] = useState(null);
  const [selectedWagerTeam, setSelectedWagerTeam] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchSeasonDataTree(seasonId);
        setData(fetchedData);

        const fetchedTeams = await fetchTeams();
        setTeams(fetchedTeams);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, [seasonId]);

  // Handle team selection and update the bet description
  const handleTeamSelect = (e) => {
    const teamName = e.target.value;
    setSelectedWagerTeam(teamName);

    if (teamName && selectedWagerMajor) {
      // Update the bet description when a team is selected
      setWagerString(`I bet that the team ${teamName} will win the ${selectedWagerMajor.name}`);
    }
  };

  // Function to submit the bet
  const handleBetSubmit = () => {
    console.log("Bet Submitted: ", wagerString);
    // Additional submission logic can be added here, such as sending to an API
    createWager({"name": wagerString})
    
    // Reset the wager state values
    setWagerString("")
    setSelectedWagerTeam("");
    setSelectedWagerMajor(null);
    navigate("/");
  };

  const handleBetCancel = () => {
    // Reset the wager state values
    setWagerString("")
    setSelectedWagerTeam("");
    setSelectedWagerMajor(null);
  };

  // Function to handle "Bet" button clicks
  const handleBetClick = (name, id, type) => {
    if (type === "major") {
      setSelectedWagerMajor({ name, id }); // Store the major bet
    }
    console.log(`Betting on ${name} with ID: ${id}`);
  };

  // Collapsible component to handle toggling
  const CollapsibleSection = ({ title, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

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

  // Function to render the results object as a table
  const renderResultsTable = (results) => {
    // Get the player names (columns) and attributes (rows)
    const playerNames = Object.keys(results);
    const attributes = Object.keys(results[playerNames[0]] || {});
  
    // Calculate the split index to insert the attribute header
    const halfIndex = Math.ceil(playerNames.length / 2);
  
    return (
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            {/* Render the player names and insert the attribute column in the middle */}
            {playerNames.map((player, index) => (
              <React.Fragment key={player}>
                {index === halfIndex && (
                  <th style={{ border: "1px solid #ddd", padding: "8px", background: "#b3b1b1" }}>Attribute</th>
                )}
                <th style={{ border: "1px solid #ddd", padding: "8px", background: "#b3b1b1" }}>{player}</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute) => (
            <tr key={attribute}>
              {/* Render the values for each player and insert the attribute name in the middle */}
              {playerNames.map((player, index) => (
                <React.Fragment key={player}>
                  {index === halfIndex && (
                    <td style={{ border: "1px solid #ddd", padding: "8px", background: "#b3b1b1" }}>
                      <strong>{attribute.charAt(0).toUpperCase() + attribute.slice(1)}</strong>
                    </td>
                  )}
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{results[player][attribute]}</td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Recursive render function to display nested data
  const renderDataTree = (node, level = 0) => {
    if (!node || typeof node !== "object") return null;
  
    if (Array.isArray(node)) {
      return (
        <ul style={{ listStyleType: "none", paddingLeft: level > 0 ? "20px" : "0" }}>
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
              const excludedKeys = ["_id", "id", "season", "major", "series", "team"];
              return !excludedKeys.includes(key) || typeof value !== "string";
            })
            .map(([key, value]) => {
              // Determine the collapsible title based on the key
              let title = "";
              if (key === "majors") title = "Majors";
              else if (key === "series") title = "Series";
              else if (key === "matches") title = "Matches";
              else if (key === "teams") title = "Teams";
              else if (key === "players") title = "Players";
              else if (key === "results") title = "Results";
  
              // Handle series: include team names in the series title if they exist
              if (key === "series" && Array.isArray(value)) {
                return value.map((seriesItem) => {
                  const seriesId = seriesItem._id;
                  const seriesName = seriesItem.name || "Series";
                  
                  // If the series has teams, extract their names
                  const teamNames = (seriesItem.teams || []).map((team) => team.name).join(" vs ");
                  const seriesTitle = teamNames ? `${seriesName}: [${teamNames}]` : seriesName;
  
                  // Render the series with the updated title
                  return (
                    <CollapsibleSection key={seriesId} title={seriesTitle}>
                      {renderDataTree(seriesItem, level + 1, key)}
                    </CollapsibleSection>
                  );
                });
              }
  
              // Skip rendering teams directly under matches or series
              if (key === "teams") {
                return null;
              }
  
              // Render results as a table
              if (key === "results" && typeof value === "object") {
                return (
                  <CollapsibleSection key={key} title={title || key}>
                    {renderResultsTable(value)}
                  </CollapsibleSection>
                );
              }
  
              // Recursively render if the value is an object or array
              return typeof value === "object" ? (
                <CollapsibleSection key={key} title={title || key}>
                  {renderDataTree(value, level + 1, key)}
                </CollapsibleSection>
              ) : (
                <div key={key} style={{ marginBottom: "5px" }}>
                  <strong>{value}</strong>
                  {/* Only show Bet button for majors, series, or matches */}
                  {level !== 0 && (
                    <button
                      onClick={() => handleBetClick(value, node._id, "major")}
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

  return (
    <div>
      <h2>Welcome to the Create Wager Page</h2>
      {data ? <div>{renderDataTree(data)}</div> : <p>Failed to load data.</p>}
      
      {/* Wager input for major bet */}
      {selectedWagerMajor && (
        <div style={{ marginTop: "20px" }}>
          <h3>
            I bet that the team{" "}
            <select value={selectedWagerTeam} onChange={handleTeamSelect} style={{ marginRight: "10px" }}>
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team._id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            will win the {selectedWagerMajor.name}
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
