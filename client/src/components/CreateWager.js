import React, { useEffect, useState } from "react";
import { fetchSeasonDataTree } from "../services/wagerService";

const CreateWager = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const seasonId = "66fa1588cbd894f17aa0363a"; // Hardcoded for demonstration; replace with dynamic as needed

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchSeasonDataTree(seasonId);
        setData(fetchedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonId]);

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
              // Exclude fields like "_id", "id", or specific reference fields that contain IDs
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
                  {renderDataTree(value, level + 1)}
                </CollapsibleSection>
              ) : (
                <div key={key} style={{ marginBottom: "5px" }}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                </div>
              );
            })}
        </div>
      );
    }
  };

  if (loading) {
    return <p>Loading data tree...</p>;
  }

  return (
    <div>
      <h2>Welcome to the Create Wager Page</h2>
      {data ? (
        <div>
          <h3>Data Tree Structure</h3>
          {renderDataTree(data)}
        </div>
      ) : (
        <p>Failed to load data.</p>
      )}
    </div>
  );
};

export default CreateWager;
