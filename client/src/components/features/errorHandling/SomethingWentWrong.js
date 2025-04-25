import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/components/errorHandling/SomethingWentWrong.css";

const SomethingWentWrong = () => {
  const navigate = useNavigate();

  const handleReportProblem = () => {
    navigate("/bug-form");
  };

  return (
    <div className="something-wrong-container">
      <div className="something-wrong-card">
        <div className="something-wrong-icon">⚠️</div>
        <h1 className="something-wrong-title">
          Whoopsie-Daisy! Something went wrong.
        </h1>
        <p className="something-wrong-message">
          A report has been sent to RL Bets to investigate why this happened.
        </p>
        <p className="something-wrong-message">
          If you would like to provide additional context to this crash, please
          fill out a Bug Report form.
        </p>
        <button
          className="something-wrong-button"
          onClick={handleReportProblem}
        >
          Report a Bug
        </button>
      </div>
    </div>
  );
};

export default SomethingWentWrong;
