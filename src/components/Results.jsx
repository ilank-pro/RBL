import React, { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAudio } from '../contexts/AudioContext';

const Results = ({ hostScore, guestScore, host, guest, isHost, onPlayAgain, onExit, roomId, userId }) => {
  const { playSound } = useAudio();
  const [coinsAwarded, setCoinsAwarded] = useState(null);
  const [coinsError, setCoinsError] = useState(false);

  const awardCoins = useMutation(api.games.awardGameEndCoins);

  const playerScore = isHost ? hostScore : guestScore;
  const opponentScore = isHost ? guestScore : hostScore;
  const player = isHost ? host : guest;
  const opponent = isHost ? guest : host;

  const isWinner = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;

  // Play win/lose sound and award coins on mount
  useEffect(() => {
    if (isWinner) {
      playSound('gameWon');
    } else if (!isTie) {
      playSound('gameLost');
    }

    // Award coins for game completion
    const awardGameCoins = async () => {
      if (!roomId || !userId) return;

      try {
        const result = await awardCoins({
          roomId,
          userId,
          isWinner: isWinner || isTie, // Ties count as wins for coin purposes
        });
        if (result.awarded) {
          setCoinsAwarded(result.coins);
        }
      } catch (err) {
        console.error('Failed to award coins:', err);
        setCoinsError(true);
      }
    };

    awardGameCoins();
  }, []);

  return (
    <div className="results-container">
      <h1 className="results-title">
        {isTie ? "It's a Tie!" : isWinner ? 'You Win!' : 'You Lose!'}
      </h1>

      {coinsAwarded !== null && (
        <div className="results-coins">
          <span className="coins-earned">+{coinsAwarded} 💰</span>
          <span className="coins-label">coins earned</span>
        </div>
      )}

      <div className="results-scores">
        <div className={`results-player ${isWinner ? 'winner' : ''}`}>
          <img src={player?.avatar} alt={player?.name} className="results-avatar" />
          <span className="results-name">{player?.name}</span>
          <span className="results-score">{playerScore}</span>
        </div>

        <div className="results-vs">-</div>

        <div className={`results-player ${!isWinner && !isTie ? 'winner' : ''}`}>
          <img src={opponent?.avatar} alt={opponent?.name} className="results-avatar" />
          <span className="results-name">{opponent?.name}</span>
          <span className="results-score">{opponentScore}</span>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-result btn-play-again" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="btn-result btn-exit" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  );
};

export default Results;
