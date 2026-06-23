export const PERSONALITIES = {
  Mewtwo: {
    name: "Mewtwo",
    title: "Strategic Mastermind",
    description: "Cold, calculated, and devastatingly accurate. You approach every question like a chess move.",
    strength: "Exceptional accuracy across all categories",
    weakness: "May overthink simple questions",
    types: ["Psychic"],
    color: "#9B59B6",
    hp: 195,
    pokemonId: 150,
  },
  Charizard: {
    name: "Charizard",
    title: "The Risk Taker",
    description: "Fast, bold, and fearless. You trust your instincts and rarely need backup.",
    strength: "Lightning-fast responses under pressure",
    weakness: "Speed sometimes beats out accuracy",
    types: ["Fire", "Flying"],
    color: "#E74C3C",
    hp: 178,
    pokemonId: 6,
  },
  Snorlax: {
    name: "Snorlax",
    title: "The Steady Giant",
    description: "Unhurried and methodical. You take your time but when you answer — you're right.",
    strength: "High accuracy, rarely makes mistakes",
    weakness: "Slow response time under pressure",
    types: ["Normal"],
    color: "#7F8C8D",
    hp: 160,
    pokemonId: 143,
  },
  Pikachu: {
    name: "Pikachu",
    title: "The Energetic Trainer",
    description: "Quick, enthusiastic, and always ready. You love the game and play with heart.",
    strength: "Consistent energy and fast responses",
    weakness: "Relies on lifelines when unsure",
    types: ["Electric"],
    color: "#F1C40F",
    hp: 155,
    pokemonId: 25,
  },
  Psyduck: {
    name: "Psyduck",
    title: "The Confused Scholar",
    description: "Brilliant but inconsistent. Your headache gets worse with harder questions but you keep trying.",
    strength: "Surprisingly correct on random tough questions",
    weakness: "High lifeline dependency, low category consistency",
    types: ["Water", "Psychic"],
    color: "#3498DB",
    hp: 130,
    pokemonId: 54,
  },
  Piplup: {
    name: "Piplup",
    title: "The Determined Beginner",
    description: "Still learning but never giving up. Every wrong answer makes you stronger.",
    strength: "Improving accuracy over time, never quits",
    weakness: "Low regions completed, early stage trainer",
    types: ["Water"],
    color: "#5DADE2",
    hp: 125,
    pokemonId: 393,
  },
  Gengar: {
    name: "Gengar",
    title: "The Unpredictable Ghost",
    description: "Nobody knows what you'll do next — not even you. Brilliant one moment, baffling the next.",
    strength: "Clutch correct answers on hardest questions",
    weakness: "Wildly inconsistent, high variance performance",
    types: ["Ghost", "Poison"],
    color: "#8E44AD",
    hp: 145,
    pokemonId: 94,
  },
  Eevee: {
    name: "Eevee",
    title: "The Balanced Trainer",
    description: "Jack of all trades. No glaring weaknesses, no overwhelming strengths — pure potential.",
    strength: "Consistent across all categories",
    weakness: "Yet to find their specialization",
    types: ["Normal"],
    color: "#D4AC0D",
    hp: 140,
    pokemonId: 133,
  },
};

export function classifyPersonality(playerStats, regionProgress) {
  const accuracy = isNaN(playerStats.accuracy) ? 0.5 : playerStats.accuracy;
  const avgTime = playerStats.avgResponseTime || 10;

  const regionsCompleted = Object.values(regionProgress)
    .filter(r => r.leagueCompleted).length;

  const totalLifelinesUsed = Object.values(regionProgress).reduce((total, r) => {
    const used = (r.lifelines?.fifty === false ? 1 : 0) +
                 (r.lifelines?.oak === false ? 1 : 0);
    return total + used;
  }, 0);

  const questionsAttempted = playerStats.questionsAttempted || 0;

  // Calculate accuracy variance (inconsistency indicator)
  const categoryAccuracies = Object.values(playerStats.categoryAccuracy || {});
  const avgCatAccuracy = categoryAccuracies.length > 0
    ? categoryAccuracies.reduce((a, b) => a + b, 0) / categoryAccuracies.length
    : 0.5;
  const variance = categoryAccuracies.length > 1
    ? categoryAccuracies.reduce((sum, v) => sum + Math.abs(v - avgCatAccuracy), 0) / categoryAccuracies.length
    : 0;

  // ── MEWTWO — strategic genius
  if (accuracy > 0.78 && regionsCompleted >= 3 && totalLifelinesUsed <= 2) {
    return "Mewtwo";
  }

  // ── CHARIZARD — fast risk taker
  if (avgTime < 7 && totalLifelinesUsed <= 1 && accuracy > 0.55) {
    return "Charizard";
  }

  // ── SNORLAX — slow but accurate
  if (accuracy > 0.70 && avgTime > 13) {
    return "Snorlax";
  }

  // ── PSYDUCK — confused, high lifeline use, low accuracy
  if (accuracy < 0.45 && totalLifelinesUsed >= 3) {
    return "Psyduck";
  }

  // ── GENGAR — high variance unpredictable
  if (variance > 0.3 && questionsAttempted >= 10) {
    return "Gengar";
  }

  // ── PIPLUP — beginner, few regions, but trying
  if (regionsCompleted === 0 && questionsAttempted < 15) {
    return "Piplup";
  }

  // ── PIKACHU — energetic, uses lifelines, average accuracy
  if (avgTime < 10 && totalLifelinesUsed >= 2) {
    return "Pikachu";
  }

  // ── EEVEE — balanced, nothing extreme
  return "Eevee";
}

export function calculateSkillScore(playerStats, regionsCompleted) {
  const accuracy = isNaN(playerStats.accuracy) ? 0.5 : playerStats.accuracy;
  const avgTime = playerStats.avgResponseTime || 10;
  const streak = playerStats.currentStreak || 0;

  const accuracyScore = accuracy * 40;
  const speedScore = Math.max(0, 10 - avgTime) * 2;
  const regionScore = regionsCompleted * 8;
  const streakBonus = Math.min(streak * 2, 10);

  return Math.round((accuracyScore + speedScore + regionScore + streakBonus) * 40);
}

export function getRank(skillScore) {
  if (skillScore >= 3000) return "Pokémon Master";
  if (skillScore >= 1800) return "Elite Trainer";
  if (skillScore >= 800)  return "Gym Challenger";
  return "Beginner Trainer";
}

// Returns true only if personality has changed drastically
export function shouldUpdatePersonality(oldPersonality, newPersonality, playerStats, regionsCompleted) {
  // Never downgrade from top tier personalities
  const tier = { Mewtwo: 4, Charizard: 3, Snorlax: 3, Pikachu: 2, Gengar: 2, Eevee: 2, Piplup: 1, Psyduck: 1 };

  if (!oldPersonality) return true; // First time always set

  if (oldPersonality === newPersonality) return false; // No change

  const oldTier = tier[oldPersonality] || 1;
  const newTier = tier[newPersonality] || 1;

  // Only update if tier difference is 2+ (drastic change)
  // OR if they've completed enough regions to justify a new assessment
  const tierDifference = Math.abs(newTier - oldTier);

  if (tierDifference >= 2) return true;

  // Update every 3 regions completed
  if (regionsCompleted > 0 && regionsCompleted % 3 === 0) return true;

  return false;
}