import { useState, useEffect } from 'react';
import OakPopup from './OakPopup';
import './QuizScreen.css';

export default function QuizScreen({
  questionText,
  options,
  correctIndex,      // ← new
  currentLevel,
  region,
  trainerName,
  onAnswer,
  onLifeline50,
  onLifelineOak,
  onBack, 
  lifelines,
  eliminatedOptions, // ← new
  badgesEarned,
  successProbability = 50,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showOakPopup, setShowOakPopup] = useState(false);

  const handleAnswer = (index) => {
    if (isAnswered) return;
    if (eliminatedOptions.includes(index)) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    onAnswer(index);
  };

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, [questionText]);

  const levels = [
    { number: 9, label: 'League Final', isLeague: true },
    { number: 8, label: 'Gym 8' },
    { number: 7, label: 'Gym 7' },
    { number: 6, label: 'Gym 6' },
    { number: 5, label: 'Gym 5' },
    { number: 4, label: 'Gym 4' },
    { number: 3, label: 'Gym 3' },
    { number: 2, label: 'Gym 2' },
    { number: 1, label: 'Gym 1' },
  ];

  const isLevelCompleted = (levelNum) => {
    if (levelNum === 9) return badgesEarned.league;
    return badgesEarned.gym[levelNum - 1];
  };

  const getLevelClass = (levelNum) => {
    if (levelNum === currentLevel) return 'current';
    if (isLevelCompleted(levelNum)) return 'completed';
    if (levelNum > currentLevel) return 'future';
    return '';
  };

  return (
    <div className="quiz-screen">

      {/* TOP NAVBAR */}
      <nav className="quiz-navbar">
        <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid rgba(255,140,0,0.4)',
              borderRadius: '8px',
              color: 'rgba(255,140,0,0.7)',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              padding: '6px 10px',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.borderColor = '#ff8c00'}
            onMouseLeave={e => e.target.style.borderColor = 'rgba(255,140,0,0.4)'}
          >
            ← REGIONS
          </button>
          <span className="region-name">{region}</span>
        </div>

        <div className="navbar-center">
          {/* POKEBALL BADGE CASE BUTTON */}
          <button
            className="badge-case-btn"
            onClick={() => setShowBadgeModal(true)}
            aria-label="Open badge case"
          >
            <div className="pokeball-icon">
              <div className="pokeball-top" />
              <div className="pokeball-middle">
                <div className="pokeball-center" />
              </div>
              <div className="pokeball-bottom" />
            </div>
            <span className="badge-case-label">BADGE CASE</span>
          </button>
        </div>

        <div className="navbar-right">
          <div className="trainer-chip-quiz">
            <div className="trainer-avatar-quiz">
              {trainerName.charAt(0).toUpperCase()}
            </div>
            <span className="trainer-name-quiz">{trainerName}</span>
          </div>
        </div>
      </nav>

      <div className="quiz-container">

        {/* LEFT SIDEBAR — PRIZE LADDER */}
        <aside className="prize-ladder">
          <div className="ladder-title">Journey</div>
          {levels.map((level) => (
            <div
              key={level.number}
              className={`ladder-item ${getLevelClass(level.number)} ${level.isLeague ? 'league-item' : ''}`}
            >
              <div className="level-marker">
                {isLevelCompleted(level.number)
                  ? <span className="badge-icon">🏅</span>
                  : <span className="level-number">Q{level.number}</span>
                }
              </div>
              <div className="level-label">{level.label}</div>
            </div>
          ))}
        </aside>

        {/* MAIN QUIZ AREA */}
        <main className="quiz-main">

          {/* QUESTION LEVEL INDICATOR */}
          <div className="level-indicator">
            <span className="level-indicator-text">
              {currentLevel === 9 ? '⚔️ League Final' : ` Gym ${currentLevel}`}
            </span>
          </div>

          {/* DIFFICULTY PREDICTOR BAR */}
          <div className="predictor-bar-wrapper">
            <span className="predictor-label">Success Chance</span>
            <div className="predictor-track">
                <div
                className="predictor-fill"
                style={{
                    width: `${successProbability}%`,
                    background: successProbability > 70
                    ? 'linear-gradient(90deg, #00c850, #00ff80)'
                    : successProbability > 40
                    ? 'linear-gradient(90deg, #ff8c00, #ffaa00)'
                    : 'linear-gradient(90deg, #cc2200, #ff3300)',
                    boxShadow: successProbability > 70
                    ? '0 0 10px rgba(0,200,80,0.7)'
                    : successProbability > 40
                    ? '0 0 10px rgba(255,140,0,0.7)'
                    : '0 0 10px rgba(220,50,0,0.7)',
                }}
                />
            </div>
            <span
                className="predictor-percent"
                style={{
                color: successProbability > 70 ? '#00c850'
                    : successProbability > 40 ? '#ff8c00'
                    : '#ff3300'
                }}
            >
                {successProbability}%
            </span>
          </div>

          {/* QUESTION CARD */}
          <div className="question-card">
            <p className="question-text">{questionText}</p>
          </div>

          {/* ANSWER OPTIONS */}
          <div className="options-grid">
            {options.map((option, index) => (
              <button
                key={index}
                className={`option-btn
                  ${isAnswered || eliminatedOptions.includes(index) ? 'disabled' : ''}
                  ${eliminatedOptions.includes(index) ? 'eliminated' : ''}
                  ${isAnswered && index === correctIndex ? 'correct' : ''}
                  ${isAnswered && selectedAnswer === index && index !== correctIndex ? 'wrong' : ''}
                `}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <span className="option-label">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {/* LIFELINES — hidden on league final */}
          {currentLevel !== 9 && (
            <div className="lifelines-container">
              <button
                className={`lifeline-btn ${!lifelines.fifty ? 'used' : ''}`}
                onClick={() => {
                  if (!lifelines.fifty || isAnswered) return;
                  onLifeline50();
                }}
                disabled={!lifelines.fifty || isAnswered}
              >
                <span className="lifeline-icon">⚡</span>
                50 / 50
              </button>
              <button
                className={`lifeline-btn oak-btn ${!lifelines.oak ? 'used' : ''}`}
                onClick={() => {
                  if (!lifelines.oak || isAnswered) return;
                  onLifelineOak();
                  setShowOakPopup(true);
                }}
                disabled={!lifelines.oak || isAnswered}
              >
                <span className="lifeline-icon">📞</span>
                Call Prof. Oak
              </button>
            </div>
          )}

          {/* LEAGUE FINAL MESSAGE instead of lifelines */}
          {currentLevel === 9 && (
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: 'rgba(255,215,0,0.5)',
              letterSpacing: '2px',
              textAlign: 'center',
              padding: '8px',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: '8px',
            }}>
              ⚔️ League Final — No lifelines available
            </div>
          )}
        </main>
    </div>
      {/* BADGE CASE MODAL */}
      {showBadgeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBadgeModal(false)}
        >
          <div
            className="badge-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowBadgeModal(false)}
            >✕</button>

            <h2 className="modal-title">Badge Case</h2>
            <p className="modal-region">{region} Region</p>

            {/* GYM BADGES */}
            <div className="badges-section">
              <h3 className="section-title">
                <span className="section-icon">🏟️</span>
                Gym Badges
              </h3>
              <div className="badges-grid">
                {badgesEarned.gym.map((earned, index) => (
                  <div
                    key={index}
                    className={`badge-slot ${earned ? 'earned' : 'empty'}`}
                  >
                    <div className="badge-slot-inner">
                      {earned
                        ? <span className="badge-emoji">🏅</span>
                        : <span className="badge-number">{index + 1}</span>
                      }
                    </div>
                    <span className="badge-slot-label">
                      Gym {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LEAGUE BADGE */}
            <div className="badges-section">
              <h3 className="section-title">
                <span className="section-icon">⚔️</span>
                League Badge
              </h3>
              <div className="league-badge-container">
                <div className={`badge-slot league-slot ${badgesEarned.league ? 'earned' : 'empty'}`}>
                  <div className="badge-slot-inner">
                    {badgesEarned.league
                      ? <span className="badge-emoji">🏆</span>
                      : <span className="badge-number">?</span>
                    }
                  </div>
                  <span className="badge-slot-label">
                    {region} League
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      {showOakPopup && (
        <OakPopup
          trainerName={trainerName}
          correctOption={options[correctIndex]}
          onClose={() => setShowOakPopup(false)}
        />
      )}

    </div>
  );
}