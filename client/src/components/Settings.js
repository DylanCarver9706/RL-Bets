import React from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  const handleReportProblem = () => {
    navigate("/Bug-Form");
  };

  const handleEnhancementRequest = () => {
    navigate("/Feature-Form");
  };

  const handleFeedback = () => {
    navigate("/Feedback-Form");
  };

  const handleCredits = () => {
    navigate("/Credits");
  };

  return (
    <div>
      <h2>Settings</h2>
      <button onClick={handleReportProblem} style={{ margin: "10px" }}>
        Report a Bug
      </button>
      <button onClick={handleEnhancementRequest} style={{ margin: "10px" }}>
        Suggest a Feature
      </button>
      <button onClick={handleFeedback} style={{ margin: "10px" }}>
        Give General Feedback
      </button>
      <button onClick={handleCredits} style={{ margin: "10px" }}>
        Credits
      </button>
    </div>
  );
};

export default Settings;
