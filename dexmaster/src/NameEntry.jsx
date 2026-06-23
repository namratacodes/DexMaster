import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./NameEntry.css";

export default function NameEntry({ trainerName, onConfirm }) {
  const [name, setName] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  const fullText = "Before we begin... what is your name, Trainer?";

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setDisplayText("");
    setDoneTyping(false);

    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayText(fullText.slice(0, i + 1));
        i++;
      } else {
        setDoneTyping(true);
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  // Random ember positions — generated once
  const embers = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 2 + Math.random() * 4,
  }));

  return (
    <motion.div
      className="name-entry-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* EMBER PARTICLES */}
      <div className="embers">
        {embers.map((e) => (
          <div
            key={e.id}
            className="ember"
            style={{
              left: `${e.left}%`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              width: `${e.size}px`,
              height: `${e.size}px`,
            }}
          />
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="name-entry-content">

        {/* LEFT — Professor Oak */}
        <motion.div
          className="oak-panel"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
        >
          <div className="oak-frame">
            <img
              src="/professor-oak.png"
              alt="Professor Oak"
              className="oak-sprite"
            />
          </div>
          <p className="oak-label">Prof. Oak</p>
        </motion.div>

        {/* RIGHT — Dialogue + Input */}
        <motion.div
          className="dialogue-panel"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
        >

          {/* DIALOGUE BOX */}
          <div className="dialogue-box">
            <p className="dialogue-text">
              {displayText}
              {!doneTyping && <span className="cursor">|</span>}
            </p>
          </div>

          {/* INPUT AREA */}
          <AnimatePresence>
            {doneTyping && (
              <motion.div
                className="input-area"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="input-box">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    onKeyDown={handleKey}
                    placeholder="ENTER NAME..."
                    className="name-input"
                    maxLength={12}
                    autoFocus
                  />
                  <span className="char-count">{name.length}/12</span>
                </div>

                <button
                  className="confirm-btn"
                  onClick={handleConfirm}
                  disabled={!name.trim()}
                >
                  CONFIRM
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </motion.div>
  );
}