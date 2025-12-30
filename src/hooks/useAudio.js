import { useEffect, useRef, useState } from 'react';

// Sound effects mapping
const SOUNDS = {
  bgMusic: '/assets/audio/background-music.mp3',
  gameStart: '/assets/audio/game-start.mp3',
  gameEnd: '/assets/audio/game-end.mp3',
  correctAnswer: '/assets/audio/correct-answer.mp3',
  opponentCorrect: '/assets/audio/opponent-correct.mp3',
  emojiSend: '/assets/audio/emoji-send.mp3',
  emojiReceive: '/assets/audio/emoji-receive.mp3',
  gameWon: '/assets/audio/game-won.mp3',
  gameLost: '/assets/audio/game-lost.mp3',
};

// Placeholder sound URLs (using free sound placeholders)
const PLACEHOLDER_SOUNDS = {
  bgMusic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  gameStart: 'https://www.myinstants.com/media/sounds/ready-go.mp3',
  gameEnd: 'https://www.myinstants.com/media/sounds/game-over-sound-effect.mp3',
  correctAnswer: 'https://www.myinstants.com/media/sounds/correct-answer.mp3',
  opponentCorrect: 'https://www.myinstants.com/media/sounds/pop-sound-effect.mp3',
  emojiSend: 'https://www.myinstants.com/media/sounds/pop_1.mp3',
  emojiReceive: 'https://www.myinstants.com/media/sounds/notification-sound.mp3',
  gameWon: 'https://www.myinstants.com/media/sounds/victory-fanfare.mp3',
  gameLost: 'https://www.myinstants.com/media/sounds/sad-trombone.mp3',
};

const useAudio = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioRefs = useRef({});
  const bgMusicRef = useRef(null);

  useEffect(() => {
    // Load mute settings from localStorage
    const savedMuted = localStorage.getItem('soundMuted') === 'true';
    const savedMusicMuted = localStorage.getItem('musicMuted') === 'true';
    setIsMuted(savedMuted);
    setIsMusicMuted(savedMusicMuted);

    // Initialize audio elements
    Object.keys(SOUNDS).forEach((key) => {
      if (key !== 'bgMusic') {
        const audio = new Audio();
        // Try custom sound first, fallback to placeholder
        audio.src = SOUNDS[key];
        audio.onerror = () => {
          // If custom sound fails, use placeholder
          audio.src = PLACEHOLDER_SOUNDS[key];
        };
        audio.preload = 'auto';
        audioRefs.current[key] = audio;
      }
    });

    // Initialize background music
    const bgMusic = new Audio();
    bgMusic.src = SOUNDS.bgMusic;
    bgMusic.onerror = () => {
      bgMusic.src = PLACEHOLDER_SOUNDS.bgMusic;
    };
    bgMusic.loop = true;
    bgMusic.volume = 0.3; // Lower volume for background music
    bgMusicRef.current = bgMusic;

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = '';
      }
    };
  }, []);

  const playSound = (soundName) => {
    if (isMuted || !audioRefs.current[soundName]) return;

    try {
      const audio = audioRefs.current[soundName];
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn('Failed to play sound:', soundName, err);
      });
    } catch (err) {
      console.warn('Error playing sound:', soundName, err);
    }
  };

  const startBgMusic = () => {
    if (isMusicMuted || !bgMusicRef.current) return;

    bgMusicRef.current.play().catch((err) => {
      console.warn('Failed to start background music:', err);
      // Try again on user interaction
      document.addEventListener('click', () => {
        bgMusicRef.current?.play().catch(() => {});
      }, { once: true });
    });
  };

  const stopBgMusic = () => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.pause();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('soundMuted', String(newMuted));
  };

  const toggleMusic = () => {
    const newMusicMuted = !isMusicMuted;
    setIsMusicMuted(newMusicMuted);
    localStorage.setItem('musicMuted', String(newMusicMuted));

    if (newMusicMuted) {
      stopBgMusic();
    } else {
      startBgMusic();
    }
  };

  return {
    playSound,
    startBgMusic,
    stopBgMusic,
    toggleMute,
    toggleMusic,
    isMuted,
    isMusicMuted,
  };
};

export default useAudio;