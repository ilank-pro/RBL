import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import UpgradePopup from './UpgradePopup';

// Monthly bonus amounts by tier
const TIER_MONTHLY_BONUS = {
  free: 0,
  bronze: 50,
  gold: 150,
  platinum: 300,
};

// Tier-based settings limits
const TIER_SETTINGS = {
  free: { maxRounds: 5, minTime: 90, maxTime: 90 },
  bronze: { maxRounds: 10, minTime: 60, maxTime: 120 },
  gold: { maxRounds: 15, minTime: 45, maxTime: 180 },
  platinum: { maxRounds: 20, minTime: 30, maxTime: 300 },
};

const ROUND_OPTIONS = [5, 7, 10, 15, 20];
const TIME_OPTIONS = [30, 45, 60, 90, 120, 180, 300];

const Lobby = ({ user, onRoomCreated, onRoomJoined, onLogout }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState(5);
  const [selectedTime, setSelectedTime] = useState(90);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [bonusNotification, setBonusNotification] = useState(null);
  const [bonusChecked, setBonusChecked] = useState(false);

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const claimMonthlyBonus = useMutation(api.coins.claimMonthlyBonus);
  const userMonetization = useQuery(
    api.coins.getUserMonetization,
    user?.userId ? { userId: user.userId } : "skip"
  );

  const userTier = userMonetization?.tier ?? 'free';
  const userCoins = userMonetization?.coins ?? 0;
  const tierSettings = TIER_SETTINGS[userTier] || TIER_SETTINGS.free;

  const canCustomize = userTier !== 'free';

  // Check and claim monthly bonus on mount (for paid tiers)
  useEffect(() => {
    const checkMonthlyBonus = async () => {
      if (!user?.userId || bonusChecked || userTier === 'free') return;

      setBonusChecked(true);

      try {
        const result = await claimMonthlyBonus({ userId: user.userId });
        if (result.success) {
          setBonusNotification({
            type: 'success',
            message: `Monthly bonus claimed! +${result.coinsEarned} coins 🎉`,
          });
          // Auto-hide after 5 seconds
          setTimeout(() => setBonusNotification(null), 5000);
        }
      } catch (err) {
        console.error('Failed to check monthly bonus:', err);
      }
    };

    if (userMonetization) {
      checkMonthlyBonus();
    }
  }, [user?.userId, userMonetization, userTier, bonusChecked]);

  // Guard against null user (during logout transition)
  if (!user) {
    return null;
  }

  const isRoundOptionAvailable = (rounds) => rounds <= tierSettings.maxRounds;
  const isTimeOptionAvailable = (time) => time >= tierSettings.minTime && time <= tierSettings.maxTime;

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError('');
    try {
      const result = await createRoom({
        hostId: user.userId,
        totalRounds: selectedRounds,
        totalPuzzles: 59,
      });
      onRoomCreated(result.roomId, result.code);
    } catch (err) {
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
      const message = err.data || err.message || 'Failed to join room';
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSettingsClick = () => {
    if (!canCustomize) {
      setShowUpgradePopup(true);
      return;
    }
    setShowSettings(!showSettings);
  };

  return (
    <div className="lobby-container">
      {bonusNotification && (
        <div className={`bonus-notification ${bonusNotification.type}`}>
          {bonusNotification.message}
          <button
            className="notification-close"
            onClick={() => setBonusNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="lobby-header">
        <img src={user.avatar} alt={user.name} className="lobby-avatar" />
        <h2>Welcome, {user.name}!</h2>
        <div className="lobby-tier-badge" data-tier={userTier}>
          {userTier === 'free' ? '🆓' : userTier === 'bronze' ? '🥉' : userTier === 'gold' ? '🥇' : '💎'} {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
        </div>
        <div className="lobby-coins">💰 {userCoins}</div>
      </div>

      <div className="lobby-actions">
        <div className="create-room-section">
          <button
            className="btn-lobby btn-create"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>

          <button
            className={`btn-settings ${canCustomize ? '' : 'locked'}`}
            onClick={handleSettingsClick}
          >
            {canCustomize ? '✨ Settings' : '⭐ Upgrade'}
          </button>
        </div>

        {showSettings && canCustomize && (
          <div className="game-settings">
            <div className="settings-group">
              <label>Rounds per game:</label>
              <div className="settings-options">
                {ROUND_OPTIONS.map((rounds) => (
                  <button
                    key={rounds}
                    className={`settings-option ${selectedRounds === rounds ? 'selected' : ''} ${!isRoundOptionAvailable(rounds) ? 'locked' : ''}`}
                    onClick={() => isRoundOptionAvailable(rounds) && setSelectedRounds(rounds)}
                    disabled={!isRoundOptionAvailable(rounds)}
                  >
                    {rounds}
                    {!isRoundOptionAvailable(rounds) && ' ⭐'}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <label>Time per card:</label>
              <div className="settings-options">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    className={`settings-option ${selectedTime === time ? 'selected' : ''} ${!isTimeOptionAvailable(time) ? 'locked' : ''}`}
                    onClick={() => isTimeOptionAvailable(time) && setSelectedTime(time)}
                    disabled={!isTimeOptionAvailable(time)}
                  >
                    {time}s
                    {!isTimeOptionAvailable(time) && ' ⭐'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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

      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        trigger="settings"
        currentTier={userTier}
        currentCoins={userCoins}
        userId={user?.userId}
        onPurchaseTier={(tier) => {
          console.log('Purchase tier:', tier);
          setShowUpgradePopup(false);
        }}
        onPurchaseCoins={(pack) => {
          console.log('Purchase coins:', pack);
          setShowUpgradePopup(false);
        }}
      />
    </div>
  );
};

export default Lobby;
