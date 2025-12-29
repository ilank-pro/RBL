import React, { useState } from 'react'
import Login from './components/Login'
import Game from './components/Game'
import './index.css'

const Ornaments = () => {
  // Balloon clusters on left side
  const leftBalloons = [
    { color: 'purple', top: '5%', left: '-20px', size: 90, delay: 0 },
    { color: 'blue', top: '8%', left: '40px', size: 75, delay: 0.5 },
    { color: 'pink', top: '18%', left: '-10px', size: 80, delay: 1 },
    { color: 'yellow', top: '15%', left: '60px', size: 70, delay: 1.5 },
    { color: 'blue', top: '30%', left: '-30px', size: 85, delay: 0.8 },
    { color: 'purple', top: '35%', left: '50px', size: 70, delay: 2 },
    { color: 'pink', top: '45%', left: '-15px', size: 75, delay: 0.3 },
    { color: 'yellow', top: '50%', left: '35px', size: 80, delay: 1.2 },
    { color: 'blue', top: '60%', left: '-25px', size: 90, delay: 0.7 },
    { color: 'purple', top: '65%', left: '55px', size: 65, delay: 1.8 },
    { color: 'pink', top: '75%', left: '0px', size: 85, delay: 0.4 },
    { color: 'yellow', top: '80%', left: '45px', size: 70, delay: 2.2 },
    { color: 'blue', top: '88%', left: '-20px', size: 80, delay: 1.1 },
  ];

  // Balloon clusters on right side
  const rightBalloons = [
    { color: 'yellow', top: '3%', right: '-15px', size: 85, delay: 0.6 },
    { color: 'purple', top: '10%', right: '45px', size: 75, delay: 1.3 },
    { color: 'blue', top: '20%', right: '-25px', size: 90, delay: 0.2 },
    { color: 'pink', top: '22%', right: '55px', size: 70, delay: 1.7 },
    { color: 'yellow', top: '35%', right: '-10px', size: 80, delay: 0.9 },
    { color: 'purple', top: '40%', right: '40px', size: 75, delay: 2.1 },
    { color: 'blue', top: '52%', right: '-20px', size: 85, delay: 0.5 },
    { color: 'pink', top: '55%', right: '50px', size: 70, delay: 1.4 },
    { color: 'yellow', top: '65%', right: '0px', size: 80, delay: 1.9 },
    { color: 'purple', top: '72%', right: '60px', size: 75, delay: 0.3 },
    { color: 'blue', top: '82%', right: '-30px', size: 90, delay: 1.6 },
    { color: 'pink', top: '85%', right: '35px', size: 70, delay: 2.3 },
    { color: 'yellow', top: '92%', right: '-5px', size: 80, delay: 0.8 },
  ];

  // Confetti pieces
  const confetti = Array.from({ length: 60 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: ['yellow', 'blue', 'pink', 'purple'][Math.floor(Math.random() * 4)],
    delay: Math.random() * 15,
    duration: 12 + Math.random() * 8,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360
  }));

  return (
    <div className="background-decorations">
      {/* Left side balloons */}
      {leftBalloons.map((b, i) => (
        <div
          key={`left-${i}`}
          className={`balloon ${b.color} floating`}
          style={{
            top: b.top,
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size * 1.2}px`,
            animationDelay: `${b.delay}s`
          }}
        >
          <div className="balloon-shine" />
        </div>
      ))}

      {/* Right side balloons */}
      {rightBalloons.map((b, i) => (
        <div
          key={`right-${i}`}
          className={`balloon ${b.color} floating`}
          style={{
            top: b.top,
            right: b.right,
            width: `${b.size}px`,
            height: `${b.size * 1.2}px`,
            animationDelay: `${b.delay}s`
          }}
        >
          <div className="balloon-shine" />
        </div>
      ))}

      {/* Confetti */}
      {confetti.map((c, i) => (
        <div
          key={`confetti-${i}`}
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
