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

  // Function to reorder keys so that arrays are last
  const reorderObject = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(reorderObject);

    const entries = Object.entries(obj);
    const nonArrayEntries = entries.filter(([_, value]) => !Array.isArray(value));
    const arrayEntries = entries.filter(([_, value]) => Array.isArray(value));

    return Object.fromEntries(
      [...nonArrayEntries, ...arrayEntries].map(([key, value]) => [
        key,
        reorderObject(value),
      ])
    );
  };

  // Recursive render function to display nested data as cards
  const renderDataTree = (node) => {
    if (!node || typeof node !== "object") return null;

    if (Array.isArray(node)) {
      return (
        <div style={{ gap: "10px" }}>
          {node.map((item, index) => (
            <div key={index} style={{ flex: "1 1 300px" }}>
              {renderDataTree(item)}
            </div>
          ))}
        </div>
      );
    } else {
      node = reorderObject(node); // Reorder the node to place arrays last

      return (
        <div>
          {Object.entries(node).map(([key, value]) => {
            let title = key.charAt(0).toUpperCase() + key.slice(1);
            if (key === "tournaments") title = "Tournaments";
            else if (key === "series") title = "Series";
            else if (key === "matches") title = "Matches";
            else if (key === "teams") title = "Teams";
            else if (key === "players") title = "Players";
            else if (key === "results") title = "Results";

            // Render as a collapsible section
            return typeof value === "object" ? (
              <CollapsibleSection key={key} title={title}>
                {renderCard(title, renderDataTree(value))}
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
        {renderCard(`Season: ${season.name || `Season ${index + 1}`}`, renderDataTree(season))}
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
