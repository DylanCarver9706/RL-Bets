import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJiraIssue } from "../services/jiraService";
import { useUser } from "../context/UserContext.js";

const FeatureForm = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  // State variables for inputs
  const [summary, setSummary] = useState("");
  const [useCase, setUseCase] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [impact, setImpact] = useState("");
  const [priority, setPriority] = useState("");
  const [relatedFeatures, setRelatedFeatures] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!summary || !useCase || !expectedBehavior || !impact || !priority) {
      setError("Please fill out all required fields.");
      return;
    }
    if (summary.length > 255) {
      setError("Summary cannot exceed 255 characters.");
      return;
    }

    // Compile the description
    const description = `Use Case:\n${useCase.trim()}\n\nExpected Behavior:\n${expectedBehavior.trim()}\n\nImpact:\n${impact.trim()}\n\nPriority:\n${priority.trim()}\n\nRelated Features:\n${relatedFeatures.trim()}\n\nAdditional Details:\n${additionalDetails.trim()}`;

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
        setSummary("");
        setUseCase("");
        setExpectedBehavior("");
        setImpact("");
        setPriority("");
        setRelatedFeatures("");
        setAdditionalDetails("");
        navigate("/");
      }
    } catch (error) {
      alert("Failed to submit feature request. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Suggest a Feature</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}{" "}
      {/* Display validation error */}
      <h3>All fields marked with a "*" are required.</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Summary*:</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Use Case*:</label>
          <textarea
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Expected Behavior*:</label>
          <textarea
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Impact*:</label>
          <textarea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Priority*:</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          >
            <option value="">Select Priority</option>
            <option value="Critical">Critical</option>
            <option value="Important">Important</option>
            <option value="Nice to Have">Nice to Have</option>
            <option value="Low Priority">Low Priority</option>
          </select>
        </div>
        <div>
          <label>Related Features:</label>
          <textarea
            value={relatedFeatures}
            onChange={(e) => setRelatedFeatures(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Additional Details:</label>
          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <button type="submit">Submit Feature</button>
      </form>
    </div>
  );
};

export default FeatureForm;
