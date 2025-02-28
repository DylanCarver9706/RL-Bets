import React, { useEffect, useState } from "react";
import {
  fetchAllEventsDataTree,
  fetchPlayers,
} from "../../../services/adminService";
import "../../../styles/components/tournaments/TournamentHistory.css";

const TournamentHistory = () => {
  const [eventData, setEventData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchAllEventsDataTree();
        setEventData(fetchedData);
        const fetchedPlayers = await fetchPlayers();
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, []);

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderResultsTable = (match) => {
    if (!match?.results) return null;

    const team1Id = match.teams[0]._id;
    const team2Id = match.teams[1]._id;
    const team1Results = match.results[team1Id];
    const team2Results = match.results[team2Id];
    const team1Name = match.teams[0].name;
    const team2Name = match.teams[1].name;

    const attributes = ["score", "goals", "assists", "shots", "saves", "demos"];

    return (
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              {/* Team Names Row */}
              <th
                colSpan={team1Results.length}
                className="team-name team1-name"
              >
                {team1Name}
              </th>
              <th className="attribute-header">Attribute</th>
              <th
                colSpan={team2Results.length}
                className="team-name team2-name"
              >
                {team2Name}
              </th>
            </tr>
            <tr>
              {/* Team 1 Players */}
              {team1Results.map((player) => (
                <th key={player.playerId} className="player-name team1-player">
                  {players
                    .find((p) => p._id === player.playerId)
                    ?.names.at(-1) || "Unknown"}
                </th>
              ))}
              {/* Center Column */}
              <th className="attribute-header"></th>
              {/* Team 2 Players */}
              {team2Results.map((player) => (
                <th key={player.playerId} className="player-name team2-player">
                  {players
                    .find((p) => p._id === player.playerId)
                    ?.names.at(-1) || "Unknown"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute) => (
              <tr key={attribute}>
                {/* Team 1 Stats */}
                {team1Results.map((player) => (
                  <td
                    key={`${player.playerId}-${attribute}`}
                    className="team1-stats"
                  >
                    {player[attribute]}
                  </td>
                ))}
                {/* Attribute Name */}
                <td className="attribute-name">
                  {attribute.charAt(0).toUpperCase() + attribute.slice(1)}
                </td>
                {/* Team 2 Stats */}
                {team2Results.map((player) => (
                  <td
                    key={`${player.playerId}-${attribute}`}
                    className="team2-stats"
                  >
                    {player[attribute]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMatchDetails = (seriesData) => {
    if (!seriesData?.teams || !seriesData?.matches) return null;

    const seriesName = seriesData.name.split(" -> ").pop();

    return (
      <div className="tree-node">
        <div className="node-header" onClick={() => toggleNode(seriesData._id)}>
          <span className="expand-icon">
            {expandedNodes.has(seriesData._id) ? "▼" : "▶"}
          </span>
          {seriesName}
        </div>
        {expandedNodes.has(seriesData._id) && (
          <div className="node-children">
            {seriesData.matches.map((match, index) => (
              <div key={match._id} className="tree-node">
                <div
                  className="node-header match-header"
                  onClick={() => toggleNode(match._id)}
                >
                  <span className="expand-icon">
                    {expandedNodes.has(match._id) ? "▼" : "▶"}
                  </span>
                  Match {index + 1}
                </div>
                {expandedNodes.has(match._id) && renderResultsTable(match)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to create unique node IDs based on path
  const createNodeId = (node, parentPath = "") => {
    const path = parentPath ? `${parentPath} -> ${node.name}` : node.name;
    return `node-${path}`;
  };

  const renderBracketNode = (node, parentPath = "") => {
    if (!node) return null;

    const nodeId = node.seriesData?._id || createNodeId(node, parentPath);

    return (
      <div className="tree-node">
        {node.seriesData ? (
          renderMatchDetails(node.seriesData)
        ) : (
          <>
            <div className="node-header" onClick={() => toggleNode(nodeId)}>
              <span className="expand-icon">
                {expandedNodes.has(nodeId) ? "▼" : "▶"}
              </span>
              {node.name}
            </div>
            {expandedNodes.has(nodeId) &&
              node.children &&
              node.children.length > 0 && (
                <div className="node-children">
                  {node.children.map((child, index) => (
                    <div key={index}>{renderBracketNode(child, nodeId)}</div>
                  ))}
                </div>
              )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="tournament-history">
      {eventData ? (
        <div className="tournament-tree">
          {eventData.tournaments.map((tournament) => (
            <div key={tournament.name} className="tree-node">
              <div
                className="node-header tournament-header"
                onClick={() => toggleNode(`tournament-${tournament.name}`)}
              >
                <span className="expand-icon">
                  {expandedNodes.has(`tournament-${tournament.name}`)
                    ? "▼"
                    : "▶"}
                </span>
                {tournament.name}
              </div>
              {expandedNodes.has(`tournament-${tournament.name}`) &&
                tournament.children && (
                  <div className="node-children">
                    {tournament.children.map((child, index) => (
                      <div key={index}>
                        {renderBracketNode(child, tournament.name)}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <p>Loading tournament data...</p>
      )}
    </div>
  );
};

export default TournamentHistory;
