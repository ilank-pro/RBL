import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient, useMutation } from 'convex/react';
import Login from './components/Login';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import MultiplayerGame from './components/MultiplayerGame';
import Results from './components/Results';
import JoinRoom from './components/JoinRoom';
import NotFound from './components/NotFound';
import SoundControl from './components/SoundControl';
import { AudioProvider } from './contexts/AudioContext';
import './index.css';

// Need to import api
import { api } from '../convex/_generated/api';

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

const Ornaments = () => {
  const colors = ['purple', 'blue', 'yellow', 'pink'];
  const balloons = [];
  const totalBalloons = 120;

  for (let i = 0; i < totalBalloons; i++) {
    balloons.push({
      id: `balloon-${i}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      top: `${Math.random() * 95}%`,
      left: `${Math.random() * 95}%`,
      size: 50 + Math.random() * 40,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
    });
  }

  const confetti = Array.from({ length: 80 }).map((_, i) => ({
    id: `confetti-${i}`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: ['yellow', 'blue', 'pink', 'purple'][Math.floor(Math.random() * 4)],
    delay: Math.random() * 15,
    duration: 12 + Math.random() * 8,
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="background-decorations">
      {balloons.map((b) => (
        <div
          key={b.id}
          className={`balloon ${b.color} floating`}
          style={{
            top: b.top,
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size * 1.2}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s, ${b.duration * 1.5}s`,
          }}
        >
          <div className="balloon-shine" />
        </div>
      ))}
      {confetti.map((c) => (
        <div
          key={c.id}
          className={`confetti ${c.color} drifting`}
          style={{
            left: c.left,
            top: c.top,
            width: `${c.size}px`,
            height: `${c.size * 0.4}px`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// Screen types
const SCREENS = {
  LOGIN: 'login',
  LOBBY: 'lobby',
  WAITING: 'waiting',
  GAME: 'game',
  RESULTS: 'results',
  JOIN: 'join',
};

function AppContent() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [pendingRoomCode, setPendingRoomCode] = useState(null);

  const createUser = useMutation(api.rooms.createUser);

  const handleLogin = async (platform) => {
    try {
      // Create user in Convex (mock auth for now)
      const userId = await createUser({
        name: platform === 'fb' ? 'Player' : 'Guest',
        avatar:
          platform === 'fb'
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=fb'
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=ig',
        platform: 'mock',
      });

      const newUser = {
        userId: userId,
        name: platform === 'fb' ? 'Player' : 'Guest',
        avatar:
          platform === 'fb'
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=fb'
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=ig',
        platform,
      };
      setUser(newUser);

      // If there's a pending room to join, navigate there
      if (pendingRoomCode) {
        navigate(`/join/${pendingRoomCode}`);
        setPendingRoomCode(null);
      } else {
        setScreen(SCREENS.LOBBY);
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
      // Fallback to local-only user for development
      const newUser = {
        userId: `local-${Date.now()}`,
        name: platform === 'fb' ? 'Player' : 'Guest',
        avatar:
          platform === 'fb'
            ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=fb'
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=ig',
        platform,
      };
      setUser(newUser);

      if (pendingRoomCode) {
        navigate(`/join/${pendingRoomCode}`);
        setPendingRoomCode(null);
      } else {
        setScreen(SCREENS.LOBBY);
        navigate('/');
      }
    }
  };

  const handleNeedLogin = (roomCode) => {
    setPendingRoomCode(roomCode);
    setScreen(SCREENS.LOGIN);
    navigate('/');
  };

  const handleRoomCreated = (newRoomId, code) => {
    setRoomId(newRoomId);
    setRoomCode(code);
    setIsHost(true);
    setScreen(SCREENS.WAITING);
  };

  const handleRoomJoined = (newRoomId) => {
    setRoomId(newRoomId);
    setIsHost(false);
    setScreen(SCREENS.WAITING);
    navigate('/');
  };

  const handleGameStart = (gameRoomId) => {
    setRoomId(gameRoomId);
    setScreen(SCREENS.GAME);
  };

  const handleGameEnd = (results) => {
    setGameResults(results);
    setScreen(SCREENS.RESULTS);
  };

  const handlePlayAgain = () => {
    setRoomId(null);
    setRoomCode(null);
    setIsHost(false);
    setGameResults(null);
    setScreen(SCREENS.LOBBY);
  };

  const handleExit = () => {
    setRoomId(null);
    setRoomCode(null);
    setIsHost(false);
    setGameResults(null);
    setUser(null);
    setScreen(SCREENS.LOGIN);
    navigate('/');
  };

  const renderScreen = () => {
    switch (screen) {
      case SCREENS.LOGIN:
        return <Login onLogin={handleLogin} pendingRoomCode={pendingRoomCode} />;

      case SCREENS.LOBBY:
        return (
          <Lobby
            user={user}
            onRoomCreated={handleRoomCreated}
            onRoomJoined={handleRoomJoined}
          />
        );

      case SCREENS.WAITING:
        return (
          <WaitingRoom
            roomId={roomId}
            roomCode={roomCode}
            user={user}
            isHost={isHost}
            onGameStart={handleGameStart}
          />
        );

      case SCREENS.GAME:
        return (
          <MultiplayerGame
            roomId={roomId}
            user={user}
            isHost={isHost}
            onGameEnd={handleGameEnd}
          />
        );

      case SCREENS.RESULTS:
        return (
          <Results
            hostScore={gameResults?.hostScore}
            guestScore={gameResults?.guestScore}
            host={gameResults?.host}
            guest={gameResults?.guest}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        );

      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <>
      <Ornaments />
      <SoundControl />
      <Routes>
        <Route path="/join/:roomCode" element={
          <JoinRoom
            user={user}
            onRoomJoined={handleRoomJoined}
            onNeedLogin={handleNeedLogin}
          />
        } />
        <Route path="/" element={renderScreen()} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ConvexProvider client={convex}>
        <AudioProvider>
          <AppContent />
        </AudioProvider>
      </ConvexProvider>
    </BrowserRouter>
  );
}

export default App;
