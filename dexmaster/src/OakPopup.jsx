import { useState, useEffect } from 'react';
import './OakPopup.css';

// Random Oak dialogue lines for variety
const oakDialogues = [
  (name) => `Ah, ${name}! Good timing. Let me check my research notes...`,
  (name) => `${name}! You called at the right moment. I was just in the lab...`,
  (name) => `A trainer in need! Let me consult my Pokédex data, ${name}...`,
  (name) => `${name}! Reminds me of when I was a young researcher. Now let me think...`,
];

export default function OakPopup({ trainerName, correctOption, onClose }) {
  const [phase, setPhase] = useState(1);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [oakLine] = useState(() =>
    oakDialogues[Math.floor(Math.random() * oakDialogues.length)](trainerName)
  );

  // Phase 1 → Phase 2 after 2.2s
  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 2200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Typewriter for phase 2
  useEffect(() => {
    if (phase !== 2) return;
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (i < oakLine.length) {
        setDisplayedText(oakLine.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        setTimeout(() => setPhase(3), 900);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [phase, oakLine]);

  return (
    <div className="oak-popup__overlay">
      <div className="oak-popup__card">

        {/* ── PHASE 1 — CALLING ── */}
        {phase === 1 && (
          <div className="oak-popup__phase-1">
            <div className="oak-popup__phone-emoji">📞</div>
            <p className="oak-popup__calling-text">Calling Professor Oak...</p>
            <div className="oak-popup__loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* ── PHASE 2 & 3 — OAK APPEARS ── */}
        {(phase === 2 || phase === 3) && (
          <div className="oak-popup__phase-23">

            <div className="oak-popup__sprite-container">
              <div>
                <img
                  src="/professor-oak.png"
                  alt="Professor Oak"
                  className={`oak-popup__sprite ${phase === 2 ? 'talking' : ''}`}
                />
                <p className="oak-popup__name-tag">PROF. OAK</p>
              </div>
            </div>

            <div className="oak-popup__dialogue-box">
              <div className="oak-popup__dialogue-text">
                {phase === 2 && (
                  <p>
                    {displayedText}
                    {isTyping && <span className="oak-popup__cursor" />}
                  </p>
                )}
                {phase === 3 && (
                  <p>
                    The answer is{' '}
                    <span className="oak-popup__highlight">
                      {correctOption}
                    </span>
                    ! Good luck out there, {trainerName}!
                  </p>
                )}
              </div>
            </div>

            {phase === 3 && (
              <button className="oak-popup__close-btn" onClick={onClose}>
                THANKS, PROFESSOR!
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}