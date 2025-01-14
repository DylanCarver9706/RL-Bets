import React, { useState } from "react";

const Tooltip = ({ infoText }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
  };

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          display: "inline-block",
          width: "20px",
          height: "20px",
          backgroundColor: "#007BFF",
          color: "white",
          borderRadius: "50%",
          textAlign: "center",
          lineHeight: "20px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        i
      </span>
      {isTooltipVisible && (
        <span
          style={{
            position: "absolute",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "8px",
            borderRadius: "5px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {infoText}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
