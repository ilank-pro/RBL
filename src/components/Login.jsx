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
    <div className="landing-page-container">
      <div className="landing-video-section">
        <div className="reel-container">
          <iframe
            src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1759292824750080&show_text=0&t=0"
            width="100%"
            height="100%"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="RBL Games Showcase"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      <div className="landing-content-section">
        <div className="auth-container">
          <h1 className="landing-title">RBL Games</h1>
          <p className="landing-description">
            Welcome to RBL Games, the ultimate destination for real-time multiplayer arcade fun.
            Compete against friends in exciting mini-games, climb the global leaderboards, and show off your skills.
            Join a room or create your own to start the party anytime, anywhere!
          </p>

          <div style={{ marginBottom: '20px', width: '100%' }}>
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

            {/* Apple login hidden for now
            <button
              className="btn-social btn-apple"
              onClick={handleAppleLogin}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in...' : 'Continue with Apple'}
            </button>
            */}

            <button
              className="btn-social btn-fb"
              onClick={handleFacebookLogin}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in...' : 'Continue with Facebook'}
            </button>

            <button
              className="btn-social btn-guest"
              onClick={handleGuestLogin}
            >
              Continue as Guest
            </button>
          </div>

          <div className="login-footer">
            <Link to="/privacy">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
