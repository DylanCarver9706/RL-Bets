import React from "react";

const Hero = () => {
  return (
    <div style={styles.heroContainer}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.textContainer}>
          <h1 style={styles.title}>Welcome to RL Bets</h1>
          <p style={styles.subtitle}>
            Compete, Bet, and Win Big during Rocket League Esports Tournaments!
          </p>
          <button style={styles.ctaButton}>Get Started</button>
        </div>
        <div style={styles.imagePlaceholder}> {/* Placeholder for images */}
          <p>Image Placeholder</p>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>How the App Works</h2>
        <div style={styles.contentContainer}>
          <div style={styles.textContent}>
            <p>
              During a tournament, there will be wagers that you can place bets on.
              Win bets to gain earned credits. The players with the most earned credits at the end of the tournament win real money and/or credits!
            </p>
          </div>
          <div style={styles.imagePlaceholder}> {/* Placeholder for images */}
            <p>Image Placeholder</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Why Choose RL Bets?</h2>
        <div style={styles.featuresContainer}>
          <div style={styles.featureItem}>
            <h3>Exciting Tournaments</h3>
            <p>Bet on live Rocket League esports tournaments and win big.</p>
          </div>
          <div style={styles.featureItem}>
            <h3>Earned Credits</h3>
            <p>Climb the leaderboard with your earned credits from winning bets.</p>
          </div>
          <div style={styles.featureItem}>
            <h3>Real Rewards</h3>
            <p>Win real money and credits when you top the leaderboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  heroContainer: {
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  heroSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "50px 20px",
    backgroundColor: "#f5f5f5",
  },
  textContainer: {
    maxWidth: "600px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "20px",
  },
  ctaButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  imagePlaceholder: {
    width: "300px",
    height: "200px",
    backgroundColor: "#ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#555",
    borderRadius: "8px",
  },
  howItWorksSection: {
    padding: "50px 20px",
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: "32px",
    marginBottom: "20px",
    textAlign: "center",
  },
  contentContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContent: {
    maxWidth: "600px",
    fontSize: "18px",
  },
  featuresSection: {
    padding: "50px 20px",
    backgroundColor: "#f5f5f5",
  },
  featuresContainer: {
    display: "flex",
    justifyContent: "space-around",
  },
  featureItem: {
    maxWidth: "300px",
    textAlign: "center",
  },
};

export default Hero;
