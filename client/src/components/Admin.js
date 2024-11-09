import React, { useEffect, useState } from "react";
import { fetchAllSeasonsDataTree } from "../services/adminService";

const Admin = () => {
  // Load data
  const [data, setData] = useState(null);

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

  // Function to render each event as a card
  const renderCard = (title, content) => (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "2px 2px 8px rgba(0, 0, 0, 0.1)",
        margin: "10px 0",
        padding: "15px",
      }}
    >
      <h3 style={{ margin: "0 0 10px" }}>{title}</h3>
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
              {renderCard(item.name || `Item ${index + 1}`, renderDataTree(item))}
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
                      {renderCard(item.name || `${title} ${index + 1}`, renderDataTree(item))}
                    </div>
                  ))}
                </CollapsibleSection>
              );
            }

            return typeof value === "object" ? (
              <CollapsibleSection key={key} title={title}>
                {renderCard(value.name || title, renderDataTree(value))}
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
        {renderCard(season.name || `Season ${index + 1}`, renderDataTree(season))}
      </CollapsibleSection>
    ));
  };

  return (
    <div>
      <h1>Admin Page - Season Data Overview</h1>
      {data ? renderSeasons(data) : <p>Loading data...</p>}
    </div>
  );
};

export default Admin;
