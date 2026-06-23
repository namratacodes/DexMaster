import { useState, useEffect } from "react";
import DexMasterIntro from "./DexMasterIntro";
import NameEntry from "./NameEntry";
import RegionSelect from "./RegionSelect";
import QuizScreen from "./QuizScreen";
import { questionBank, wcsQuestions } from "./data/questions";
import { predictSuccess } from "./utils/difficultyPredictor";
import { pickQuestion } from "./utils/recommender";
import PersonalityCard from "./PersonalityCard";
import { classifyPersonality, calculateSkillScore, getRank, shouldUpdatePersonality } from "./utils/personalityClassifier";
import WCSScreen from "./WCSScreen";
import ChampionCard from "./ChampionCard";
import { createPlayer, startSession, logAttempt, endSession, updatePlayer } from "./api";
import StatsScreen from "./StatsScreen";

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('dexmaster_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('dexmaster_device_id', deviceId);
  }
  return deviceId;
}

const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 480;

// Celebration messages per gym level
const gymCelebrations = {
  1: { title: "Gym 1 Cleared! 🏅", subtitle: "Your journey begins!", emoji: "⚡" },
  2: { title: "Gym 2 Cleared! 🏅", subtitle: "You're on a roll, Trainer!", emoji: "💧" },
  3: { title: "Gym 3 Cleared! 🏅", subtitle: "Three down, keep going!", emoji: "🔥" },
  4: { title: "Gym 4 Cleared! 🏅", subtitle: "Halfway there — you're strong!", emoji: "🌿" },
  5: { title: "Gym 5 Cleared! 🏅", subtitle: "Past the halfway mark! Don't stop now!", emoji: "🌟" },
  6: { title: "Gym 6 Cleared! 🏅", subtitle: "Two gyms left — the League awaits!", emoji: "🔮" },
  7: { title: "Gym 7 Cleared! 🏅", subtitle: "One more gym before the League Final!", emoji: "❄️" },
  8: { title: "Final Gym Cleared! 🏅", subtitle: "The League Championship is next. Are you ready?", emoji: "👑" },
};

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [trainerName, setTrainerName] = useState("");
  const [trainerRank, setTrainerRank] = useState("Beginner Trainer");
  const [completedRegions, setCompletedRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [askedQuestionIds, setAskedQuestionIds] = useState([]);
  const [successProbability, setSuccessProbability] = useState(50);
  const [badgesEarned, setBadgesEarned] = useState({
    gym: [false,false,false,false,false,false,false,false],
    league: false,
  });
  const [lifelines, setLifelines] = useState({ fifty: true, oak: true });
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    accuracy: 0.5,
    currentStreak: 0,
    lifelinesLeft: 2,
    avgResponseTime: 10,
    categoryAccuracy: {},
    questionsAttempted: 0,
    questionsCorrect: 0,
  });

  const [showPersonalityCard, setShowPersonalityCard] = useState(false);

  const [showCardLockedMessage, setShowCardLockedMessage] = useState(false);

  const [savedPersonality, setSavedPersonality] = useState(null);
  const [personalityLockedAt, setPersonalityLockedAt] = useState(null);

  const [showChampionCard, setShowChampionCard] = useState(false);
  const [wcsCompleted, setWcsCompleted] = useState(false);

  const [deviceId] = useState(() => getOrCreateDeviceId());

  const [playerId, setPlayerId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // Celebration popup state
  const [celebration, setCelebration] = useState(null);
  // celebration = { type: 'gym'|'league'|'region', level, region }

  // Pending next level (waits for user to click Next)
  const [pendingNextLevel, setPendingNextLevel] = useState(null);
  const [pendingStats, setPendingStats] = useState(null);

  const loadQuestion = (level, region, stats, askedIds) => {
    const pool = level === 9
      ? questionBank[region].league
      : questionBank[region].gym[level - 1];

    if (!pool) return;

    const question = pickQuestion(pool, stats, askedIds);
    setCurrentQuestion(question);
    setAskedQuestionIds(prev => [...prev, question.id]);

    const prob = predictSuccess(stats, question.difficulty);
    setSuccessProbability(prob);
  };

  const handleRegionSelect = async (region) => {
    const freshStats = {
      accuracy: 0.5,
      currentStreak: 0,
      lifelinesLeft: 2,
      avgResponseTime: 10,
      categoryAccuracy: {},
      questionsAttempted: 0,
      questionsCorrect: 0,
    };

    const savedProgress = regionProgress[region];
    const gymsCompleted = savedProgress?.gymsCompleted || 0;
    const resumeLevel = savedProgress?.resumeLevel || 1;
    const startLevel = Math.min(resumeLevel, 9);

    setCurrentRegion(region);
    setCurrentLevel(startLevel);  // ← use startLevel not 1
    setPlayerStats(freshStats);

    // Restore badges already earned
    setBadgesEarned({
      gym: Array(8).fill(false).map((_, i) => i < gymsCompleted),
      league: savedProgress?.leagueCompleted || false,
    });

    setLifelines({
      fifty: savedProgress?.lifelines?.fifty ?? true,
      oak: savedProgress?.lifelines?.oak ?? true,
    });
    setEliminatedOptions([]);
    setAskedQuestionIds([]);
    setCelebration(null);
    setPendingNextLevel(null);
    setPendingStats(null);

    // Load question for the correct resume level
    const pool = startLevel === 9
      ? questionBank[region].league
      : questionBank[region].gym[startLevel - 1];  // ← use startLevel not 0

    if (!pool) return;

    const question = pickQuestion(pool, freshStats, []);
    setCurrentQuestion(question);
    setSuccessProbability(predictSuccess(freshStats, question.difficulty));

    setScreen("quiz");

    // Start backend session (non-blocking)
    if (playerId) {
      const session = await startSession(playerId, region);
      if (session) {
        setCurrentSessionId(session.session_id);
      }
    }
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (selectedIndex) => {
    if (!currentQuestion) return;
    const isCorrect = selectedIndex === currentQuestion.correct;

    const updatedStats = (() => {
      const newAttempted = playerStats.questionsAttempted + 1;
      const newCorrect = playerStats.questionsCorrect + (isCorrect ? 1 : 0);
      const newAccuracy = newAttempted > 0 ? newCorrect / newAttempted : 0.5;
      const newStreak = isCorrect ? playerStats.currentStreak + 1 : 0;
      const cat = currentQuestion.category;
      const catHistory = playerStats.categoryAccuracy[cat] ?? 0.5;
      return {
        ...playerStats,
        accuracy: newAccuracy,
        currentStreak: newStreak,
        questionsAttempted: newAttempted,
        questionsCorrect: newCorrect,
        categoryAccuracy: {
          ...playerStats.categoryAccuracy,
          [cat]: (catHistory + (isCorrect ? 1 : 0)) / 2,
        },
        lifelinesLeft: (lifelines.fifty ? 1 : 0) + (lifelines.oak ? 1 : 0),
      };
    })();

    setPlayerStats(updatedStats);
    // Log attempt to backend (non-blocking)
    if (playerId && currentSessionId) {
      const timeTaken = questionStartTime
        ? (Date.now() - questionStartTime) / 1000
        : null;

      logAttempt({
        session_id: currentSessionId,
        player_id: playerId,
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        category: currentQuestion.category,
        region: currentRegion,
        difficulty: currentQuestion.difficulty,
        gym_level: currentLevel,
        answered_correctly: isCorrect,
        time_taken_seconds: timeTaken,
        lifeline_used: !lifelines.fifty || !lifelines.oak,
        selected_option: selectedIndex,
        correct_option: currentQuestion.correct,
      });
    }

    setQuestionStartTime(Date.now()); // reset timer for next question

    const regionsCompleted = Object.values(regionProgress)
      .filter(r => r.leagueCompleted).length;
    const newSkill = calculateSkillScore(updatedStats, regionsCompleted);
    setTrainerRank(getRank(newSkill));

    if (isCorrect) {
      if (currentLevel === 9) {
        // League final won
        setBadgesEarned(prev => ({ ...prev, league: true }));
        setRegionProgress(prev => ({
          ...prev,
          [currentRegion]: {
            gymsCompleted: 8,
            leagueCompleted: true,
          }
        }));
        setCelebration({ type: 'league', level: 9, region: currentRegion });
      } else {
        // Gym cleared
        setBadgesEarned(prev => {
          const newGym = [...prev.gym];
          newGym[currentLevel - 1] = true;
          return { ...prev, gym: newGym };
        });
        // Update region progress
        setRegionProgress(prev => ({
          ...prev,
          [currentRegion]: {
            gymsCompleted: Math.max(
              currentLevel,
              prev[currentRegion]?.gymsCompleted || 0
            ),
            leagueCompleted: prev[currentRegion]?.leagueCompleted || false,
          }
        }));
        setPendingNextLevel(currentLevel + 1);
        setPendingStats(updatedStats);
        setCelebration({ type: 'gym', level: currentLevel, region: currentRegion });
      }
    } else {
      setTimeout(() => setScreen("gameOver"), 1500);
    }
  };

  // Called when user clicks "Next Question" in celebration popup
  const handleNextQuestion = () => {
    setCelebration(null);
    if (pendingNextLevel !== null && pendingStats !== null) {
      setCurrentLevel(pendingNextLevel);
      setEliminatedOptions([]);
      loadQuestion(pendingNextLevel, currentRegion, pendingStats, askedQuestionIds);
      setPendingNextLevel(null);
      setPendingStats(null);
    }
  };

  // Called when user clicks "Return to Regions" after League win
  const handleLeagueWinReturn = () => {
    setCelebration(null);
    setCompletedRegions(prev =>
      prev.includes(currentRegion) ? prev : [...prev, currentRegion]
    );

    // End backend session
    if (currentSessionId) {
      endSession(currentSessionId, "win", {
        questionsAttempted: playerStats.questionsAttempted,
        questionsCorrect: playerStats.questionsCorrect,
        lifelinesUsed: (lifelines.fifty ? 0 : 1) + (lifelines.oak ? 0 : 1),
      });
    }

    // Update player record with latest stats
    if (playerId) {
      const regionsCompleted = completedRegions.length + 1;
      updatePlayer(playerId, {
        regions_completed: regionsCompleted,
      });
    }

    setScreen("regionSelect");
  };

  const handleLifeline50 = () => {
    if (!currentQuestion) return;
    const wrongOptions = [0,1,2,3].filter(i => i !== currentQuestion.correct);
    const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
    const newLifelines = { ...lifelines, fifty: false };
    setLifelines(newLifelines);
    // Save to regionProgress immediately
    setRegionProgress(prev => ({
      ...prev,
      [currentRegion]: {
        ...prev[currentRegion],
        lifelines: { ...newLifelines },
      }
    }));
  };

  const handleLifelineOak = () => {
    const newLifelines = { ...lifelines, oak: false };
    setLifelines(newLifelines);
    // Save to regionProgress immediately
    setRegionProgress(prev => ({
      ...prev,
      [currentRegion]: {
        ...prev[currentRegion],
        lifelines: { ...newLifelines },
      }
    }));
  };

  const handleBackToRegions = () => {
    setCelebration(null);
    setRegionProgress(prev => {
      const existing = prev[currentRegion] || {};
      return {
        ...prev,
        [currentRegion]: {
          gymsCompleted: existing.gymsCompleted || 0,
          leagueCompleted: existing.leagueCompleted || false,
          resumeLevel: currentLevel, // save exactly where they are
          lifelines: lifelines, // ← save current lifeline state
        }
      };
    });
    setScreen("regionSelect");
  };

  const handleWCSStart = () => {
    setWcsLevel(1);
    setWcsAskedIds([]);
    const shuffled = [...wcsQuestions].sort(() => Math.random() - 0.5);
    setWcsQuestion(shuffled[0]);
    setWcsAskedIds([shuffled[0].id]);
    setScreen("wcs");
  };

  const handleWCSAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === wcsQuestion.correct;

    if (!isCorrect || selectedIndex === null) {
      setTimeout(() => setScreen("wcsGameOver"), 1500);
      return;
    }

    if (wcsLevel === 10) {
      setWcsCompleted(true);
      setTimeout(() => setScreen("wcsWin"), 1500);
      return;
    }

    setTimeout(() => {
      const nextLevel = wcsLevel + 1;
      setWcsLevel(nextLevel);
      const remaining = wcsQuestions.filter(q => !wcsAskedIds.includes(q.id));
      const next = remaining[Math.floor(Math.random() * remaining.length)];
      setWcsQuestion(next);
      setWcsAskedIds(prev => [...prev, next.id]);
    }, 1500);
  };

  const [regionProgress, setRegionProgress] = useState({});
// Shape: { Kanto: { gymsCompleted: 3, leagueCompleted: false }, Johto: {...} }
  const [wcsLevel, setWcsLevel] = useState(1);
  const [wcsQuestion, setWcsQuestion] = useState(null);
  const [wcsAskedIds, setWcsAskedIds] = useState([]);

  // LOAD saved data on startup
  const [pendingSavedData, setPendingSavedData] = useState(null);

useEffect(() => {
  const saved = localStorage.getItem('dexmaster_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      setPendingSavedData(data); // just hold onto it, don't apply yet
    } catch (e) {
      localStorage.clear();
    }
  }
}, []);

  // SAVE data whenever anything important changes
  useEffect(() => {
    if (!trainerName) return;
    const dataToSave = {
      trainerName,
      trainerRank,
      completedRegions,
      regionProgress,
      savedPersonality,
      personalityLockedAt,
      wcsCompleted,
      playerId,
    };
    localStorage.setItem('dexmaster_progress', JSON.stringify(dataToSave));
  }, [trainerName, trainerRank, completedRegions, regionProgress, savedPersonality, personalityLockedAt, wcsCompleted, playerId]);
  return (
    <>
      {screen === "intro" && (
        <DexMasterIntro onStart={() => setScreen("nameEntry")} />
      )}

      {screen === "nameEntry" && (
        <NameEntry onConfirm={async (name) => {
          const saved = pendingSavedData;

          if (saved && saved.trainerName && saved.trainerName.toLowerCase() === name.toLowerCase()) {
            setTrainerName(saved.trainerName);
            setTrainerRank(saved.trainerRank || 'Beginner Trainer');
            setCompletedRegions(saved.completedRegions || []);
            setRegionProgress(saved.regionProgress || {});
            setSavedPersonality(saved.savedPersonality || null);
            setPersonalityLockedAt(saved.personalityLockedAt || null);
            setWcsCompleted(saved.wcsCompleted || false);
            setPlayerId(saved.playerId || null);
          } else {
            setTrainerName(name);
            setTrainerRank('Beginner Trainer');
            setCompletedRegions([]);
            setRegionProgress({});
            setSavedPersonality(null);
            setPersonalityLockedAt(null);
            setWcsCompleted(false);
            setPlayerId(null);

            const player = await createPlayer(name, deviceId);
            if (player) setPlayerId(player.id);
          }

          setScreen("regionSelect");
        }} />
      )}

      {screen === "regionSelect" && (
        <RegionSelect
          trainerName={trainerName}
          rank={trainerRank}
          completedRegions={completedRegions}
          regionProgress={regionProgress}
          onRegionSelect={handleRegionSelect}
          onStatsClick={() => setScreen("stats")}
          onWCSStart={handleWCSStart}
          onCardClick={() => {
            const regionsCompleted = Object.values(regionProgress)
              .filter(r => r.leagueCompleted).length;
            if (regionsCompleted < 3) {
              setShowCardLockedMessage(true);
              setTimeout(() => setShowCardLockedMessage(false), 3000);
              return;
            }
            setShowPersonalityCard(true);
          }}
        />
      )}

      {screen === "stats" && (
        <StatsScreen
          playerId={playerId}
          trainerName={trainerName}
          onClose={() => setScreen("regionSelect")}
          regionProgress={regionProgress}
        />
      )}

      {screen === "quiz" && currentQuestion && (
        <>
          <QuizScreen
            questionText={currentQuestion.question}
            options={currentQuestion.options}
            correctIndex={currentQuestion.correct}
            currentLevel={currentLevel}
            region={currentRegion}
            trainerName={trainerName}
            onAnswer={handleAnswer}
            onLifeline50={handleLifeline50}
            onLifelineOak={handleLifelineOak}
            onBack={handleBackToRegions}
            lifelines={lifelines}
            eliminatedOptions={eliminatedOptions}
            badgesEarned={badgesEarned}
            successProbability={successProbability}
          />

          {/* CELEBRATION POPUP */}
          {celebration && (
            <div style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000,
              backdropFilter: 'blur(6px)',
            }}>
              <div style={{
                background: celebration.type === 'league'
                  ? 'linear-gradient(160deg, #1a0800, #2a1500)'
                  : 'linear-gradient(160deg, #0a1a0a, #0a2a0a)',
                border: `2px solid ${celebration.type === 'league' ? '#ffd700' : '#ff8c00'}`,
                borderRadius: '20px',
                padding: 'clamp(32px, 5vw, 56px) clamp(32px, 6vw, 64px)',
                textAlign: 'center',
                maxWidth: '520px',
                width: '90%',
                boxShadow: celebration.type === 'league'
                  ? '0 0 60px rgba(255,215,0,0.4), 0 0 120px rgba(255,215,0,0.2)'
                  : '0 0 40px rgba(255,140,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}>

                {/* EMOJI */}
                <div style={{ fontSize: 'clamp(48px, 8vw, 72px)', lineHeight: 1 }}>
                  {celebration.type === 'league' ? '🏆' : gymCelebrations[celebration.level]?.emoji || '🏅'}
                </div>

                {/* TITLE */}
                <h2 style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 'clamp(18px, 3vw, 28px)',
                  fontWeight: 700,
                  color: celebration.type === 'league' ? '#ffd700' : '#ff8c00',
                  textShadow: celebration.type === 'league'
                    ? '0 0 20px rgba(255,215,0,0.8)'
                    : '0 0 15px rgba(255,140,0,0.8)',
                  letterSpacing: '2px',
                  margin: 0,
                }}>
                  {celebration.type === 'league'
                    ? `${celebration.region} League Champion!`
                    : gymCelebrations[celebration.level]?.title}
                </h2>

                {/* SUBTITLE */}
                <p style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 'clamp(11px, 1.5vw, 14px)',
                  color: 'rgba(255,255,255,0.7)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {celebration.type === 'league'
                    ? `You have conquered the ${celebration.region} Region! A true Pokémon Trainer!`
                    : gymCelebrations[celebration.level]?.subtitle}
                </p>

                {/* BADGE EARNED DISPLAY */}
                {celebration.type === 'gym' && (
                  <div style={{
                    background: 'rgba(255,140,0,0.1)',
                    border: '1px solid rgba(255,140,0,0.4)',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <span style={{ fontSize: '24px' }}>🏅</span>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '12px',
                      color: '#ff8c00',
                      letterSpacing: '1px',
                    }}>
                      Gym {celebration.level} Badge Earned!
                    </span>
                  </div>
                )}

                {celebration.type === 'league' && (
                  <div style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.4)',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <span style={{ fontSize: '28px' }}>🏆</span>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '12px',
                      color: '#ffd700',
                      letterSpacing: '1px',
                    }}>
                      {celebration.region} League Badge Earned!
                    </span>
                  </div>
                )}

                {/* ACTION BUTTON */}
                <button
                  onClick={celebration.type === 'league' ? handleLeagueWinReturn : handleNextQuestion}
                  style={{
                    marginTop: '8px',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 'clamp(11px, 1.5vw, 13px)',
                    letterSpacing: '2px',
                    padding: '14px 36px',
                    background: celebration.type === 'league'
                      ? 'rgba(255,215,0,0.12)'
                      : 'rgba(255,140,0,0.12)',
                    border: `2px solid ${celebration.type === 'league' ? '#ffd700' : '#ff8c00'}`,
                    borderRadius: '999px',
                    color: celebration.type === 'league' ? '#ffd700' : '#ff8c00',
                    cursor: 'pointer',
                    boxShadow: celebration.type === 'league'
                      ? '0 0 20px rgba(255,215,0,0.5)'
                      : '0 0 15px rgba(255,140,0,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {celebration.type === 'league'
                    ? '🗺️ Return to Regions'
                    : celebration.level === 8
                    ? '⚔️ Face the League Final'
                    : `➡️ Next Challenge — Gym ${celebration.level + 1}`}
                </button>

              </div>
            </div>
          )}
        </>
      )}

      {screen === "gameOver" && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#0a0000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '24px'
        }}>
          <div style={{ fontSize: '64px' }}>💀</div>
          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            color: '#ff3300',
            textShadow: '0 0 20px rgba(255,50,0,0.8)',
            margin: 0,
          }}>
            You Fainted!
          </h1>
          <p style={{
            fontFamily: 'Space Mono, monospace',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(11px, 1.5vw, 14px)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            {currentRegion} region — fell at Gym {currentLevel}
            <br />
            Train harder and come back stronger!
          </p>
          <button
            onClick={() => {
              // Save progress even on faint
              setRegionProgress(prev => ({
                ...prev,
                [currentRegion]: {
                  ...prev[currentRegion],
                  gymsCompleted: prev[currentRegion]?.gymsCompleted || 0,
                  leagueCompleted: prev[currentRegion]?.leagueCompleted || false,
                  resumeLevel: prev[currentRegion]?.gymsCompleted
                    ? prev[currentRegion].gymsCompleted + 1
                    : 1,
                  lifelines: lifelines,
                }
              }));

              if (currentSessionId) {
                endSession(currentSessionId, "loss", {
                  questionsAttempted: playerStats.questionsAttempted,
                  questionsCorrect: playerStats.questionsCorrect,
                  lifelinesUsed: (lifelines.fifty ? 0 : 1) + (lifelines.oak ? 0 : 1),
                });
              }
              setScreen("regionSelect");
            }}
            style={{
              fontFamily: 'Space Mono, monospace',
              padding: '14px 40px',
              background: 'rgba(255,140,0,0.1)',
              border: '2px solid #ff8c00',
              borderRadius: '999px',
              color: '#ff8c00',
              fontSize: 'clamp(11px, 1.5vw, 13px)',
              cursor: 'pointer',
              letterSpacing: '2px',
            }}
          >
            RETURN TO REGIONS
          </button>
        </div>
      )}
      {showPersonalityCard && (() => {
        try {
          const regionsCompleted = Object.values(regionProgress)
            .filter(r => r.leagueCompleted).length;
          
          if (regionsCompleted < 3) return null; // safety check
          
          const freshPersonality = classifyPersonality(playerStats, regionProgress);
          const skillScore = calculateSkillScore(playerStats, regionsCompleted);
          const rank = getRank(skillScore);

          let displayPersonality = savedPersonality;
          if (shouldUpdatePersonality(savedPersonality, freshPersonality, playerStats, regionsCompleted)) {
            displayPersonality = freshPersonality;
            setSavedPersonality(freshPersonality);

            // Sync to backend so StatsScreen matches PersonalityCard
            if (playerId) {
              updatePlayer(playerId, { personality: freshPersonality });
            }
          }
          if (!displayPersonality) displayPersonality = freshPersonality;

          return (
            <PersonalityCard
              trainerName={trainerName}
              personality={displayPersonality}
              accuracy={isNaN(playerStats.accuracy) ? 0.5 : playerStats.accuracy}
              avgSpeed={isNaN(playerStats.avgResponseTime) || !playerStats.avgResponseTime ? 10 : playerStats.avgResponseTime}
              streak={playerStats.currentStreak || 0}
              skillScore={skillScore || 0}
              rank={rank || 'Beginner Trainer'}
              badgesTotal={regionsCompleted}
              trainerId={trainerName.slice(0, 3).toUpperCase() + "042"}
              regionProgress={regionProgress}
              onClose={() => setShowPersonalityCard(false)}
              isPersonalityNew={displayPersonality !== savedPersonality}
              wcsCompleted={wcsCompleted}
              playerStats={playerStats} 
            />
          );
        } catch(e) {
          console.error("PersonalityCard error:", e);
          return (
            <div style={{
              position: 'fixed', inset: 0,
              background: '#0a0000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 4000,
            }}>
              <div style={{ textAlign: 'center', color: '#ff8c00', fontFamily: 'Space Mono, monospace' }}>
                <p>Card loading error</p>
                <button
                  onClick={() => setShowPersonalityCard(false)}
                  style={{ marginTop: '16px', padding: '10px 24px', background: 'none', border: '1px solid #ff8c00', color: '#ff8c00', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          );
        }
      })()}
      {showCardLockedMessage && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '24px',
          background: 'linear-gradient(135deg, #1a0800, #0a0000)',
          border: '1px solid rgba(255,140,0,0.5)',
          borderRadius: '12px',
          padding: '14px 20px',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 0 20px rgba(255,140,0,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div>
            <p style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#ff8c00',
              margin: 0,
              letterSpacing: '1px',
            }}>
              Complete 3 regions to unlock
            </p>
            <p style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '9px',
              color: 'rgba(255,255,255,0.4)',
              margin: '3px 0 0 0',
              letterSpacing: '1px',
            }}>
              Your personality needs more data
            </p>
          </div>
        </div>
      )}
      {screen === "wcs" && wcsQuestion && (
        <WCSScreen
          questionText={wcsQuestion.question}
          options={wcsQuestion.options}
          correctIndex={wcsQuestion.correct}
          currentLevel={wcsLevel}
          trainerName={trainerName}
          onAnswer={handleWCSAnswer}
          timeLimit={30}
        />
      )}

      {screen === "wcsGameOver" && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#050000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '24px', zIndex: 9999,
        }}>
          <div style={{ fontSize: '64px' }}>💀</div>
          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
            color: '#cc2200',
            textShadow: '0 0 20px rgba(200,50,0,0.8)',
            textAlign: 'center',
            margin: 0,
          }}>
            Eliminated!
          </h1>
          <p style={{
            fontFamily: 'Space Mono, monospace',
            color: 'rgba(255,215,0,0.5)',
            fontSize: '13px',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            You reached Round {wcsLevel} of the World Coronation Series
            <br />The path to World Champion is not easy...
          </p>
          <button
            onClick={() => setScreen("regionSelect")}
            style={{
              fontFamily: 'Space Mono, monospace',
              padding: '14px 40px',
              background: 'rgba(255,215,0,0.08)',
              border: '2px solid #ffd700',
              borderRadius: '999px',
              color: '#ffd700',
              fontSize: '13px',
              cursor: 'pointer',
              letterSpacing: '2px',
            }}
          >
            RETURN TO REGIONS
          </button>
        </div>
      )}

      {screen === "wcsWin" && (
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: '#050000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'hidden',
        }}>

          {/* VIDEO BACKGROUND */}
          <video
            src="/champion-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* DARK OVERLAY so text stays readable over video */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(5,0,0,0.9) 0%, rgba(5,0,0,0.65) 50%, rgba(5,0,0,0.85) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />

          {/* Fire GIF layered on top for extra warmth */}
          <img src="/fire.gif" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%',
            objectFit: 'cover',
            mixBlendMode: 'screen',
            opacity: 0.2,
            pointerEvents: 'none',
            zIndex: 2,
          }} alt="" />

          {/* Embers */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: '-10px',
                left: `${Math.random() * 100}%`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: '#ffd700',
                borderRadius: '50%',
                boxShadow: '0 0 6px #ffd700',
                animation: `floatEmber ${3 + Math.random() * 4}s linear ${Math.random() * 5}s infinite`,
              }} />
            ))}
          </div>

          {/* Gold rays background */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '20px',
            padding: '40px 24px', textAlign: 'center',
            maxWidth: '700px', width: '100%',
          }}>

            {/* Trophy */}
            <div style={{
              fontSize: 'clamp(50px, 10vw, 80px)',
              filter: 'drop-shadow(0 0 30px rgba(255,215,0,1)) drop-shadow(0 0 60px rgba(255,215,0,0.6))',
              animation: 'trophyFloat 2s ease-in-out infinite',
            }}>🏆</div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              color: '#ffd700',
              textShadow: '0 0 20px rgba(255,215,0,1), 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.3)',
              letterSpacing: '4px',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Champion
            </h1>

            {/* Subtitle */}
            <p style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 'clamp(12px, 2vw, 18px)',
              color: 'rgba(255,215,0,0.7)',
              letterSpacing: '3px',
              margin: 0,
            }}>
              {trainerName} — Pokémon World Coronation Series
            </p>

            {/* Divider */}
            <div style={{
              width: '60%', height: '1px',
              background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
              boxShadow: '0 0 10px rgba(255,215,0,0.5)',
            }} />

            {/* Stats summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              width: '100%',
              maxWidth: '500px',
            }}>
              {[
                { label: 'Regions', value: '9/9' },
                { label: 'WCS Rounds', value: '10/10' },
                { label: 'Status', value: 'MASTER' },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(255,215,0,0.06)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '12px',
                  padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  <span style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '9px',
                    color: 'rgba(255,215,0,0.5)',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>{stat.label}</span>
                  <span style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 'clamp(14px, 2vw, 20px)',
                    fontWeight: 700,
                    color: '#ffd700',
                    textShadow: '0 0 10px rgba(255,215,0,0.5)',
                  }}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowChampionCard(true);
                }}
                style={{
                  fontFamily: 'Space Mono, monospace',
                  padding: '16px 36px',
                  background: 'rgba(255,215,0,0.12)',
                  border: '2px solid #ffd700',
                  borderRadius: '999px',
                  color: '#ffd700',
                  fontSize: 'clamp(11px, 1.5vw, 13px)',
                  cursor: 'pointer',
                  letterSpacing: '2px',
                  boxShadow: '0 0 25px rgba(255,215,0,0.5)',
                  transition: 'all 0.2s ease',
                }}
              >
                🎴 VIEW CHAMPION CARD
              </button>
              <button
                onClick={() => setScreen("regionSelect")}
                style={{
                  fontFamily: 'Space Mono, monospace',
                  padding: '16px 36px',
                  background: 'transparent',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '999px',
                  color: 'rgba(255,215,0,0.5)',
                  fontSize: 'clamp(11px, 1.5vw, 13px)',
                  cursor: 'pointer',
                  letterSpacing: '2px',
                }}
              >
                RETURN TO REGIONS
              </button>
            </div>
          </div>

          {/* Champion Card Overlay */}
          {showChampionCard && (
            <ChampionCard
              trainerName={trainerName}
              playerStats={playerStats}
              regionProgress={regionProgress}
              onClose={() => setShowChampionCard(false)}
            />
          )}
        </div>
      )}
    </>
  );
}