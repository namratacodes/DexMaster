import { useState } from "react";
import { motion } from "framer-motion";
import "./DexMasterIntro.css";

export default function DexMasterIntro({ onStart }) {
  const [scene, setScene] = useState("video");
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [fireIntensity, setFireIntensity] = useState(1);

  const handleVideoEnd = () => {
    setScene("fire");

    setTimeout(() => setShowText(true), 600);
    setTimeout(() => setShowButton(true), 2800);
    setTimeout(() => setFireIntensity(0.75), 1000);
    setTimeout(() => setFireIntensity(0.45), 2200);
    setTimeout(() => setFireIntensity(0.2), 3800);
    setTimeout(() => setFireIntensity(0), 5200);
  };

  const letters = "DexMaster".split("");

  return (
    <div className="intro-wrapper">

      {/* VIDEO — always mounted, hidden after fire starts */}
      <video
        src="/charizard.mp4"
        className="fullscreen-video"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        style={{ display: scene === "video" ? "block" : "none" }}
      />

      {/* FIRE + TEXT SCENE */}
      <div
        className="fire-scene"
        style={{
          opacity: scene === "fire" ? 1 : 0,
          pointerEvents: scene === "fire" ? "all" : "none",
          transition: "opacity 0.2s ease",
        }}
      >

        {/* REAL FIRE GIF — transparent background */}
        <img
          src="/fire.gif"
          className="real-fire"
          style={{ opacity: fireIntensity }}
          alt="fire"
        />

        {/* SECOND FIRE LAYER — offset for depth */}
        <img
          src="/fire.gif"
          className="real-fire real-fire-2"
          style={{ opacity: fireIntensity * 0.7 }}
          alt="fire"
        />

        {/* HEAT GLOW AT BOTTOM */}
        <div
          className="fire-glow"
          style={{ opacity: fireIntensity }}
        />

        {/* FLOATING EMBERS */}
        <div className="embers">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="ember"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                opacity: fireIntensity,
              }}
            />
          ))}
        </div>

        {/* DEXMASTER TEXT + BUTTON — centered */}
        <div className="text-block">

          {showText && (
            <div className="title-wrapper">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  className="lava-letter"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.12,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          )}

          {showButton && (
            <motion.button
              className="start-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              onClick={onStart}
            >
              Tap to Start
            </motion.button>
          )}

        </div>
      </div>

    </div>
  );
}