import { useState } from 'react';
import { calculateSkillScore } from './utils/personalityClassifier';
import './ChampionCard.css';

export default function ChampionCardInline({ trainerName, playerStats, regionProgress }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const regionsCompleted = Object.values(regionProgress || {})
    .filter(r => r.leagueCompleted).length;
  const skillScore = calculateSkillScore(playerStats, regionsCompleted);
  const accuracyPct = Math.round((isNaN(playerStats?.accuracy) ? 1 : playerStats?.accuracy) * 100);
  const trainerId = trainerName.slice(0, 3).toUpperCase() + "001";

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    setRotateX(((e.clientY - rect.top - rect.height / 2) / rect.height) * 10);
    setRotateY(((e.clientX - rect.left - rect.width / 2) / rect.width) * -10);
  };

  const handleMouseLeave = () => { setRotateX(0); setRotateY(0); };

  return (
    <div
      className="cc-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: rotateX === 0 ? 'transform 0.4s ease-out' : 'none',
      }}
    >
      <div className="cc-shine" />
      <div className="cc-shine-2" />

      <div className="cc-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="cc-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }} />
        ))}
      </div>

      <div className="cc-top">
        <div className="cc-champion-badge">⭐ WORLD CHAMPION</div>
        <div className="cc-hp">
          <span className="cc-hp-label">HP</span>
          <span className="cc-hp-value">999</span>
        </div>
      </div>

      <div className="cc-trophy-zone">
        <div className="cc-trophy-glow" />
        <div className="cc-trophy-emoji">🏆</div>
        <div className="cc-trophy-rays">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cc-ray" style={{
              transform: `rotate(${i * 45}deg)`,
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      </div>

      <div className="cc-player-info">
        <div className="cc-player-name">{trainerName}</div>
        <div className="cc-trainer-id">Trainer ID: #{trainerId}</div>
        <div className="cc-champion-title">Pokémon World Champion</div>
      </div>

      <div className="cc-types">
        <span className="cc-type">Master</span>
        <span className="cc-type">Champion</span>
        <span className="cc-type">Legend</span>
      </div>

      <div className="cc-stats">
        {[
          { label: 'Accuracy', value: `${accuracyPct}%`, pct: accuracyPct },
          { label: 'Regions Cleared', value: `${regionsCompleted}/9`, pct: (regionsCompleted / 9) * 100 },
          { label: 'Skill Score', value: skillScore, pct: Math.min(100, (skillScore / 4000) * 100) },
          { label: 'WCS Rounds', value: '10/10', pct: 100 },
        ].map((stat, i) => (
          <div key={i} className="cc-stat-row">
            <div className="cc-stat-header">
              <span className="cc-stat-label">{stat.label}</span>
              <span className="cc-stat-value">{stat.value}</span>
            </div>
            <div className="cc-stat-track">
              <div className="cc-stat-fill" style={{
                width: `${stat.pct}%`,
                animationDelay: `${i * 0.15}s`,
              }} />
            </div>
          </div>
        ))}
      </div>

      <div className="cc-badges-row">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="cc-badge-dot earned" style={{
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
      </div>
      <div className="cc-badge-label">All 9 Regions Conquered</div>

      <div className="cc-rank">Pokémon Master</div>
      <div className="cc-card-num">No.000 / Secret Rare ✦✦✦</div>
    </div>
  );
}