import { useState } from 'react';
import './PersonalityCard.css';
import { PERSONALITIES } from './utils/personalityClassifier';
import ChampionCardInline from './ChampionCardInline';

export default function PersonalityCard({
  trainerName,
  personality,
  accuracy,
  avgSpeed,
  streak,
  skillScore,
  rank,
  badgesTotal,
  trainerId,
  onClose,
  regionProgress,
  isPersonalityNew,
  wcsCompleted,
  playerStats,
}) {
  const [activeTab, setActiveTab] = useState('personality');
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const data = PERSONALITIES[personality] || PERSONALITIES.Eevee;
  const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.pokemonId}.png`;

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX(((y - rect.height / 2) / rect.height) * 8);
    setRotateY(((x - rect.width / 2) / rect.width) * -8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const regionsCompleted = regionProgress
    ? Object.values(regionProgress).filter(r => r.leagueCompleted).length
    : 0;

  const accuracyPct = Math.round((isNaN(accuracy) ? 0.5 : accuracy) * 100);
  const speedPct = Math.min(100, Math.round((Math.max(0, 20 - avgSpeed) / 20) * 100));
  const streakPct = Math.min(100, Math.round((streak / 20) * 100));
  const skillPct = Math.min(100, Math.round((skillScore / 4000) * 100));

  return (
    <div className="pc-screen">

      {/* CLOSE BUTTON */}
      <button className="pc-close-btn" onClick={onClose}>
        ✕ CLOSE
      </button>

      {/* TAB SWITCHER */}
      <div className="pc-tabs">
        <button
          className={`pc-tab ${activeTab === 'personality' ? 'pc-tab-active' : ''}`}
          onClick={() => setActiveTab('personality')}
        >
          🎴 Personality Card
        </button>
        <button
          className={`pc-tab ${activeTab === 'champion' ? 'pc-tab-active' : ''} ${!wcsCompleted ? 'pc-tab-locked' : ''}`}
          onClick={() => wcsCompleted && setActiveTab('champion')}
          disabled={!wcsCompleted}
        >
          {wcsCompleted ? '🏆 Champion Card' : '🔒 Champion Card'}
        </button>
      </div>

      {/* ── PERSONALITY CARD TAB ── */}
      {activeTab === 'personality' && (
        <div
          className="pc-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: rotateX === 0 && rotateY === 0 ? 'transform 0.4s ease-out' : 'none',
            borderColor: data.color,
            boxShadow: `0 0 30px ${data.color}66, 0 0 60px ${data.color}33, 0 20px 40px rgba(0,0,0,0.8)`,
          }}
        >
          <div className="pc-shine" />

          {isPersonalityNew && (
            <div style={{
              background: 'rgba(255,215,0,0.15)',
              border: '1px solid rgba(255,215,0,0.5)',
              borderRadius: '8px',
              padding: '6px 12px',
              textAlign: 'center',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '9px',
                color: '#ffd700',
                letterSpacing: '2px',
              }}>
                ✨ PERSONALITY UPDATED
              </span>
            </div>
          )}

          <div className="pc-top">
            <div className="pc-personality-badge" style={{ borderColor: data.color, color: data.color }}>
              {data.name} Type
            </div>
            <div className="pc-hp">
              <span className="pc-hp-label">HP</span>
              <span className="pc-hp-value" style={{ color: data.color }}>{data.hp}</span>
            </div>
          </div>

          <div className="pc-image-zone">
            <div className="pc-image-glow" style={{ borderColor: data.color, boxShadow: `0 0 20px ${data.color}88` }} />
            <img
              src={pokemonImageUrl}
              alt={data.name}
              className="pc-pokemon-img"
              style={{ filter: `drop-shadow(0 0 12px ${data.color}88)` }}
            />
          </div>

          <div className="pc-player-info">
            <div className="pc-player-name">{trainerName}</div>
            <div className="pc-trainer-id">Trainer ID: #{trainerId}</div>
            <div className="pc-personality-title" style={{ color: data.color }}>
              {data.title}
            </div>
          </div>

          <div className="pc-types">
            {data.types.map((type, i) => (
              <span key={i} className="pc-type-badge" style={{ background: data.color }}>
                {type}
              </span>
            ))}
          </div>

          <div className="pc-description">"{data.description}"</div>

          <div className="pc-stats">
            {[
              { label: 'Accuracy', value: `${accuracyPct}%`, pct: accuracyPct },
              { label: 'Speed', value: `${avgSpeed.toFixed(1)}s`, pct: speedPct },
              { label: 'Best Streak', value: streak, pct: streakPct },
              { label: 'Skill Score', value: skillScore, pct: skillPct },
            ].map((stat, i) => (
              <div key={i} className="pc-stat-row">
                <div className="pc-stat-header">
                  <span className="pc-stat-label">{stat.label}</span>
                  <span className="pc-stat-value">{stat.value}</span>
                </div>
                <div className="pc-stat-track">
                  <div
                    className="pc-stat-fill"
                    style={{
                      width: `${stat.pct}%`,
                      background: `linear-gradient(90deg, ${data.color}99, ${data.color})`,
                      boxShadow: `0 0 8px ${data.color}88`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pc-sw-row">
            <div className="pc-strength">
              <span className="pc-sw-label">💪 Strength</span>
              <span className="pc-sw-text">{data.strength}</span>
            </div>
            <div className="pc-weakness">
              <span className="pc-sw-label">⚠️ Weakness</span>
              <span className="pc-sw-text">{data.weakness}</span>
            </div>
          </div>

          <div className="pc-badges-row">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`pc-badge-dot ${i < regionsCompleted ? 'earned' : ''}`}
                style={i < regionsCompleted ? {
                  background: data.color,
                  boxShadow: `0 0 8px ${data.color}`,
                } : {}}
              />
            ))}
          </div>
          <div className="pc-badge-label">{regionsCompleted}/9 Regions</div>

          <div
            className="pc-rank"
            style={{ borderColor: data.color, color: data.color, boxShadow: `0 0 14px ${data.color}66` }}
          >
            {rank}
          </div>

          <div className="pc-card-number" style={{ color: `${data.color}66` }}>
            No.{String(data.pokemonId).padStart(3, '0')} / Holo Rare ✦
          </div>
        </div>
      )}

      {/* ── CHAMPION CARD TAB ── */}
      {activeTab === 'champion' && wcsCompleted && (
        <ChampionCardInline
          trainerName={trainerName}
          playerStats={playerStats}
          regionProgress={regionProgress}
        />
      )}

      {/* ── LOCKED MESSAGE ── */}
      {activeTab === 'champion' && !wcsCompleted && (
        <div className="pc-locked-message">
          <span style={{ fontSize: '40px' }}>🔒</span>
          <p>Complete the World Coronation Series to unlock your Champion Card</p>
        </div>
      )}

    </div>
  );
}