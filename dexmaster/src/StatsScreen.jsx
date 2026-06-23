import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './StatsScreen.css';

const API_BASE = "http://localhost:8000/api";

const regionOrder = ['Kanto','Johto','Hoenn','Sinnoh','Unova','Kalos','Alola','Galar','Paldea'];

export default function StatsScreen({ playerId, trainerName, onClose, regionProgress }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      setError(true);
      return;
    }
    fetch(`${API_BASE}/players/${playerId}/stats`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [playerId]);

  const categoryData = stats?.category_breakdown
    ? Object.entries(stats.category_breakdown).map(([category, accuracy]) => ({
        category: category.replace(/_/g, ' '),
        accuracy: Math.round(accuracy * 100),
      }))
    : [];

  return (
    <div className="ss-overlay">
      <div className="ss-panel">

        <div className="ss-header">
          <h1 className="ss-title">{trainerName}'s Stats</h1>
          <button className="ss-close" onClick={onClose}>✕ CLOSE</button>
        </div>

        <div className="ss-scroll-body">

          {loading && (
            <div className="ss-loading">
              <div className="ss-spinner" />
              <p>Loading your trainer data...</p>
            </div>
          )}

          {error && !loading && (
            <div className="ss-empty">
              <span className="ss-empty-emoji">📊</span>
              <p>No stats yet — play a few questions first!</p>
            </div>
          )}

          {stats && !loading && !error && (
            <>
              <div className="ss-metrics-grid">
                <div className="ss-metric-card">
                  <span className="ss-metric-label">Accuracy</span>
                  <span className="ss-metric-value">{Math.round((stats.accuracy || 0) * 100)}%</span>
                </div>
                <div className="ss-metric-card">
                  <span className="ss-metric-label">Best Streak</span>
                  <span className="ss-metric-value">{stats.best_streak || 0}</span>
                </div>
                <div className="ss-metric-card">
                  <span className="ss-metric-label">Games Played</span>
                  <span className="ss-metric-value">{stats.total_games || 0}</span>
                </div>
                <div className="ss-metric-card">
                  <span className="ss-metric-label">Avg Time</span>
                  <span className="ss-metric-value">{stats.avg_time?.toFixed(1) || 0}s</span>
                </div>
              </div>

              <div className="ss-rank-row">
                <div className="ss-rank-pill">{stats.rank || 'Beginner Trainer'}</div>
                <div className="ss-skill-score">Skill Score: <span>{stats.skill_score || 0}</span></div>
              </div>

              {categoryData.length > 0 && (
                <div className="ss-chart-section">
                  <h3 className="ss-section-title">Category Performance</h3>
                  <ResponsiveContainer width="100%" height={Math.max(180, categoryData.length * 40)}>
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,140,0,0.1)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                      <YAxis type="category" dataKey="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} width={110} />
                      <Tooltip
                        contentStyle={{ background: '#1a0800', border: '1px solid rgba(255,140,0,0.4)', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#ff8c00' }}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                      />
                      <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.accuracy > 70 ? '#00c850' : entry.accuracy > 40 ? '#ff8c00' : '#cc2200'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="ss-sw-row">
                <div className="ss-strength">
                  <span className="ss-sw-icon">💪</span>
                  <div>
                    <span className="ss-sw-label">Strongest Category</span>
                    <span className="ss-sw-value">{stats.strongest_category?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                </div>
                <div className="ss-weakness">
                  <span className="ss-sw-icon">⚠️</span>
                  <div>
                    <span className="ss-sw-label">Weakest Category</span>
                    <span className="ss-sw-value">{stats.weakest_category?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* ── GYM BADGES SECTION ── */}
              <div className="ss-badge-section">
                <h3 className="ss-section-title">🏟️ Gym Badges</h3>
                {regionOrder.map(region => {
                  const progress = regionProgress?.[region];
                  const gymsCompleted = progress?.gymsCompleted || 0;
                  return (
                    <div key={region} className="ss-badge-region-row">
                      <span className="ss-badge-region-name">{region}</span>
                      <div className="ss-badge-icons">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <span
                            key={i}
                            className={`ss-badge-icon ${i < gymsCompleted ? 'earned' : 'unearned'}`}
                          >
                            🏅
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── LEAGUE BADGES SECTION ── */}
              <div className="ss-badge-section">
                <h3 className="ss-section-title">🏆 League Badges</h3>
                <div className="ss-league-badges-row">
                  {regionOrder.map(region => {
                    const earned = regionProgress?.[region]?.leagueCompleted;
                    return (
                      <div key={region} className="ss-league-badge-item">
                        <span className={`ss-league-badge-icon ${earned ? 'earned' : 'unearned'}`}>
                          🏆
                        </span>
                        <span className="ss-league-badge-label">{region}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ss-personality-note">
                Current personality classification: <span>{stats.personality || 'Eevee'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}