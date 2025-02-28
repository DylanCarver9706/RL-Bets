import React from "react";
import "../../../styles/components/about/Credits.css";

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
  ];

  // Calculate total height and duration based on the number of roles
  const roleHeight = 30; // Approximate height of each role in pixels
  const totalHeight =
    (dylanRoles.length + otherRoles.length) * roleHeight + 200; // Add extra padding
  const scrollDuration = Math.ceil(totalHeight / 50); // Dynamic duration based on content size

  return (
    <div className="about-container">
      <h1 className="about-header">Credits</h1>
      <div className="credits-container">
        <div className="credits-scroll">
          <div
            className="credits-content"
            style={{
              animation: `scroll ${scrollDuration}s linear infinite`,
              top: "100%",
            }}
          >
            <h2 className="credits-title">RL Bets</h2>
            {[...dylanRoles, ...otherRoles].map((role, index) => {
              const [title, name] = role.split(": ");
              return (
                <p key={index} className="credits-role">
                  {title}: <span className="credits-name">{name}</span>
                </p>
              );
            })}
          </div>
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
