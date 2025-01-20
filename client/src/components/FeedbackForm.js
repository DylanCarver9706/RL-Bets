import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJiraIssue } from "../services/jiraService";
import { useUser } from "../context/UserContext.js";

const FeedbackForm = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!summary || !description) {
      setError("Summary and Description are required.");
      return;
    }
    if (summary.length > 255) {
      setError("Summary cannot exceed 255 characters.");
      return;
    }
    if (description.length > 32500) {
      setError("Description cannot exceed 32,500 characters.");
      return;
    }

    try {
      const response = await createJiraIssue(
        user?.name || "Unknown",
        user?.email || "Unknown",
        user?.mongoUserId || "Unknown",
        "Story",
        summary,
        description,
        "BETA TESTER FEEDBACK - GENERAL"
      );

      if (response.status === 200) {
        alert("Feedback submitted successfully!");
        setSummary("");
        setDescription("");
        navigate("/Wagers");
      }
    } catch (error) {
      alert("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Give Feedback</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}{" "}
      {/* Display validation error */}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Summary:</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Feedback:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          />
        </div>
        <button type="submit">Submit Feedback</button>
      </form>
    </div>
  );
};

export default FeedbackForm;
