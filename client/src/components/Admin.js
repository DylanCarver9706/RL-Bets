import React, { useEffect, useState } from "react";
import { fetchAllSeasonsDataTree, updateSeasonById, updateTournamentById, updateSeriesById, updateMatchById } from "../services/adminService";

const Admin = () => {
  // Load data
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(null); // Track which item is being edited
  const [editData, setEditData] = useState({}); // Store the data being edited

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
    console.log("Edit clicked for:", data);
    setEditMode(data);
    setEditData(
      Object.fromEntries(
        Object.entries(data).filter(
          ([key, value]) => key !== "_id" && (typeof value !== "object" || Array.isArray(value) === false)
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
      // Refresh data after updating
      const updatedData = await fetchAllSeasonsDataTree();
      setData(updatedData);
      setEditMode(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating data:", error.message);
    }
  };

  // Function to render the edit modal
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
      {content}
    </div>
  );
// Function to render the results object as a table
const renderResultsTable = (results) => {
    if (!results || typeof results !== "object") return null;

    // Get the player names (columns) and attributes (rows)
    const playerNames = Object.keys(results);
    const attributes = Object.keys(results[playerNames[0]] || {});

    // Calculate the split index to insert the attribute header
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
      {editMode ? renderEditModal() : data ? renderSeasons(data) : <p>Loading data...</p>}
    </div>
  );
};

export default Admin;
