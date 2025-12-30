import React from 'react';
import { useAudio } from '../contexts/AudioContext';

const SoundControl = () => {
  const { isMuted, isMusicMuted, toggleMute, toggleMusic } = useAudio();

  return (
    <div className="sound-controls">
      <button
        className={`sound-btn ${isMuted ? 'muted' : ''}`}
        onClick={toggleMute}
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      <button
        className={`sound-btn ${isMusicMuted ? 'muted' : ''}`}
        onClick={toggleMusic}
        title={isMusicMuted ? 'Enable music' : 'Disable music'}
      >
        {isMusicMuted ? '🎵' : '🎶'}
      </button>
    </div>
  );
};

export default SoundControl;
