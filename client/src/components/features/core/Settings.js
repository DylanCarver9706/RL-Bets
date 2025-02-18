import React from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Settings</h2>
      <button onClick={() => {navigate("/Bug-Form")}} style={{ margin: "10px" }}>
        Report a Bug
      </button>
      <button onClick={() => {navigate("/Feature-Form")}} style={{ margin: "10px" }}>
        Suggest a Feature
      </button>
      <button onClick={() => {navigate("/Feedback-Form")}} style={{ margin: "10px" }}>
        Give General Feedback
      </button>
      <button onClick={() => {navigate("/Credits")}} style={{ margin: "10px" }}>
        Credits
      </button>
      <button onClick={() => {navigate("/Instructions")}} style={{ margin: "10px" }}>
        Instructions
      </button>
    </div>
  );
};

export default Settings;
