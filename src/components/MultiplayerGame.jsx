import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import gameData from '../data/gameData.json';

const MultiplayerGame = ({ roomId, user, isHost, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [roundFeedback, setRoundFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState('');
  const [isWinner, setIsWinner] = useState(false);
  const recognitionRef = useRef(null);

  const gameState = useQuery(api.games.getGameState, { roomId });
  const checkAnswer = useMutation(api.games.checkAnswer);
  const nextRound = useMutation(api.games.nextRound);
  const skipRound = useMutation(api.games.skipRound);

  const currentItem = gameState
    ? gameData[gameState.currentPuzzleIndex]
    : null;

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
    }
  }, [gameState?.currentRound]);

  // Check for game end
  useEffect(() => {
    if (gameState?.status === 'finished') {
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
      const correctAnswers = currentItem.answer.split(',').map((a) => a.trim());
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

      <div className="round-indicator">
        Round {gameState.currentRound} of {gameState.totalRounds}
      </div>

      {roundFeedback && (
        <div className={`round-feedback ${roundFeedback.includes('You won') ? 'win' : 'lose'}`}>
          {roundFeedback}
        </div>
      )}

      <div className="main-card-wrapper">
        <main className="main-card">
          <img
            src={`/assets/images/${currentItem.file}`}
            alt="Game Challenge"
            className="game-image"
          />
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
    </div>
  );
};

export default MultiplayerGame;
