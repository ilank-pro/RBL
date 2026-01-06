import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const Login = ({ onLogin, pendingRoomCode }) => {
  const { startBgMusic, isMusicMuted } = useAudio();
  const { loading, error, signInWithGoogle, signInWithFacebook, signInWithApple } = useFirebaseAuth();
  const [loginError, setLoginError] = useState(null);

  const handleLogin = async (signInMethod, provider) => {
    try {
      setLoginError(null);
      const userData = await signInMethod();

      // Start background music on successful login
      if (!isMusicMuted) {
        startBgMusic();
      }

      // Pass user data to parent
      onLogin(userData);
    } catch (err) {
      console.error(`${provider} login failed:`, err);
      // Handle specific Firebase auth errors
      if (err.code === 'auth/popup-closed-by-user') {
        setLoginError('Login cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError('Popup was blocked. Please allow popups for this site.');
      } else {
        setLoginError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = () => handleLogin(signInWithGoogle, 'Google');
  const handleFacebookLogin = () => handleLogin(signInWithFacebook, 'Facebook');
  const handleAppleLogin = () => handleLogin(signInWithApple, 'Apple');

  // Guest login for testing
  const handleGuestLogin = () => {
    const guestId = `guest-${Date.now()}`;
    const guestData = {
      firebaseUid: guestId,
      name: `Player ${Math.floor(Math.random() * 1000)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
      provider: 'guest',
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

      {(loginError || error) && (
        <div style={{
          color: '#ff6b6b',
          marginBottom: '20px',
          padding: '10px',
          background: 'rgba(255,107,107,0.1)',
          borderRadius: '8px'
        }}>
          {loginError || error}
        </div>
      )}

      <button
        className="btn-social btn-google"
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Logging in...' : 'Continue with Google'}
      </button>

      <button
        className="btn-social btn-apple"
        onClick={handleAppleLogin}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Logging in...' : 'Continue with Apple'}
      </button>

      <button
        className="btn-social btn-fb"
        onClick={handleFacebookLogin}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Logging in...' : 'Continue with Facebook'}
      </button>

      {/* Guest login for testing */}
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
