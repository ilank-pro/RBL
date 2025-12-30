import React, { useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

const Login = ({ onLogin, pendingRoomCode }) => {
  const { startBgMusic, isMusicMuted } = useAudio();

  // Start background music on first user interaction
  const handleLoginWithMusic = (platform) => {
    if (!isMusicMuted) {
      startBgMusic();
    }
    onLogin(platform);
  };

  return (
    <div className="auth-container">
      <h1 style={{ marginBottom: '30px' }}>Pop Party Arcade</h1>
      <p style={{ marginBottom: '40px' }}>
        {pendingRoomCode ? 'Login to join the game!' : 'Login to compete!'}
      </p>

      <button className="btn-social btn-fb" onClick={() => handleLoginWithMusic('fb')}>
        Login with Facebook
      </button>

      <button className="btn-social btn-ig" onClick={() => handleLoginWithMusic('ig')}>
        Login with Instagram
      </button>

      <div style={{ marginTop: '50px', fontSize: '0.8rem', opacity: 0.7 }}>
        Compete with friends in real-time!
      </div>
    </div>
  );
};

export default Login;
