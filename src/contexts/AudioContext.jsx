import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const AudioContext = createContext(null);

const SOUND_CONFIGS = {
  gameStart: { frequency: 880, duration: 0.3, type: 'square' },
  gameEnd: { frequency: 440, duration: 0.5, type: 'sine' },
  correctAnswer: { frequency: 1200, duration: 0.15, type: 'sine' },
  opponentCorrect: { frequency: 600, duration: 0.2, type: 'triangle' },
  emojiSend: { frequency: 1000, duration: 0.1, type: 'sine' },
  emojiReceive: { frequency: 800, duration: 0.15, type: 'sine' },
  gameWon: { frequency: 1047, duration: 0.2, type: 'sine' },
  gameLost: { frequency: 220, duration: 0.4, type: 'sawtooth' },
};

export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(true); // Music off by default
  const audioContextRef = useRef(null);
  const bgMusicRef = useRef(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedMuted = localStorage.getItem('soundMuted') === 'true';
    const savedMusicMuted = localStorage.getItem('musicMuted') !== 'false'; // Default to muted
    setIsMuted(savedMuted);
    setIsMusicMuted(savedMusicMuted);

    // Initialize background music audio element
    const bgMusic = new Audio('/assets/audio/bg-music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.25; // Subtle background volume
    bgMusicRef.current = bgMusic;

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = '';
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(async (soundName) => {
    if (isMuted) return;

    const config = SOUND_CONFIGS[soundName];
    if (!config) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      // Create envelope for nicer sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);

      // Special handling for multi-note sounds
      if (soundName === 'gameWon') {
        // Play a victory fanfare (C-E-G chord)
        [1047, 1319, 1568].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.4);
        });
      }

      if (soundName === 'gameLost') {
        // Play a descending sad sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }

      if (soundName === 'correctAnswer') {
        // Play ascending notes
        [800, 1000, 1200].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.15);
        });
      }
    } catch (err) {
      console.warn('Failed to play sound:', soundName, err);
    }
  }, [isMuted, getAudioContext]);

  // Use a ref to track muted state for callbacks
  const isMusicMutedRef = useRef(isMusicMuted);
  useEffect(() => {
    isMusicMutedRef.current = isMusicMuted;
  }, [isMusicMuted]);

  const startBgMusic = useCallback(() => {
    if (isMusicMutedRef.current || !bgMusicRef.current) return;

    bgMusicRef.current.play().catch((err) => {
      console.warn('Failed to start background music:', err);
      // Browser may block autoplay - will work after user interaction
    });
  }, []);

  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem('soundMuted', String(newValue));
      return newValue;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem('musicMuted', String(newValue));
      if (newValue) {
        // Muting - stop the music
        if (bgMusicRef.current) {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
        }
      } else {
        // Unmuting - start the music
        if (bgMusicRef.current) {
          bgMusicRef.current.play().catch((err) => {
            console.warn('Failed to start background music:', err);
          });
        }
      }
      return newValue;
    });
  }, []);

  return (
    <AudioContext.Provider
      value={{
        playSound,
        startBgMusic,
        stopBgMusic,
        toggleMute,
        toggleMusic,
        isMuted,
        isMusicMuted,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;
