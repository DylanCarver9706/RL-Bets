import React, { useEffect, useState } from "react";
import {
  fetchAllSeasonsDataTree,
  updateSeasonById,
  updateTournamentById,
  updateSeriesById,
  updateMatchById,
  updateMatchResults,
} from "../services/adminService";

const Admin = () => {
  // Load data
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsData, setResultsData] = useState({});
  const [currentMatch, setCurrentMatch] = useState(null);
  const [wentToOvertime, setWentToOvertime] = useState(false);
  const [endTournament, setEndTournament] = useState(false);
  const [endSeason, setEndSeason] = useState(false);
  const [firstBlood, setFirstBlood] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetchAllSeasonsDataTree();
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };

    fetchData();
  }, []);

  // Collapsible component to handle toggling
  const CollapsibleSection = ({ title, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div style={{ marginTop: "10px" }}>
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
        {!isCollapsed && (
          <div
            style={{
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  };

  // Function to handle edit button click
  const handleEditClick = (data) => {
    setEditMode(data);
    setEditData(
      Object.fromEntries(
        Object.entries(data).filter(
          ([key, value]) => key !== "_id" && key !== "status" && (typeof value !== "object" || !Array.isArray(value))
        )
      )
    );
  };

  // Function to handle input changes in the edit form
  const handleChange = (key, value) => {
    setEditData({ ...editData, [key]: value });
  };

  // Function to handle save after editing
  const handleSave = async () => {
    try {
      switch (editMode.type) {
        case "season":
          await updateSeasonById(editMode._id, editData);
          break;
        case "tournament":
          await updateTournamentById(editMode._id, editData);
          break;
        case "series":
          await updateSeriesById(editMode._id, editData);
          break;
        case "match":
          await updateMatchById(editMode._id, editData);
          break;
        default:
          throw new Error("Invalid item type");
      }
      const updatedData = await fetchAllSeasonsDataTree();
      setData(updatedData);
      setEditMode(null);
    } catch (error) {
      console.error("Error updating data:", error.message);
    }
  };

  // Function to handle dropdown change
  const handleStatusChange = async (item, newStatus) => {
    try {
      if (item.type === "match" && newStatus === "Ended") {
        setShowResultsModal(true);
        setCurrentMatch(item);
        return;
      } else {
        switch (item.type) {
          case "season":
            await updateSeasonById(item._id, { status: newStatus });
            break;
          case "tournament":
            await updateTournamentById(item._id, { status: newStatus });
            break;
          case "series":
            await updateSeriesById(item._id, { status: newStatus });
            break;
          case "match":
            await updateMatchById(item._id, { status: newStatus });
            break;
          default:
            throw new Error("Invalid item type");
        }
        const updatedData = await fetchAllSeasonsDataTree();
        setData(updatedData);
      }
    } catch (error) {
      console.error("Error updating status:", error.message);
    }
  };

  // Function to handle results input change in the modal
  const handleResultsChange = (player, key, value) => {
    setResultsData((prevResults) => ({
      ...prevResults,
      [player]: {
        ...prevResults[player],
        [key]: value,
      },
    }));
  };

  // Function to handle saving match results
  const handleSaveResults = async () => {
    try {
      if (currentMatch) {
        const updatePayload = {
          results: resultsData,
          firstBlood,
          wentToOvertime,
          endTournament,
          endSeason,
        };
        await updateMatchResults(currentMatch._id, updatePayload);
        const updatedData = await fetchAllSeasonsDataTree();
        setData(updatedData);
        setShowResultsModal(false);
        setResultsData({});
        setFirstBlood(false);
        setWentToOvertime(false);
        setEndTournament(false);
        setEndSeason(false);
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error("Error updating match results:", error.message);
    }
  };

  const renderEditModal = () => (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#b3b1b1",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
      }}
    >
      <h3>Edit {editMode.type}</h3>
      {Object.entries(editData).map(([key, value]) => (
        <div key={key} style={{ marginBottom: "10px" }}>
          <label>
            {key}: 
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{ marginLeft: "10px", padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>
        </div>
      ))}
      <button onClick={handleSave} style={{ background: "#28a745", color: "white", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        Save
      </button>
      <button onClick={() => setEditMode(null)} style={{ marginLeft: "10px", background: "#dc3545", color: "white", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        Cancel
      </button>
    </div>
  );

  // Function to render the results modal as a table for input
  const renderResultsModal = () => (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#b3b1b1",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
      }}
    >
      <h3>Enter Match Results</h3>
      <div style={{ marginBottom: "15px" }}>
        <label>
          First Blood:
          <select
            value={firstBlood}
            onChange={(e) => setFirstBlood(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="">Select Team</option>
            {currentMatch &&
              currentMatch.teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="checkbox"
            checked={wentToOvertime}
            onChange={(e) => setWentToOvertime(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          Went to Overtime
        </label>
        <label style={{ marginLeft: "15px" }}>
          <input
            type="checkbox"
            checked={endTournament}
            onChange={(e) => setEndTournament(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          End Tournament
        </label>
        <label style={{ marginLeft: "15px" }}>
          <input
            type="checkbox"
            checked={endSeason}
            onChange={(e) => setEndSeason(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          End Season
        </label>
      </div>
      {currentMatch &&
        currentMatch.teams &&
        currentMatch.teams.flatMap((team) =>
          team.players.map((player) => (
            <div key={player._id} style={{ marginBottom: "10px" }}>
              <label>{player.name}:</label>
              <table style={{ width: "100%", marginTop: "5px", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Score", "Goals", "Assists", "Shots", "Saves", "Demos"].map((stat) => (
                      <th key={stat} style={{ border: "1px solid #ccc", padding: "5px", background: "#ddd" }}>
                        {stat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["score", "goals", "assists", "shots", "saves", "demos"].map((stat) => (
                      <td key={stat} style={{ border: "1px solid #ccc", padding: "5px" }}>
                        <input
                          type="number"
                          placeholder={`Enter ${stat}`}
                          value={resultsData[player.name]?.[stat] || ""}
                          onChange={(e) =>
                            handleResultsChange(player.name, stat, parseInt(e.target.value, 10) || 0)
                          }
                          style={{
                            width: "100%",
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}
      <button
        onClick={handleSaveResults}
        style={{
          background: "#28a745",
          color: "white",
          padding: "5px 10px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Save Results
      </button>
      <button
        onClick={() => {
          setShowResultsModal(false);
          setCurrentMatch(null);
        }}
        style={{
          marginLeft: "10px",
          background: "#dc3545",
          color: "white",
          padding: "5px 10px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Cancel
      </button>
    </div>
  );

  // Function to render each event as a card with a log/edit button
  const renderCard = (title, content, data) => (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "2px 2px 8px rgba(0, 0, 0, 0.1)",
        margin: "10px 0",
        padding: "15px",
      }}
    >
      <h3 style={{ margin: "0 0 10px" }}>
        {title}{" "}
        {["season", "tournament", "series", "match"].includes(data.type.toLowerCase()) && (
          <button
            onClick={() => handleEditClick(data)}
            style={{
              marginTop: "10px",
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "5px 10px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Edit
          </button>
        )}
      </h3>
      {/* Dropdown for status change */}
      {["season", "tournament", "series", "match"].includes(data.type.toLowerCase()) && (
        <div style={{ marginBottom: "10px" }}>
          <label>
            Status:
            <select
              value={data.status}
              onChange={(e) => handleStatusChange(data, e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="Betable">Betable</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Ended">Ended</option>
            </select>
          </label>
        </div>
      )}
      {content}
    </div>
  );

  // Function to render the results object as a table
  const renderResultsTable = (results) => {
    if (!results || typeof results !== "object") return null;

    const playerNames = Object.keys(results);
    const attributes = Object.keys(results[playerNames[0]] || {});

    const halfIndex = Math.ceil(playerNames.length / 2);

    return (
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
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

  // Recursive render function to display nested data as cards
  const renderDataTree = (node) => {
    if (!node || typeof node !== "object") return null;

    if (Array.isArray(node)) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {node.map((item, index) => (
            <div key={index} style={{ flex: "1 1 300px" }}>
              {renderCard(item.name || `Item ${index + 1}`, renderDataTree(item), item)}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div>
          {Object.entries(node).map(([key, value]) => {
            let title = value?.name || key.charAt(0).toUpperCase() + key.slice(1);
            if (key === "results" && typeof value === "object") {
              return (
                <CollapsibleSection key={key} title={title}>
                  {renderResultsTable(value)}
                </CollapsibleSection>
              );
            }

            if (Array.isArray(value)) {
              return (
                <CollapsibleSection key={key} title={title}>
                  {value.map((item, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>
                      {renderCard(item.name || `${title} ${index + 1}`, renderDataTree(item), item)}
                    </div>
                  ))}
                </CollapsibleSection>
              );
            }

            return typeof value === "object" ? (
              <CollapsibleSection key={key} title={title}>
                {renderCard(value.name || title, renderDataTree(value), value)}
              </CollapsibleSection>
            ) : (
              <div key={key} style={{ marginBottom: "5px" }}>
                <strong>{title}: </strong>
                {value}
              </div>
            );
          })}
        </div>
      );
    }
  };

  // Function to render top-level seasons as cards
  const renderSeasons = (seasons) => {
    return seasons.map((season, index) => (
      <CollapsibleSection key={index} title={`Season: ${season.name || `Season ${index + 1}`}`}>
        {renderCard(season.name || `Season ${index + 1}`, renderDataTree(season), season)}
      </CollapsibleSection>
    ));
  };

  return (
    <div>
      <h1>Admin Page - Season Data Overview</h1>
      {showResultsModal && renderResultsModal()}
      {editMode ? renderEditModal() : data ? renderSeasons(data) : <p>Loading data...</p>}
    </div>
  );
};

export default Admin;
