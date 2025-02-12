import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { updateUser } from "../services/userService";
import { useNavigate } from "react-router-dom";

const instructionData = [
  {
    title: "How the App Works",
    description:
      "During a tournament there will be wagers that a user can place a bet on.",
    image: "placeholder.jpg",
  },
  {
    title: "How the App Works",
    description: "Win bets to gain earned credits.",
    image: "placeholder.jpg",
  },
  {
    title: "How the App Works",
    description:
      "The players with the most earned credits at the end of the tournament win real money and/or credits.",
    image: "placeholder.jpg",
  },
  {
    title: "How Wagers Work",
    description: "A wager has an agree or disagree option.",
    image: "placeholder.jpg",
  },
  {
    title: "How Wagers Work",
    description:
      "A user is betting against the opposite option, but are also competing against the other users who are betting on the same option.",
    image: "placeholder.jpg",
  },
  {
    title: "How Wagers Work",
    description:
      "The more the user bets on that option, the more the user takes away from the other users who are betting on the same option.",
    image: "placeholder.jpg",
  },
];

const Instructions = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? instructionData.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === instructionData.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleFinish = async () => {
    if (user) {
      await updateUser(user.mongoUserId, { viewedInstructions: true });
      setUser({ ...user, viewedInstructions: true }); // Update user state
      navigate("/Wagers");
    } else {
      navigate("/");
    }
  };

  return (
    <div style={styles.carouselContainer}>
      <div style={styles.card}>
        <h2>{instructionData[currentIndex].title}</h2>
        <img
          src={instructionData[currentIndex].image}
          alt="Instruction"
          style={styles.image}
        />
        <p>{instructionData[currentIndex].description}</p>

        <p style={styles.slideCounter}>
          Slide {currentIndex + 1} / {instructionData.length}
        </p>

        <button onClick={prevSlide} style={styles.nextButton}>
          ◀ Back
        </button>
        {currentIndex === instructionData.length - 1 ? (
          <button onClick={handleFinish} style={styles.finishButton}>
            Finish
          </button>
        ) : (
          <>
            <button onClick={nextSlide} style={styles.nextButton}>
              Next ▶
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Instructions;

const styles = {
  carouselContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    padding: "20px",
  },
  card: {
    width: "400px",
    padding: "20px",
    textAlign: "center",
    borderRadius: "10px",
    backgroundColor: "rgb(99, 93, 93)",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
  image: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  navButton: {
    fontSize: "24px",
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: "none",
    color: "#fff",
  },
  nextButton: {
    marginTop: "10px",
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  },
  finishButton: {
    marginTop: "10px",
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "green",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  },
  slideCounter: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#fff",
  },
};
