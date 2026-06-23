import { useState, useEffect } from 'react';
import './WCSScreen.css';

const wcsLevels = [
  { number: 1,  label: 'Round 1' },
  { number: 2,  label: 'Round 2' },
  { number: 3,  label: 'Round 3' },
  { number: 4,  label: 'Round 4' },
  { number: 5,  label: 'Round 5' },
  { number: 6,  label: 'Round 6' },
  { number: 7,  label: 'Round 7' },
  { number: 8,  label: 'Round 8' },
  { number: 9,  label: 'Round 9' },
  { number: 10, label: 'FINAL' },
];

export default function WCSScreen({
  questionText,
  options,
  correctIndex,
  currentLevel = 1,
  trainerName = 'Champion',
  onAnswer,
  timeLimit = 30,
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Reset timer when question changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
    setSelectedAnswer(null);
    setAnswered(false);
  }, [questionText, timeLimit]);

  // Countdown
  useEffect(() => {
    if (answered) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAnswered(true);
          onAnswer && onAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [answered, questionText]);

  const handleAnswerClick = (index) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    onAnswer && onAnswer(index);
  };

  const timerPct = (timeRemaining / timeLimit) * 100;
  const isUrgent = timeRemaining < 10;

  return (
    <div className="wcs-screen">

      {/* FIRE GIF BACKGROUND */}
      <img src="/fire.gif" className="wcs-fire-bg" alt="" />
      <div className="wcs-fire-overlay" />

      {/* EMBER PARTICLES */}
      <div className="wcs-embers">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="wcs-ember"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="wcs-navbar">
        <div className="wcs-navbar-left">
          <h1 className="wcs-title">World Coronation Series</h1>
        </div>
        <div className="wcs-navbar-right">
          <div className="wcs-trainer-chip">
            <div className="wcs-trainer-avatar">
              {trainerName.charAt(0).toUpperCase()}
            </div>
            <span className="wcs-trainer-name">{trainerName}</span>
          </div>
        </div>
      </nav>

      {/* MAIN AREA */}
      <div className="wcs-main">

        {/* LEFT — PRIZE LADDER */}
        <aside className="wcs-ladder">
          <div className="wcs-ladder-title">Journey</div>
          {wcsLevels.map(level => (
            <div
              key={level.number}
              className={`wcs-ladder-item
                ${level.number === currentLevel ? 'wcs-active' : ''}
                ${level.number < currentLevel ? 'wcs-passed' : ''}
                ${level.number > currentLevel ? 'wcs-future' : ''}
                ${level.number === 10 ? 'wcs-final' : ''}
              `}
            >
              <span className="wcs-ladder-num">
                {level.number < currentLevel ? '✓' : `Q${level.number}`}
              </span>
              <span className="wcs-ladder-label">{level.label}</span>
            </div>
          ))}
        </aside>

        {/* CENTER — QUESTION + ANSWERS */}
        <div className="wcs-center">

          {/* TIMER */}
          <div className="wcs-timer-wrap">
            <div className="wcs-timer-track">
              <div
                className={`wcs-timer-fill ${isUrgent ? 'urgent' : ''}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span className={`wcs-timer-text ${isUrgent ? 'urgent-text' : ''}`}>
              {timeRemaining}s
            </span>
          </div>

          {/* LEVEL INDICATOR */}
          <div className="wcs-level-badge">
            {currentLevel === 10
              ? '⚔️ Grand Final'
              : `Round ${currentLevel} of 10`}
          </div>

          {/* QUESTION CARD */}
          <div className="wcs-question-card">
            <p className="wcs-question-text">{questionText}</p>
          </div>

          {/* ANSWERS */}
          <div className="wcs-answers-grid">
            {options.map((option, index) => (
              <button
                key={index}
                className={`wcs-answer-btn
                  ${answered ? 'wcs-disabled' : ''}
                  ${answered && index === correctIndex ? 'wcs-correct' : ''}
                  ${answered && selectedAnswer === index && index !== correctIndex ? 'wcs-wrong' : ''}
                `}
                onClick={() => handleAnswerClick(index)}
                disabled={answered}
              >
                <span className="wcs-answer-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="wcs-answer-text">{option}</span>
              </button>
            ))}
          </div>

          {/* NO LIFELINES MESSAGE */}
          <div className="wcs-no-lifelines">
            ⚔️ World Coronation Series — No lifelines. No second chances.
          </div>

        </div>
      </div>
    </div>
  );
}