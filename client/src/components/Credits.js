import React from "react";

const Credits = () => {
  // Generate 50+ roles with the same name
  const dylanRoles = [
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

  const otherRoles = [
    "Mathematician: Dawson Bauer",
    "Data Analyst: Dawson Bauer",
    "Actuary: Dawson Bauer",
  ]

  // Calculate total height and duration based on the number of roles
  const roleHeight = 30; // Approximate height of each role in pixels
  const totalHeight = (dylanRoles.length + otherRoles.length) * roleHeight + 200; // Add extra padding
  const scrollDuration = Math.ceil(totalHeight / 50); // Dynamic duration based on content size

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <h2 style={{ marginTop: "20px" }}>Credits</h2>
      <div
        style={{
          height: "80vh", // Adjust height to fit within the viewport
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            animation: `scroll ${scrollDuration}s linear infinite`,
            position: "absolute",
            top: "100%",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "5px 0" }}>RL Bets</p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          {[...dylanRoles, ...otherRoles].map((role, index) => (
            <p key={index} style={{ margin: "5px 0" }}>
              {role}
            </p>
          ))}
        </div>
      </div>
      <style>
        {`
          @keyframes scroll {
            0% { top: 100%; }
            100% { top: -${totalHeight}px; }
          }
        `}
      </style>
    </div>
  );
};

export default Credits;
