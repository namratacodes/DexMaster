// src/utils/recommender.js

export function pickQuestion(pool, playerStats, askedQuestionIds) {
  if (!pool || pool.length === 0) return null;

  // Filter out already asked questions
  const available = pool.filter(q => !askedQuestionIds.includes(q.id));

  // If all questions in pool have been asked, reset and use full pool
  const candidates = available.length > 0 ? available : pool;

  // If only one candidate just return it
  if (candidates.length === 1) return candidates[0];

  const accuracy = isNaN(playerStats.accuracy) ? 0.5 : playerStats.accuracy;

  // Strong player — pick hardest available
  if (accuracy > 0.75) {
    return [...candidates].sort((a, b) => b.difficulty - a.difficulty)[0];
  }

  // Weak player — pick easiest available
  if (accuracy < 0.4) {
    return [...candidates].sort((a, b) => a.difficulty - b.difficulty)[0];
  }

  // Average player — pick randomly from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}