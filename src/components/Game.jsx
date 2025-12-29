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
            alert("Correct!");
            handleNext();
        } else {
            alert("Try again!");
        }
    };

    const formatTime = (seconds) => {
        return `0:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="game-container">
            <header className="header">
                <div className="player-score-container">
                    <span className="player-label">YOU</span>
                    <div className="player-row">
                        <div className="avatar-circle player1">
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
                        style={{ left: `${currentItem['human difficulty'] ? parseInt(currentItem['human difficulty']) * 15 : 50}%` }}
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
                        <svg className="clock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="13" r="8" stroke="#1a1a2e" strokeWidth="2" fill="none"/>
                            <path d="M12 9V13L15 15" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 5V3" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 3H15" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M18 7L20 5" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    {formatTime(timeLeft)}
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
                >
                    {isListening ? '🛑' : '🎤'}
                </button>
            </div>
        </div>
    );
};

export default Game;
