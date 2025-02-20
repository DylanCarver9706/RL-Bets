import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/components/Hero.css";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const teams = [
    {
      image: "/assets/NRG_2024_removebg.png",
    },
    {
      image: "/assets/Moist_Esports_removebg.png",
    },
    {
      image: "/assets/G2_Esports.png",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % teams.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [teams.length]);

  return (
    <div className="hero-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="text-container">
          <h1 className="hero-title">Welcome to RL Bets</h1>
          <p className="hero-subtitle">
            Compete, Bet, and Win Big during Rocket League Esports Tournaments!
          </p>
          <button className="cta-button" onClick={() => navigate("/Signup")}>
            Get Started
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works-section">
        <h2 className="section-title">How the App Works</h2>
        <div className="text-content">
          <p>
            During a tournament, there will be wagers that you can place bets
            on. Win bets to gain earned credits. The players with the most
            earned credits at the end of the tournament win real money and/or
            credits!
          </p>
        </div>
      </div>

      {/* Teams Carousel Section */}
      <div className="teams-carousel-section">
        <h2 className="section-title">Bet on Your Favorite Teams</h2>
        <div className="carousel-container">
          {teams.map((team, index) => (
            <div
              key={team.image}
              className={`carousel-slide ${
                index === currentSlide ? "active" : ""
              }`}
            >
              <div className="team-card">
                <img src={team.image} alt="Team logo" className="team-image" />
              </div>
            </div>
          ))}
          <div className="carousel-indicators">
            {teams.map((_, index) => (
              <button
                key={index}
                className={`indicator ${
                  index === currentSlide ? "active" : ""
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="final-cta-section">
        <h2>Ready to Start Betting?</h2>
        <button className="cta-button" onClick={() => navigate("/Signup")}>
          Join Now
        </button>
      </div>
    </div>
  );
};

export default Hero;
