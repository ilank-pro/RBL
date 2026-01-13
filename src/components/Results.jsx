import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAudio } from '../contexts/AudioContext';

const Results = ({
  hostScore,
  guestScore,
  host,
  guest,
  isHost,
  onPlayAgain,
  onAcceptRematch,
  onExit,
  roomId,
  userId,
  userProvider,
}) => {
  const { playSound } = useAudio();
  const [coinsAwarded, setCoinsAwarded] = useState(null);
  const [coinsError, setCoinsError] = useState(false);
  const [rematchState, setRematchState] = useState('idle'); // idle | waiting | invited
  const [rematchPending, setRematchPending] = useState(false);

  const awardCoins = useMutation(api.games.awardGameEndCoins);
  const createRematchRoom = useMutation(api.rooms.createRematchRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const declineRematch = useMutation(api.rooms.declineRematch);

  // Watch the room for rematch invitation (opponent sees this)
  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : 'skip');

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
          isWinner: isWinner,
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

  // Watch for rematch room being created (for opponent)
  useEffect(() => {
    if (!isHost && room?.rematchRoomId && room?.rematchRoomCode) {
      if (rematchState === 'idle') {
        // Guest hasn't clicked anything - show popup
        setRematchState('invited');
      } else if (rematchState === 'waiting') {
        // Guest already clicked "Play Again" - auto-join the rematch
        const autoJoinRematch = async () => {
          try {
            await joinRoom({
              code: room.rematchRoomCode,
              guestId: userId,
            });
            onAcceptRematch(room.rematchRoomId);
          } catch (err) {
            console.error('Failed to auto-join rematch:', err);
            // Fall back to showing popup if auto-join fails
            setRematchState('invited');
          }
        };
        autoJoinRematch();
      }
    }
    // Handle case where rematchRoomId is cleared (host cancelled or declined)
    if (!isHost && rematchState === 'invited' && !room?.rematchRoomId) {
      setRematchState('idle');
    }
  }, [room?.rematchRoomId, room?.rematchRoomCode, isHost, rematchState, userId]);

  const handlePlayAgainClick = async () => {
    console.log('Play Again clicked, isHost:', isHost, 'roomId:', roomId);
    if (isHost) {
      // Host creates rematch room
      setRematchPending(true);
      try {
        console.log('Calling createRematchRoom with originalRoomId:', roomId);
        const result = await createRematchRoom({ originalRoomId: roomId });
        console.log('Rematch room created:', result);
        onPlayAgain(result.roomId, result.code);
      } catch (err) {
        console.error('Failed to create rematch:', err);
        alert('Failed to create rematch: ' + err.message);
        setRematchPending(false);
      }
    } else {
      // Non-host sees waiting message
      setRematchState('waiting');
    }
  };

  const handleAcceptRematchClick = async () => {
    if (!room?.rematchRoomId || !room?.rematchRoomCode) return;

    try {
      const rematchRoomId = room.rematchRoomId;

      // Join the rematch room using its code
      await joinRoom({
        code: room.rematchRoomCode,
        guestId: userId,
      });

      onAcceptRematch(rematchRoomId);
    } catch (err) {
      console.error('Failed to join rematch:', err);
    }
  };

  const handleDeclineRematchClick = async () => {
    try {
      await declineRematch({ roomId });
    } catch (err) {
      console.error('Failed to decline rematch:', err);
    }
    onExit();
  };

  // Render rematch invitation popup for opponent
  if (rematchState === 'invited') {
    return (
      <div className="results-container">
        <div className="rematch-popup">
          <h2 className="rematch-title">Rematch Invitation</h2>
          <p className="rematch-message">{host?.name} wants a rematch!</p>
          <div className="rematch-actions">
            <button className="btn-accept" onClick={handleAcceptRematchClick}>
              Accept
            </button>
            <button className="btn-decline" onClick={handleDeclineRematchClick}>
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render waiting message for non-host clicking Play Again
  if (rematchState === 'waiting') {
    return (
      <div className="results-container">
        <div className="rematch-waiting">
          <h2 className="waiting-title">Waiting for host to start rematch...</h2>
          <p className="waiting-message">You'll be notified when the host creates a new game.</p>
          <button className="btn-result btn-exit" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
    );
  }

  // Normal results display
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
        <button
          className="btn-result btn-play-again"
          onClick={handlePlayAgainClick}
          disabled={rematchPending}
        >
          {rematchPending ? 'Creating...' : 'Play Again'}
        </button>
        <button className="btn-result btn-exit" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  );
};

export default Results;
