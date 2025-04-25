import React, { useState } from "react";
import { useUser } from "../../../contexts/UserContext";
import { updateUser } from "../../../services/userService";
import { useNavigate } from "react-router-dom";
import "../../../styles/components/core/Instructions.css";

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
      setUser({ ...user, viewedInstructions: true });
      navigate("/wagers");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="instructions-container">
      <div className="instruction-card">
        <h2 className="instruction-header">
          {instructionData[currentIndex].title}
        </h2>

        <div className="instruction-image-container">
          <span className="instruction-image-placeholder">
            Instruction Image Coming Soon
          </span>
        </div>

        <p className="instruction-description">
          {instructionData[currentIndex].description}
        </p>

        <p className="instruction-counter">
          Slide {currentIndex + 1} / {instructionData.length}
        </p>

        <div className="instruction-buttons">
          <button
            onClick={prevSlide}
            className="instruction-button back-button"
          >
            ◀ Back
          </button>

          {currentIndex === instructionData.length - 1 ? (
            <button
              onClick={handleFinish}
              className="instruction-button finish-button"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={nextSlide}
              className="instruction-button next-button"
            >
              Next ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Instructions;
