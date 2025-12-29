import React, { useState } from 'react'
import Login from './components/Login'
import Game from './components/Game'
import './index.css'

const Ornaments = () => {
  const balloons = [
    { color: 'bg-pink', top: '10%', left: '5%', delay: '0s' },
    { color: 'bg-purple', top: '15%', left: '15%', delay: '1s' },
    { color: 'bg-blue', top: '5%', right: '10%', delay: '0.5s' },
    { color: 'bg-yellow', top: '25%', right: '5%', delay: '1.5s' },
    { color: 'bg-blue', bottom: '10%', left: '5%', delay: '2s' },
    { color: 'bg-pink', bottom: '15%', left: '20%', delay: '0.8s' },
    { color: 'bg-purple', bottom: '5%', right: '15%', delay: '1.2s' },
    { color: 'bg-yellow', bottom: '20%', right: '8%', delay: '0.3s' },
  ];

  const confetti = Array.from({ length: 40 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `-${Math.random() * 20}%`,
    color: ['bg-yellow', 'bg-blue', 'bg-pink', 'bg-purple'][Math.floor(Math.random() * 4)],
    delay: `${Math.random() * 10}s`,
    duration: `${8 + Math.random() * 5}s`
  }));

  return (
    <div className="background-decorations">
      {balloons.map((b, i) => (
        <div
          key={`b-${i}`}
          className={`balloon ${b.color} floating`}
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            animationDelay: b.delay
          }}
        >
          <div className="balloon-inner"></div>
        </div>
      ))}
      {confetti.map((c, i) => (
        <div
          key={`c-${i}`}
          className={`confetti ${c.color} drifting`}
          style={{ left: c.left, top: c.top, animationDelay: c.delay, animationDuration: c.duration }}
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
