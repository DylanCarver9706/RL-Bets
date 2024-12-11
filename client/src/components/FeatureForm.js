import React, { useState } from "react";
import { createJiraIssue } from "../services/jiraService";
import { useUser } from "../context/UserContext.js";

const FeatureForm = () => {
  const { user } = useUser();
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createJiraIssue(
        user.name,
        user.email,
        user.mongoUserId,
        "Enhancement Request",
        summary,
        description,
        "Beta Tester Feedback - Enhancement Requests"
      );

      if (response.status === 200) {
        alert("Feature request submitted successfully!");
      }

      setSummary("");
      setDescription("");
    } catch (error) {
      alert("Failed to submit feature request. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Suggest a Feature</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Summary:</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          />
        </div>
        <button type="submit">Submit Feature</button>
      </form>
    </div>
  );
};

export default FeatureForm;
