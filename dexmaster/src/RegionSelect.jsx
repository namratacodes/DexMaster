import React, { useState } from 'react';
import './RegionSelect.css';

const RegionSelect = ({
  trainerName,
  rank,
  regionProgress = {},
  onRegionSelect,
  onStatsClick,
  onCardClick,
  completedRegions = [],
  onWCSStart,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const allRegionsComplete = completedRegions.length === 9;

  const regionOrder = ['Kanto','Johto','Hoenn','Sinnoh','Unova','Kalos','Alola','Galar','Paldea'];

  const regions = regionOrder.map((name, index) => ({
    name,
    image: `/regions/${name.toLowerCase()}.jpg`,
    unlocked: index === 0 || completedRegions?.includes(regionOrder[index - 1]),
  }));

  const firstLetter = trainerName?.charAt(0).toUpperCase() || '';

  const handleRegionClick = (region) => {
    if (region.unlocked) {
      onRegionSelect(region.name);
    }
  };

  return (
    <div className="region-select-container">
      <div className="region-embers">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="region-ember"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="region-navbar">
        <div className="navbar-left">
          <h1 className="navbar-title">SELECT YOUR REGION</h1>
        </div>

        <div className="navbar-right">
          {/* Trainer Chip */}
          <div className="trainer-chip">
            <div className="trainer-avatar">{firstLetter}</div>

            <div className="trainer-info">
              <div className="trainer-name">{trainerName}</div>
              <div className="trainer-rank">{rank}</div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="navbar-divider"></div>

          {/* Stats Button */}
          <button
            className="icon-button stats-button"
            onClick={onStatsClick}
          >
            <span className="icon-emoji">📊</span>
            <span className="icon-label">STATS</span>
          </button>

          {(() => {
            const regionsCompleted = Object.values(regionProgress || {})
              .filter(r => r.leagueCompleted).length;
            const isUnlocked = regionsCompleted >= 3;
            const remaining = 3 - regionsCompleted;

            return (
              <button
                className="icon-button card-button"
                onClick={onCardClick}
                style={{ position: 'relative' }}
              >
                <span className="icon-emoji">
                  {isUnlocked ? '🎴' : '🔒'}
                </span>
                <span className="icon-label">
                  {isUnlocked ? 'MY CARD' : `${regionsCompleted}/3`}
                </span>

                {/* TOOLTIP — only shows when locked */}
                {!isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-72px',
                    right: '0',
                    width: '180px',
                    background: 'linear-gradient(135deg, #1a0800, #0a0000)',
                    border: '1px solid rgba(255,140,0,0.5)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    zIndex: 100,
                    textAlign: 'left',
                  }}
                  className="card-locked-tooltip"
                  >
                    <p style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '9px',
                      color: '#ff8c00',
                      margin: '0 0 4px 0',
                      letterSpacing: '1px',
                      fontWeight: 700,
                    }}>
                      🔒 Card Locked
                    </p>
                    <p style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '8px',
                      color: 'rgba(255,255,255,0.5)',
                      margin: 0,
                      lineHeight: 1.5,
                      letterSpacing: '0.5px',
                    }}>
                      Win {remaining} more League
                      {remaining === 1 ? ' Final' : ' Finals'}
                      {' '}to reveal your Pokémon personality
                    </p>
                    <div style={{
                      marginTop: '6px',
                      display: 'flex',
                      gap: '4px',
                    }}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{
                          width: '100%',
                          height: '3px',
                          borderRadius: '2px',
                          background: i < regionsCompleted
                            ? '#ff8c00'
                            : 'rgba(255,255,255,0.1)',
                          boxShadow: i < regionsCompleted
                            ? '0 0 6px rgba(255,140,0,0.6)'
                            : 'none',
                          transition: 'all 0.3s ease',
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })()}
        </div>
        {/* RESET BUTTON — for testing only */}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '8px',
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid rgba(255,0,0,0.25)',
            borderRadius: '4px',
            color: 'rgba(255,0,0,0.35)',
            cursor: 'pointer',
            letterSpacing: '1px',
            marginLeft: '8px',
          }}
        >
          RESET
        </button>
      </nav>

      {/* Region Grid */}
      <div className="region-grid">
        {regions.map((region) => (
          <div
            key={region.name}
            className={`region-card ${
              region.unlocked || completedRegions?.includes(region.name)
                ? 'unlocked'
                : 'locked'
            }`}
            onMouseEnter={() => setHoveredRegion(region.name)}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick(region)}
          >
            {/* BACKGROUND IMAGE */}
            <div
              className="region-card-bg"
              style={{ backgroundImage: `url(${region.image})` }}
            />

            {/* DARK OVERLAY */}
            <div
              className={`region-card-overlay ${
                region.unlocked ? '' : 'locked-overlay'
              }`}
            />

            {/* LOCK ICON */}
            {!region.unlocked && (
              <div className="lock-overlay">
                <span className="lock-icon">🔒</span>
              </div>
            )}

            {/* CARD CONTENT */}
            <div className="region-card-content">
              <h2 className="region-name">{region.name}</h2>
              <p className="region-badges">
                {(() => {
                  const progress = regionProgress[region.name];
                  if (!progress) return '0/9 badges';
                  if (progress.leagueCompleted) return '9/9 badges ✓';
                  return `${progress.gymsCompleted}/9 badges`;
                })()}
              </p>

              {/* RESUME INDICATOR */}
              {regionProgress[region.name]?.gymsCompleted > 0 &&
                !regionProgress[region.name]?.leagueCompleted && (
                  <p style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '9px',
                    color: '#ff8c00',
                    margin: '4px 0 0 0',
                    letterSpacing: '1px',
                  }}>
                    ▶ Resume from Gym {(regionProgress[region.name]?.resumeLevel) || 
                      (regionProgress[region.name]?.gymsCompleted + 1)}
                  </p>
              )}

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: (() => {
                      const progress = regionProgress[region.name];
                      if (!progress) return '0%';
                      return `${Math.round((progress.gymsCompleted / 9) * 100)}%`;
                    })()
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WORLD CORONATION SERIES */}
      <div className="wcs-section">
        <div
          className={`wcs-card ${
            allRegionsComplete ? 'wcs-unlocked' : 'wcs-locked'
          }`}
          onClick={() => {
            if (allRegionsComplete && onWCSStart) onWCSStart();
          }}
          style={{ cursor: allRegionsComplete ? 'pointer' : 'not-allowed' }}
        >
          <div 
            className="wcs-card-bg"
            style={{ backgroundImage: `url('/regions/wcs.jpg')` }}
          />
          <div className="wcs-overlay" />

          {!allRegionsComplete && (
            <div className="wcs-lock">
              <span className="wcs-lock-icon">🔒</span>
            </div>
          )}

          <div className="wcs-content">
            <h2 className="wcs-title">World Coronation Series</h2>
            <p className="wcs-subtitle">
              Master Level — No Lifelines — Timed
            </p>
            <div className="wcs-badges-required">
              <span>9/9 Region Badges Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSelect;