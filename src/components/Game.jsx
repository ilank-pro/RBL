import React, { useState, useEffect, useRef } from 'react';
import gameData from '../data/gameData.json';

const Game = ({ user }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [answer, setAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const currentItem = gameData[currentIndex];

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Handle time up
            handleNext();
        }
    }, [timeLeft]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setAnswer(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            recognitionRef.current.start();
        } else {
            alert("Speech recognition not supported in this browser.");
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % gameData.length);
        setTimeLeft(30);
        setAnswer('');
    };

    const checkAnswer = () => {
        const userAnswer = answer.toLowerCase().trim();
        const correctAnswers = currentItem.answer.toLowerCase().split(',').map(a => a.trim());

        if (correctAnswers.includes(userAnswer)) {
            alert("Correct! 🎉");
            handleNext();
        } else {
            alert("Try again! ❌");
        }
    };

    return (
        <div className="game-container">
            <header className="header">
                <div className="player-score-container">
                    <span className="player-label">YOU</span>
                    <div className="player-row">
                        <div className="avatar-circle">
                            <img src={user.avatar} alt="You" />
                        </div>
                        <div className="score-bar"></div>
                    </div>
                </div>

                <div className="vs-badge">VS</div>

                <div className="player-score-container">
                    <span className="player-label">PLAYER 2</span>
                    <div className="player-row">
                        <div className="score-bar"></div>
                        <div className="avatar-circle">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=player2" alt="Player 2" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="main-card-wrapper">
                <main className="main-card">
                    <img
                        src={`/assets/images/${currentItem.file}`}
                        alt="Game Challenge"
                        className="game-image"
                    />
                </main>
            </div>

            <div className="difficulty-container">
                <div className="banana-track">
                    <img
                        src="https://em-content.zobj.net/source/apple/354/banana_1f34c.png"
                        className="banana-handle"
                        alt="banana"
                        style={{ left: `${currentItem['human difficulty'] ? currentItem['human difficulty'] * 15 : 45}%` }}
                    />
                </div>
                <div className="difficulty-label">
                    <span>EASY</span>
                    <span>HARD</span>
                </div>
            </div>

            <div className="timer-area">
                <div className="timer-display">
                    <div className="clock-icon-wrapper">
                        <img src="https://em-content.zobj.net/source/apple/354/banana_1f34c.png" className="clock-icon" alt="clock" />
                    </div>
                    0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </div>
            </div>

            <div className="controls">
                <button className="btn-game btn-hint">Hint</button>
                <button className="btn-game btn-giveup" onClick={handleNext}>Give Up</button>
                <button className="btn-game btn-emoji">Send Emoji</button>
            </div>

            <div className="input-area">
                <input
                    type="text"
                    className="answer-input"
                    placeholder="Speak or type answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                />
                <button
                    className={`btn-mic ${isListening ? 'listening' : ''}`}
                    onClick={startListening}
                    style={{ transform: isListening ? 'scale(1.2)' : 'none', transition: '0.2s', fontSize: '1.2rem' }}
                >
                    {isListening ? '🛑' : '🎤'}
                </button>
            </div>
        </div>
    );
};

export default Game;
