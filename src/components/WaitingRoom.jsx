import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const WaitingRoom = ({ roomId, roomCode, user, isHost, onGameStart }) => {
  const room = useQuery(api.rooms.getRoom, { roomId });
  const startGame = useMutation(api.rooms.startGame);

  // Auto-start when guest joins (for host) or when game starts (for guest)
  React.useEffect(() => {
    if (room?.status === 'playing') {
      onGameStart(roomId);
    }
  }, [room?.status, roomId, onGameStart]);

  const handleStartGame = async () => {
    try {
      await startGame({ roomId });
    } catch (err) {
      alert(err.message || 'Failed to start game');
    }
  };

  const shareUrl = `${window.location.origin}/join/${roomCode}`;

  if (!room) {
    return (
      <div className="waiting-container">
        <div className="waiting-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="waiting-container">
      <h2 className="waiting-title">
        {isHost ? 'Waiting for Opponent' : 'Waiting for Host'}
      </h2>

      {isHost && (
        <>
          <div className="qr-section">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              bgColor="#f8db34"
              fgColor="#1a1a2e"
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="room-code-section">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code">{roomCode}</span>
          </div>

          <p className="waiting-instruction">
            Share the QR code or room code with a friend to join!
          </p>
        </>
      )}

      <div className="players-section">
        <div className="player-card">
          <img
            src={room.host?.avatar}
            alt={room.host?.name}
            className="player-avatar"
          />
          <span className="player-name">{room.host?.name}</span>
          <span className="player-status ready">Ready</span>
        </div>

        <div className="vs-divider">VS</div>

        <div className="player-card">
          {room.guest ? (
            <>
              <img
                src={room.guest.avatar}
                alt={room.guest.name}
                className="player-avatar"
              />
              <span className="player-name">{room.guest.name}</span>
              <span className="player-status ready">Ready</span>
            </>
          ) : (
            <>
              <div className="player-avatar-placeholder">?</div>
              <span className="player-name">Waiting...</span>
              <span className="player-status waiting">Not joined</span>
            </>
          )}
        </div>
      </div>

      {isHost && room.guest && (
        <button className="btn-start-game" onClick={handleStartGame}>
          Start Game!
        </button>
      )}

      {!isHost && !room.guest && (
        <div className="waiting-message">
          Connecting to room...
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
