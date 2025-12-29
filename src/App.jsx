import React, { useState } from 'react'
import Login from './components/Login'
import Game from './components/Game'
import './index.css'

const Ornaments = () => {
  // Generate balloons to fill entire screen - regenerates on each refresh
  const colors = ['purple', 'blue', 'yellow', 'pink'];
  const balloons = [];
  const totalBalloons = 120;

  // Scatter balloons across entire screen
  for (let i = 0; i < totalBalloons; i++) {
    balloons.push({
      id: `balloon-${i}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      top: `${Math.random() * 95}%`,
      left: `${Math.random() * 95}%`,
      size: 50 + Math.random() * 40,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    });
  }

  // Confetti pieces
  const confetti = Array.from({ length: 80 }).map((_, i) => ({
      id: `confetti-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      color: ['yellow', 'blue', 'pink', 'purple'][Math.floor(Math.random() * 4)],
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 8,
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360
    }));

  return (
    <div className="background-decorations">
      {/* All balloons */}
      {balloons.map((b) => (
        <div
          key={b.id}
          className={`balloon ${b.color} floating`}
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            width: `${b.size}px`,
            height: `${b.size * 1.2}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s, ${b.duration * 1.5}s`
          }}
        >
          <div className="balloon-shine" />
        </div>
      ))}

      {/* Confetti */}
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
            transform: `rotate(${c.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (platform) => {
    // Mock user data
    setUser({
      name: 'Ilan',
      avatar: platform === 'fb'
        ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=fb'
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=ig',
      platform
    })
  }

  return (
    <>
      <Ornaments />

      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Game user={user} />
      )}
    </>
  )
}

export default App
