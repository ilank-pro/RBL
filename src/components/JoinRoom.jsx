import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const JoinRoom = ({ user, onRoomJoined, onNeedLogin }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const room = useQuery(api.rooms.getRoomByCode, { code: roomCode?.toUpperCase() || '' });
  const joinRoom = useMutation(api.rooms.joinRoom);

  useEffect(() => {
    // If no user, redirect to login with the room code saved
    if (!user) {
      onNeedLogin(roomCode);
      return;
    }

    // If room query returned null (not found)
    if (room === null) {
      setError('Room not found. Please check the code and try again.');
      return;
    }

    // If room is found but already has a guest or game started
    if (room && room.guestId) {
      setError('This room is already full.');
      return;
    }

    if (room && room.status !== 'waiting') {
      setError('This game has already started.');
      return;
    }

    // Auto-join if room is valid and waiting
    if (room && room.status === 'waiting' && !room.guestId && !isJoining) {
      handleJoin();
    }
  }, [room, user]);

  const handleJoin = async () => {
    if (!user || isJoining) return;

    setIsJoining(true);
    setError('');

    try {
      const roomId = await joinRoom({
        code: roomCode.toUpperCase(),
        guestId: user.userId,
      });
      onRoomJoined(roomId);
    } catch (err) {
      const message = err.data || err.message || 'Failed to join room';
      setError(message);
      setIsJoining(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Loading state
  if (room === undefined) {
    return (
      <div className="join-room-container">
        <div className="join-room-content">
          <div className="join-room-loading">
            <div className="spinner"></div>
            <p>Finding room...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="join-room-container">
        <div className="join-room-content">
          <div className="join-room-error-icon">😕</div>
          <h2 className="join-room-title">Unable to Join</h2>
          <p className="join-room-error">{error}</p>
          <button className="join-room-button" onClick={handleGoHome}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Joining state
  return (
    <div className="join-room-container">
      <div className="join-room-content">
        <div className="join-room-loading">
          <div className="spinner"></div>
          <p>Joining room {roomCode?.toUpperCase()}...</p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
