import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const Lobby = ({ user, onRoomCreated, onRoomJoined, onLogout }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError('');
    try {
      const result = await createRoom({
        hostId: user.userId,
        totalRounds: 5,
        totalPuzzles: 59, // Total puzzles in gameData
      });
      onRoomCreated(result.roomId, result.code);
    } catch (err) {
      // Extract message from ConvexError or regular error
      const message = err.data || err.message || 'Failed to create room';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setIsJoining(true);
    setError('');
    try {
      const roomId = await joinRoom({
        code: joinCode.toUpperCase(),
        guestId: user.userId,
      });
      onRoomJoined(roomId);
    } catch (err) {
      // Extract message from ConvexError or regular error
      const message = err.data || err.message || 'Failed to join room';
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <img src={user.avatar} alt={user.name} className="lobby-avatar" />
        <h2>Welcome, {user.name}!</h2>
      </div>

      <div className="lobby-actions">
        <button
          className="btn-lobby btn-create"
          onClick={handleCreateRoom}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>

        <div className="lobby-divider">
          <span>OR</span>
        </div>

        <div className="join-section">
          <input
            type="text"
            className="join-input"
            placeholder="Enter room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button
            className="btn-lobby btn-join"
            onClick={handleJoinRoom}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {error && <div className="lobby-error">{error}</div>}
      </div>

      <button className="btn-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

export default Lobby;
