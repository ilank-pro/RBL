import React, { useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

const Results = ({ hostScore, guestScore, host, guest, isHost, onPlayAgain, onExit }) => {
  const { playSound } = useAudio();
  const playerScore = isHost ? hostScore : guestScore;
  const opponentScore = isHost ? guestScore : hostScore;
  const player = isHost ? host : guest;
  const opponent = isHost ? guest : host;

  const isWinner = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;

  // Play win/lose sound on mount
  useEffect(() => {
    if (isWinner) {
      playSound('gameWon');
    } else if (!isTie) {
      playSound('gameLost');
    }
  }, []);

  return (
    <div className="results-container">
      <h1 className="results-title">
        {isTie ? "It's a Tie!" : isWinner ? 'You Win!' : 'You Lose!'}
      </h1>

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
