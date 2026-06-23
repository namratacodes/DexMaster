// src/utils/difficultyPredictor.js

export function predictSuccess(playerStats, questionDifficulty) {
  const accuracy = isNaN(playerStats.accuracy) ? 0.5 : playerStats.accuracy;
  const currentStreak = playerStats.currentStreak || 0;
  const lifelinesLeft = playerStats.lifelinesLeft || 2;
  const avgResponseTime = playerStats.avgResponseTime || 10;
  const categoryAccuracy = playerStats.categoryAccuracy || {};

  const avgCatAccuracy = Object.values(categoryAccuracy).length > 0
    ? Object.values(categoryAccuracy).reduce((a, b) => a + b, 0) / Object.values(categoryAccuracy).length
    : 0.5;

  let prob = accuracy * 40;
  prob += Math.min(currentStreak * 3, 15);
  prob += (10 - questionDifficulty) * 4;
  const speedBonus = Math.max(0, 10 - avgResponseTime);
  prob += speedBonus * 1.5;
  prob += avgCatAccuracy * 20;
  prob += lifelinesLeft * 3;

  return Math.min(95, Math.max(5, Math.round(prob)));
}