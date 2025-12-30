import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import useFacebookAuth from '../hooks/useFacebookAuth';

const Login = ({ onLogin, pendingRoomCode }) => {
  const { startBgMusic, isMusicMuted } = useAudio();
  const { isSDKReady, isLoading, error, login } = useFacebookAuth();
  const [loginError, setLoginError] = useState(null);

  const handleFacebookLogin = async () => {
    try {
      setLoginError(null);
      const userData = await login();

      // Start background music on successful login
      if (!isMusicMuted) {
        startBgMusic();
      }

      // Pass real user data to parent
      onLogin(userData);
    } catch (err) {
      console.error('Facebook login failed:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
    }
  };

  // Instagram uses the same Facebook OAuth (same account system)
  const handleInstagramLogin = async () => {
    try {
      setLoginError(null);
      const userData = await login();

      // Mark as instagram platform
      userData.platform = 'instagram';

      // Start background music on successful login
      if (!isMusicMuted) {
        startBgMusic();
      }

      // Pass real user data to parent
      onLogin(userData);
    } catch (err) {
      console.error('Instagram login failed:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
    }
  };

  // TEMPORARY: Guest login bypass while Facebook app is not verified
  const handleGuestLogin = () => {
    const guestId = `guest-${Date.now()}`;
    const guestData = {
      metaId: guestId,
      name: `Player ${Math.floor(Math.random() * 1000)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
      platform: 'facebook',
    };

    if (!isMusicMuted) {
      startBgMusic();
    }

    onLogin(guestData);
  };

  return (
    <div className="auth-container">
      <h1 style={{ marginBottom: '30px' }}>Pop Party Arcade</h1>
      <p style={{ marginBottom: '40px' }}>
        {pendingRoomCode ? 'Login to join the game!' : 'Login to compete!'}
      </p>

      {loginError && (
        <div style={{
          color: '#ff6b6b',
          marginBottom: '20px',
          padding: '10px',
          background: 'rgba(255,107,107,0.1)',
          borderRadius: '8px'
        }}>
          {loginError}
        </div>
      )}

      <button
        className="btn-social btn-fb"
        onClick={handleFacebookLogin}
        disabled={!isSDKReady || isLoading}
        style={{ opacity: (!isSDKReady || isLoading) ? 0.7 : 1 }}
      >
        {isLoading ? 'Logging in...' : 'Login with Facebook'}
      </button>

      <button
        className="btn-social btn-ig"
        onClick={handleInstagramLogin}
        disabled={!isSDKReady || isLoading}
        style={{ opacity: (!isSDKReady || isLoading) ? 0.7 : 1 }}
      >
        {isLoading ? 'Logging in...' : 'Login with Instagram'}
      </button>

      {/* TEMPORARY: Guest login while Facebook app is pending verification */}
      <button
        className="btn-social"
        onClick={handleGuestLogin}
        style={{
          marginTop: '20px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        Continue as Guest
      </button>

      {!isSDKReady && (
        <div style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>
          Loading...
        </div>
      )}

      <div style={{ marginTop: '50px', fontSize: '0.8rem', opacity: 0.7 }}>
        Compete with friends in real-time!
      </div>

      <div className="login-footer">
        <Link to="/privacy">Privacy Policy</Link>
        <span>•</span>
        <Link to="/terms">Terms of Service</Link>
      </div>
    </div>
  );
};

export default Login;
