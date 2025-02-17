import React, { useEffect, useState } from "react";
import {
  fetchEndedTournamentDataTree,
  fetchPlayers,
} from "../services/adminService";

const TournamentHistory = () => {
  const [data, setData] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchEndedTournamentDataTree();
        setData(fetchedData);

        const fetchedPlayers = await fetchPlayers();
        setPlayers(fetchedPlayers); // Fetch all players
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, []);

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

  const renderResultsTable = (results) => {
    if (!results || typeof results !== "object") return null;
  
    // Create a map of player IDs to names for quick lookup
    const playerIdToNameMap = players.reduce((map, player) => {
      map[player._id] = player.names.at(-1);
      return map;
    }, {});
  
    // Extract team IDs and their player data
    const teamIds = Object.keys(results);
    const [team1, team2] = teamIds;
  
    // Attributes to display
    const attributes = ["score", "goals", "assists", "shots", "saves", "demos"];
  
    return (
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            {/* Team 1 Player Names */}
            {results[team1].map((player) => (
              <th
                key={player.playerId}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  background: "#b3b1b1",
                }}
              >
                {playerIdToNameMap[player.playerId] || "Unknown"}
              </th>
            ))}
            {/* Attribute Column Header */}
            <th
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                background: "#b3b1b1",
              }}
            >
              Attribute
            </th>
            {/* Team 2 Player Names */}
            {results[team2].map((player) => (
              <th
                key={player.playerId}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  background: "#b3b1b1",
                }}
              >
                {playerIdToNameMap[player.playerId] || "Unknown"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute) => (
            <tr key={attribute}>
              {/* Team 1 Player Stats */}
              {results[team1].map((player) => (
                <td
                  key={`${player.playerId}-${attribute}`}
                  style={{ border: "1px solid #ddd", padding: "8px" }}
                >
                  {player[attribute]}
                </td>
              ))}
              {/* Attribute Name Column */}
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  background: "#b3b1b1",
                  fontWeight: "bold",
                }}
              >
                {attribute.charAt(0).toUpperCase() + attribute.slice(1)}
              </td>
              {/* Team 2 Player Stats */}
              {results[team2].map((player) => (
                <td
                  key={`${player.playerId}-${attribute}`}
                  style={{ border: "1px solid #ddd", padding: "8px" }}
                >
                  {player[attribute]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

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
              const excludedKeys = [
                "_id",
                "id",
                "tournament",
                "series",
                "team",
              ];
              return !excludedKeys.includes(key) || typeof value !== "string";
            })
            .map(([key, value]) => {
              let title = "";
              if (key === "tournaments") title = "Tournaments";
              else if (key === "series") title = "Series";
              else if (key === "matches") title = "Matches";
              else if (key === "teams") title = "Teams";
              else if (key === "players") title = "Players";
              else if (key === "results") title = "Results";

              if (key === "series" && Array.isArray(value)) {
                return value.map((seriesItem) => {
                  const seriesId = seriesItem?._id;
                  const seriesName = seriesItem?.name || "Series";
                  const teamNames = (seriesItem?.teams || [])
                    .map((team) => team.name)
                    .join(" vs ");
                  const seriesTitle = teamNames
                    ? `${seriesName}: [${teamNames}]`
                    : seriesName;

                  return (
                    <CollapsibleSection key={seriesId} title={seriesTitle}>
                      {renderDataTree(seriesItem, level + 1)}
                    </CollapsibleSection>
                  );
                });
              }

              if (key === "teams") {
                return null;
              }

              if (key === "results" && typeof value === "object") {
                return (
                  <CollapsibleSection key={key} title={title || key}>
                    {renderResultsTable(value)}
                  </CollapsibleSection>
                );
              }

              return typeof value === "object" ? (
                <CollapsibleSection key={key} title={title || key}>
                  {renderDataTree(value, level + 1)}
                </CollapsibleSection>
              ) : (
                <div key={key} style={{ marginBottom: "5px" }}>
                  <strong>{value || "-"}</strong>
                </div>
              );
            })}
        </div>
      );
    }
  };

  return (
    <div>
      {data ? <div>{renderDataTree(data)}</div> : <p>Failed to load data.</p>}
    </div>
  );
};

export default TournamentHistory;
