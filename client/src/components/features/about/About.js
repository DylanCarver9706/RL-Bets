import "../../../styles/components/about/About.css";

const About = () => {
  return (
    <div className="about-content-container">
      <div className="about-container">
        <h1 className="about-header">About Us</h1>
        <div className="about-content">
          <p>
            <span className="gradient-text">RL Bets</span> is a platform to
            place bets on professional Rocket League tournaments. The idea was
            always there. Rocket League is a sport with a ball, so it is only
            fair that we should be able to bet on that.
          </p>
          <p>
            The motivation to make this came when I attended RLCS in 2024 in
            Dallas, Texas and heard a group of people one row behind me keeping
            track of how many demos a particular team would have in a series.
            Their bet was either over/under 30 demos. Though I couldn't hear
            what they were wagering for this, it didn't matter because this bet
            brought them together and made them look at the game differently.
          </p>
          <p>
            From the triple flips resets to the own goals, there is always
            something amazing about Rocket League we can be excited about. That
            is how I view the game, and this is my contribution to the amazing
            community of Rocket League.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
