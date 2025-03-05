import React from "react";
import "../../styles/components/common/Spinner.css";

const Spinner = ({ pageLoad = true }) => {
  const size = pageLoad ? 96 : 48;
  if (pageLoad) {
    return (
      <div className="spinner-container">
        <span
          className="loader"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: "10px solid #034da4",
            borderBottomColor: "#fb6a31",
          }}
        ></span>
      </div>
    );
  } else {
    return (
      <span
        className="loader"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: "5px solid #034da4",
          borderBottomColor: "#fb6a31",
        }}
      ></span>
    );
  }
};

export default Spinner;
