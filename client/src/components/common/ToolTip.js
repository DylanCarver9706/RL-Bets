import React from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "../../styles/components/common/Tooltip.css";

const Tooltip = ({ infoText }) => {
  const id = Math.random().toString(36).substr(2, 9);

  return (
    <span className="tooltip-container">
      <span className="tooltip-icon" data-tooltip-id={id} aria-label="info">
        <span className="tooltip-text">i</span>
      </span>
      <ReactTooltip
        id={id}
        content={infoText}
        className="custom-tooltip"
        place="bottom"
        delayShow={200}
        opacity={1}
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "0.8rem",
          borderRadius: "6px",
          fontSize: "0.85rem",
          maxWidth: "250px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          zIndex: 9999,
        }}
      />
    </span>
  );
};

export default Tooltip;
