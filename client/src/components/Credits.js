import React from "react";
import { useNavigate } from "react-router-dom";

const Credits = () => {
  const navigate = useNavigate();

  // Generate 50+ roles with the same name
  const roles = [
    "Project Manager",
    "Full-Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "UI/UX Designer",
    "Database Administrator",
    "DevOps Engineer",
    "Quality Assurance Tester",
    "Technical Writer",
    "Product Owner",
    "Scrum Master",
    "Graphic Designer",
    "API Architect",
    "System Analyst",
    "Security Analyst",
    "Performance Tester",
    "Deployment Specialist",
    "Mobile App Developer",
    "React Developer",
    "Node.js Developer",
    "Python Developer",
    "JavaScript Specialist",
    "MongoDB Expert",
    "Express.js Developer",
    "Firebase Administrator",
    "Jira Integration Specialist",
    "Data Analyst",
    "Accessibility Tester",
    "Cloud Engineer",
    "SEO Specialist",
    "Content Strategist",
    "Agile Coach",
    "Marketing Strategist",
    "Support Engineer",
    "Integration Engineer",
    "Logistics Coordinator",
    "Operations Manager",
    "End-User Support Specialist",
    "Data Scientist",
    "Game Theorist",
    "Mathematician",
    "Infrastructure Engineer",
    "Creative Director",
    "Animation Specialist",
    "Content Creator",
    "Digital Marketer",
    "System Architect",
    "Test Automation Engineer",
    "User Researcher",
    "Innovation Lead",
    "Chief Technologist",
    "Founder",
  ].map((role) => `${role}: Dylan Carver`);

  return (
    <div style={{ textAlign: "center",  position: "relative" }}>
      <h2 style={{ marginTop: "20px" }}>Credits</h2>
      <div
        style={{
          height: "80vh", // Adjust height to fit within the viewport, leaving space for title and button
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            animation: "scroll 20s linear infinite",
            position: "absolute",
            top: "100%",
            width: "100%",
            textAlign: "center",
          }}
        >
          {roles.map((role, index) => (
            <p key={index} style={{ margin: "5px 0" }}>
              {role}
            </p>
          ))}
        </div>
      </div>
      <button
        onClick={() => navigate("/Settings")}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          fontSize: "16px",
        }}
      >
        Back to Settings
      </button>
      <style>
        {`
          @keyframes scroll {
            0% { top: 100%; }
            100% { top: -100%; }
          }
        `}
      </style>
    </div>
  );
};

export default Credits;
