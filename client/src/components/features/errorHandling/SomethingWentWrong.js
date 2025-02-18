import React from "react";
import { useNavigate } from "react-router-dom";

const SomethingWentWrong = () => {
  const navigate = useNavigate();

  const handleReportProblem = () => {
    navigate("/Bug-Form");
  };

  return (
    <div>
      <h1>Whoopsie-Daisy! Something went wrong.</h1>
      <p>
        A report has been sent to RL Bets to investigate why this happened. If
        you would like to provide additional context
      </p>
      <p>
        If you would like to provide additional context to this crash, please
        fill out a Bug Report form
      </p>
      <button onClick={handleReportProblem} style={{ margin: "10px" }}>
        Report a Bug
      </button>
    </div>
  );
};

export default SomethingWentWrong;
