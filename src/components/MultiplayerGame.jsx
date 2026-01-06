import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import gameData from '../data/gameData.json'; // Fallback for migration period
import { useAudio } from '../contexts/AudioContext';
import UpgradePopup from './UpgradePopup';

// Hint costs by level (matches convex/coins.ts)
const HINT_COSTS = {
  1: 5,   // Level 1: 5 coins
  2: 10,  // Level 2: 10 coins
  3: 20,  // Level 3: 20 coins
  4: 35,  // Level 4: 35 coins
  5: 50,  // Level 5: 50 coins
};

const MultiplayerGame = ({ roomId, user, isHost, onGameEnd }) => {
  const { playSound, startBgMusic, stopBgMusic } = useAudio();
  const [timeLeft, setTimeLeft] = useState(90);
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [roundFeedback, setRoundFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState('');
  const [isWinner, setIsWinner] = useState(false);
  const [hintsUsed, setHintsUsed] = useState([]); // Array of hint levels already used
  const [displayedHint, setDisplayedHint] = useState(null); // Currently displayed hint text
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [receivedEmoji, setReceivedEmoji] = useState(null);
  const [emojiSenderName, setEmojiSenderName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradePopupTrigger, setUpgradePopupTrigger] = useState(null);
  const recognitionRef = useRef(null);
  const lastEmojiAtRef = useRef(null);

  const gameState = useQuery(api.games.getGameState, { roomId });
  const puzzles = useQuery(api.puzzles.getActivePuzzles);
  const userMonetization = useQuery(api.coins.getUserMonetization, { userId: user.userId });
  const checkAnswer = useMutation(api.games.checkAnswer);
  const nextRound = useMutation(api.games.nextRound);
  const skipRound = useMutation(api.games.skipRound);
  const sendEmojiMutation = useMutation(api.games.sendEmoji);
  const giveUpMutation = useMutation(api.games.giveUp);
  const spendCoinsMutation = useMutation(api.coins.spendCoins);

  // Get user tier and coins
  const userTier = userMonetization?.tier ?? 'free';
  const userCoins = userMonetization?.coins ?? 0;
  const canSendEmoji = userTier !== 'free'; // Bronze+ can send emojis
  const canSkipCard = userTier === 'gold' || userTier === 'platinum'; // Gold+ can skip
  const maxSkipsPerGame = userTier === 'platinum' ? 3 : userTier === 'gold' ? 1 : 0;
  const maxHints = 5; // Maximum hint levels available

  // Get current puzzle - use database puzzles if available, fallback to static gameData
  const getCurrentPuzzle = () => {
    if (!gameState) return null;

    // If we have puzzles from the database, use them
    if (puzzles && puzzles.length > 0) {
      const puzzleIndex = gameState.currentPuzzleIndex;
      if (puzzleIndex < puzzles.length) {
        return puzzles[puzzleIndex];
      }
    }

    // Fallback to static gameData during migration
    return gameData[gameState.currentPuzzleIndex];
  };

  const currentItem = getCurrentPuzzle();
  const isUsingDatabase = puzzles && puzzles.length > 0;

  // Play game start sound and start background music
  useEffect(() => {
    if (gameState?.status === 'playing' && !gameStarted) {
      setGameStarted(true);
      playSound('gameStart');
      startBgMusic();
    }

    return () => {
      if (gameStarted) {
        stopBgMusic();
      }
    };
  }, [gameState?.status, gameStarted]);

  // Timer countdown
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's up - host skips round
      if (isHost) {
        handleTimeUp();
      }
    }
  }, [timeLeft, gameState?.status]);

  // Reset timer when round changes
  useEffect(() => {
    if (gameState?.currentRound) {
      setTimeLeft(90);
      setAnswer('');
      setRoundFeedback(null);
      setHintsUsed([]);
      setDisplayedHint(null);
      setShowEmojiPicker(false);
    }
  }, [gameState?.currentRound]);

  // Check for game end
  useEffect(() => {
    if (gameState?.status === 'finished') {
      stopBgMusic();
      playSound('gameEnd');
      onGameEnd({
        hostScore: gameState.hostScore,
        guestScore: gameState.guestScore,
        host: gameState.host,
        guest: gameState.guest,
      });
    }
  }, [gameState?.status]);

  // Show round winner feedback with confetti
  useEffect(() => {
    if (gameState?.roundWinner) {
      const winnerIsMe =
        (isHost && gameState.roundWinner === 'host') ||
        (!isHost && gameState.roundWinner === 'guest');

      // Get winner's name for the message
      const winnerName = gameState.roundWinner === 'host'
        ? gameState.host?.name
        : gameState.guest?.name;

      // Play sound effect
      if (winnerIsMe) {
        playSound('correctAnswer');
      } else {
        playSound('opponentCorrect');
      }

      setIsWinner(winnerIsMe);
      setConfettiMessage(winnerIsMe ? 'You got this right!' : `${winnerName} guessed right!`);
      setShowConfetti(true);
      setRoundFeedback(winnerIsMe ? 'You won this round!' : 'Opponent won this round!');

      // Move to next round after delay (host controls)
      if (isHost) {
        setTimeout(async () => {
          try {
            setShowConfetti(false);
            await nextRound({ roomId });
          } catch (err) {
            console.error('Failed to advance round:', err);
          }
        }, 2500);
      } else {
        // Guest also hides confetti after delay
        setTimeout(() => setShowConfetti(false), 2500);
      }
    }
  }, [gameState?.roundWinner]);

  // Handle received emoji from opponent
  useEffect(() => {
    if (!gameState?.lastEmoji || !gameState?.lastEmojiAt) return;

    // Only show if it's from the opponent (not from ourselves)
    const emojiFromOpponent =
      (isHost && gameState.lastEmojiFrom === 'guest') ||
      (!isHost && gameState.lastEmojiFrom === 'host');

    // Check if this is a new emoji (different timestamp)
    if (emojiFromOpponent && gameState.lastEmojiAt !== lastEmojiAtRef.current) {
      lastEmojiAtRef.current = gameState.lastEmojiAt;

      // Play emoji receive sound
      playSound('emojiReceive');

      // Get sender's name
      const senderName = gameState.lastEmojiFrom === 'host'
        ? gameState.host?.name
        : gameState.guest?.name;

      setReceivedEmoji(gameState.lastEmoji);
      setEmojiSenderName(senderName || 'Opponent');

      // Hide after 5 seconds
      setTimeout(() => {
        setReceivedEmoji(null);
        setEmojiSenderName('');
      }, 5000);
    }
  }, [gameState?.lastEmoji, gameState?.lastEmojiAt, gameState?.lastEmojiFrom, isHost]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setAnswer(transcript);
      if (event.results[0].isFinal) setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      try { recognitionRef.current?.abort(); } catch (e) {}
    };
  }, []);

  const handleTimeUp = async () => {
    try {
      await skipRound({ roomId });
    } catch (err) {
      console.error('Failed to skip round:', err);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current.start();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentItem) return;

    try {
      // Get correct answers - handle both database and static puzzle formats
      let correctAnswers;
      if (isUsingDatabase) {
        // Database puzzle: answer + alternateAnswers
        correctAnswers = [currentItem.answer, ...(currentItem.alternateAnswers || [])];
      } else {
        // Static puzzle: comma-separated string
        correctAnswers = currentItem.answer.split(',').map((a) => a.trim());
      }

      const result = await checkAnswer({
        roomId,
        playerId: user.userId,
        answer: answer.trim(),
        isHost,
        correctAnswers,
      });

      if (!result.correct) {
        setRoundFeedback('Wrong answer, try again!');
        setTimeout(() => setRoundFeedback(null), 1500);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get available hints from the current puzzle sorted by score
  const getAvailableHints = () => {
    if (!currentItem || !isUsingDatabase) return [];
    const hints = currentItem.hints || [];
    // Sort by score (1=easiest, 5=hardest/biggest hint)
    return [...hints].sort((a, b) => a.score - b.score);
  };

  // Get the next hint that hasn't been used yet
  const getNextHint = () => {
    const availableHints = getAvailableHints();
    // Find first hint that hasn't been used
    for (const hint of availableHints) {
      if (!hintsUsed.includes(hint.score)) {
        return hint;
      }
    }
    return null;
  };

  const getNextHintCost = () => {
    const nextHint = getNextHint();
    if (!nextHint) return 0;
    return HINT_COSTS[nextHint.score] || 5;
  };

  const handleHint = async () => {
    const availableHints = getAvailableHints();

    // Check if card has any hints
    if (availableHints.length === 0) {
      setDisplayedHint({ text: 'No hints for this card at the moment', isError: true });
      setTimeout(() => setDisplayedHint(null), 5000);
      return;
    }

    const nextHint = getNextHint();

    // Check if all hints have been used
    if (!nextHint) {
      setDisplayedHint({ text: 'All hints used for this card!', isError: true });
      setTimeout(() => setDisplayedHint(null), 5000);
      return;
    }

    const cost = HINT_COSTS[nextHint.score] || 5;

    // Check if user has enough coins
    if (userCoins < cost) {
      setUpgradePopupTrigger('hint');
      setShowUpgradePopup(true);
      return;
    }

    try {
      // Deduct coins
      const result = await spendCoinsMutation({
        userId: user.userId,
        amount: cost,
        reason: `hint_level_${nextHint.score}`,
      });

      if (result.success) {
        // Mark this hint level as used
        setHintsUsed([...hintsUsed, nextHint.score]);

        // Display the hint text on the card
        setDisplayedHint({ text: nextHint.text, isError: false });
        setRoundFeedback(`-${cost} coins for hint`);

        // Hide hint after 5 seconds
        setTimeout(() => setDisplayedHint(null), 5000);
        setTimeout(() => setRoundFeedback(null), 1500);
      } else {
        // Not enough coins
        setUpgradePopupTrigger('hint');
        setShowUpgradePopup(true);
      }
    } catch (err) {
      console.error('Failed to use hint:', err);
    }
  };

  // Check if more hints are available
  const hasMoreHints = () => {
    const availableHints = getAvailableHints();
    if (availableHints.length === 0) return true; // Allow click to show "no hints" message
    return hintsUsed.length < availableHints.length;
  };

  const handleGiveUp = async () => {
    // Check if already gave up
    const alreadyGaveUp = isHost ? gameState?.hostGaveUp : gameState?.guestGaveUp;
    if (alreadyGaveUp) return;

    try {
      await giveUpMutation({ roomId, isHost });
    } catch (err) {
      console.error('Failed to give up:', err);
    }
  };

  const handleSkipCard = async () => {
    if (!canSkipCard) {
      setUpgradePopupTrigger('skip');
      setShowUpgradePopup(true);
      return;
    }

    if (skipsUsed >= maxSkipsPerGame) {
      setRoundFeedback('No skips remaining!');
      setTimeout(() => setRoundFeedback(null), 1500);
      return;
    }

    try {
      await skipRound({ roomId });
      setSkipsUsed(skipsUsed + 1);
      setRoundFeedback('Card skipped!');
      setTimeout(() => setRoundFeedback(null), 1500);
    } catch (err) {
      console.error('Failed to skip card:', err);
    }
  };

  const skipsRemaining = maxSkipsPerGame - skipsUsed;

  // Check if current player gave up
  const myGaveUp = isHost ? gameState?.hostGaveUp : gameState?.guestGaveUp;
  const opponentGaveUp = isHost ? gameState?.guestGaveUp : gameState?.hostGaveUp;

  const emojis = ['😄', '😅', '🤔', '😱', '🔥', '👏', '💪', '🎉'];

  const handleEmojiButtonClick = () => {
    if (!canSendEmoji) {
      // Show upgrade popup for free tier users
      setUpgradePopupTrigger('emoji');
      setShowUpgradePopup(true);
      return;
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const sendEmoji = async (emoji) => {
    try {
      playSound('emojiSend');
      await sendEmojiMutation({ roomId, emoji, isHost });
      setRoundFeedback(`You sent ${emoji}`);
      setTimeout(() => setRoundFeedback(null), 1500);
    } catch (err) {
      console.error('Failed to send emoji:', err);
    }
    setShowEmojiPicker(false);
  };

  if (!gameState || !currentItem) {
    return (
      <div className="game-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header className="header">
        <div className="player-score-container">
          <span className="player-label">{isHost ? 'YOU' : gameState.host?.name}</span>
          <div className="player-row">
            <div className={`avatar-circle ${isHost ? 'player1' : ''}`}>
              <img src={gameState.host?.avatar} alt="Host" />
            </div>
            <div className="score-display">{gameState.hostScore}</div>
          </div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="player-score-container">
          <span className="player-label">{!isHost ? 'YOU' : gameState.guest?.name}</span>
          <div className="player-row">
            <div className="score-display">{gameState.guestScore}</div>
            <div className={`avatar-circle ${!isHost ? 'player1' : ''}`}>
              <img src={gameState.guest?.avatar} alt="Guest" />
            </div>
          </div>
        </div>
      </header>

      <div className="game-info-bar">
        <div className="round-indicator">
          Round {gameState.currentRound} of {gameState.totalRounds}
        </div>
        <div className="coin-balance">
          💰 {userCoins}
        </div>
      </div>

      {roundFeedback && (
        <div className={`round-feedback ${roundFeedback.includes('You won') ? 'win' : 'lose'}`}>
          {roundFeedback}
        </div>
      )}

      {receivedEmoji && (
        <div className="emoji-received">
          <div className="emoji-received-icon">{receivedEmoji}</div>
          <div className="emoji-received-text">{emojiSenderName} sent you an emoji!</div>
        </div>
      )}

      <div className="main-card-wrapper">
        <main className="main-card">
          <img
            src={isUsingDatabase ? currentItem.imageUrl : `/assets/images/${currentItem.file}`}
            alt="Game Challenge"
            className="game-image"
          />
          {displayedHint && (
            <div className={`hint-overlay ${displayedHint.isError ? 'error' : 'success'}`}>
              <div className="hint-icon">💡</div>
              <div className="hint-text">{displayedHint.text}</div>
            </div>
          )}
          {showConfetti && (
            <div className={`confetti-explosion ${isWinner ? 'winner' : 'loser'}`}>
              <div className="confetti-message">{confettiMessage}</div>
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    '--delay': `${Math.random() * 0.3}s`,
                    '--x': `${(Math.random() - 0.5) * 300}px`,
                    '--y': `${-Math.random() * 200 - 50}px`,
                    '--r': `${Math.random() * 720 - 360}deg`,
                    '--color': ['#f8db34', '#ff6b9d', '#4ecdc4', '#a855f7', '#3b82f6'][Math.floor(Math.random() * 5)],
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="difficulty-container">
        <div className="banana-track">
          <img
            src="https://em-content.zobj.net/source/apple/354/banana_1f34c.png"
            className="banana-handle"
            alt="banana"
            style={{ left: `${isUsingDatabase ? (currentItem.difficulty * 20) : (currentItem['human difficulty'] ? parseInt(currentItem['human difficulty']) * 15 : 50)}%` }}
          />
        </div>
        <div className="difficulty-label">
          <span>EASY</span>
          <span>HARD</span>
        </div>
      </div>

      <div className="timer-area">
        <div className="timer-display">
          <div className="clock-icon-wrapper">
            <svg className="clock-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="13" r="8" stroke="#1a1a2e" strokeWidth="2" fill="none" />
              <path d="M12 9V13L15 15" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 5V3" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 3H15" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="controls">
        <button className="btn-game btn-hint" onClick={handleHint} disabled={!hasMoreHints() && getAvailableHints().length > 0}>
          {hintsUsed.length > 0
            ? `Hint (${hintsUsed.length} used)`
            : `Hint (${getNextHintCost()}💰)`}
        </button>
        <button
          className={`btn-game btn-giveup ${myGaveUp ? 'gave-up' : ''}`}
          onClick={handleGiveUp}
          disabled={myGaveUp}
        >
          {myGaveUp
            ? (opponentGaveUp ? 'Both Gave Up' : 'Waiting...')
            : 'Give Up'}
        </button>
        <div className="emoji-container">
          <button className="btn-game btn-emoji" onClick={handleEmojiButtonClick}>
            {canSendEmoji ? 'Send Emoji' : '⭐ Emoji'}
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojis.map((emoji) => (
                <button key={emoji} className="emoji-btn" onClick={() => sendEmoji(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skip button row - Gold+ only */}
      <div className="controls controls-secondary">
        <button
          className={`btn-game btn-skip ${!canSkipCard ? 'locked' : ''}`}
          onClick={handleSkipCard}
          disabled={canSkipCard && skipsRemaining <= 0}
        >
          {!canSkipCard
            ? '⭐ Skip Card'
            : skipsRemaining > 0
              ? `Skip Card (${skipsRemaining} left)`
              : 'No Skips Left'}
        </button>
      </div>

      <div className="input-area">
        <input
          type="text"
          className="answer-input"
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmitAnswer();
          }}
        />
        <button className="btn-send" onClick={handleSubmitAnswer}>
          ➤
        </button>
        <button
          className={`btn-mic ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={!speechSupported}
          style={{ opacity: speechSupported ? 1 : 0.5 }}
        >
          {isListening ? '🛑' : '🎤'}
        </button>
      </div>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        trigger={upgradePopupTrigger}
        currentTier={userTier}
        currentCoins={userCoins}
        onPurchaseTier={(tier) => {
          console.log('Purchase tier:', tier);
          // TODO: Integrate Stripe checkout
          setShowUpgradePopup(false);
        }}
        onPurchaseCoins={(pack) => {
          console.log('Purchase coins:', pack);
          // TODO: Integrate Stripe checkout
          setShowUpgradePopup(false);
        }}
      />
    </div>
  );
};

export default MultiplayerGame;
