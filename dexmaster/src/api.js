const API_BASE = "http://localhost:8000/api";

export async function createPlayer(name, deviceId) {
  try {
    const res = await fetch(`${API_BASE}/players/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, device_id: deviceId }),
    });
    if (!res.ok) throw new Error("Failed to create player");
    return await res.json();
  } catch (err) {
    console.error("createPlayer error:", err);
    return null;
  }
}

export async function startSession(playerId, region) {
  try {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId, region }),
    });
    if (!res.ok) throw new Error("Failed to start session");
    return await res.json();
  } catch (err) {
    console.error("startSession error:", err);
    return null;
  }
}

export async function logAttempt(attemptData) {
  try {
    const res = await fetch(`${API_BASE}/attempts/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attemptData),
    });
    if (!res.ok) throw new Error("Failed to log attempt");
    return await res.json();
  } catch (err) {
    console.error("logAttempt error:", err);
    return null;
  }
}

export async function endSession(sessionId, result, stats) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result,
        questions_attempted: stats.questionsAttempted,
        questions_correct: stats.questionsCorrect,
        lifelines_used: stats.lifelinesUsed,
      }),
    });
    if (!res.ok) throw new Error("Failed to end session");
    return await res.json();
  } catch (err) {
    console.error("endSession error:", err);
    return null;
  }
}

export async function updatePlayer(playerId, updates) {
  try {
    const res = await fetch(`${API_BASE}/players/${playerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update player");
    return await res.json();
  } catch (err) {
    console.error("updatePlayer error:", err);
    return null;
  }
}