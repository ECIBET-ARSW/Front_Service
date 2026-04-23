import React, { useState, useEffect } from 'react';
import { GameCanvas } from '../../games/FiveInLine/components/GameCanvas';
import { WaitingRoom } from '../../games/FiveInLine/components/WaitingRoom';
import { GameResultModal } from '../../games/FiveInLine/components/GameResultModal';
import { GameHUD } from '../../games/FiveInLine/components/GameHUD';
import { CountdownOverlay } from '../../games/FiveInLine/components/CountdownOverlay';
import { useSpriteLoader } from '../../games/FiveInLine/hooks/useSpriteLoader';
import { useKeyboardControls, ControlAction } from '../../games/FiveInLine/hooks/useKeyboardControls';
import { useMockGame } from '../../games/FiveInLine/hooks/useMockGame';

type GamePhase = 'waiting' | 'countdown' | 'playing' | 'result';

const FiveInLineGame: React.FC = () => {
    const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
    const [playerAction, setPlayerAction] = useState<ControlAction>('none');
    const [results, setResults] = useState([]);
    const { isLoading } = useSpriteLoader();

    const { isMovingLeft, isMovingRight, isJumping, isSliding } = useKeyboardControls({
        onAction: (action) => {
            if (gamePhase === 'playing') {
                setPlayerAction(action);
                setTimeout(() => setPlayerAction('none'), 200);
            }
        },
        enabled: gamePhase === 'playing'
    });

    const { gameState, gameTime } = useMockGame(gamePhase === 'playing',
        isMovingRight ? 'moveRight' : isMovingLeft ? 'moveLeft' :
            isJumping ? 'jump' : isSliding ? 'slide' : 'none'
    );

    const handleStartGame = () => {
        setGamePhase('countdown');
    };

    const handleCountdownComplete = () => {
        setGamePhase('playing');
    };

    const handleGameEnd = () => {
        setResults([
            { playerId: '1', playerName: 'Tu', position: 1, coinsEarned: 100, color: 'red' },
            { playerId: '2', playerName: 'Bot Azul', position: 2, coinsEarned: 50, color: 'blue' },
            { playerId: '3', playerName: 'Bot Verde', position: 3, coinsEarned: 25, color: 'green' }
        ]);
        setGamePhase('result');
    };

    const handleCloseResults = () => {
        setGamePhase('waiting');
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#000',
                color: '#fff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Cargando recursos del juego...</h2>
                    <div style={{ marginTop: '20px' }}>
                        <div className="loader"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            {(gamePhase === 'playing' || gamePhase === 'countdown') && (
                <>
                    <GameCanvas
                        gameState={gameState}
                        canvasWidth={1024}
                        canvasHeight={576}
                        onAnimationFrame={undefined}
                    />

                    <GameHUD
                        players={gameState?.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            color: p.color,
                            lives: p.lives,
                            distance: p.distance,
                            maxDistance: 1000,
                            isAlive: p.isAlive
                        })) || []}
                        currentPlayerId="player1"
                        gameTime={gameTime}
                    />

                    <CountdownOverlay
                        isActive={gamePhase === 'countdown'}
                        onComplete={handleCountdownComplete}
                    />

                    <button
                        onClick={handleGameEnd}
                        style={{
                            position: 'absolute',
                            bottom: 20,
                            right: 20,
                            zIndex: 100,
                            padding: '10px 20px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Terminar Partida Demo
                    </button>
                </>
            )}

            {gamePhase === 'waiting' && (
                <WaitingRoom
                    roomCode="DEMO123"
                    players={[
                        { id: '1', name: 'Tu', color: 'red', isReady: true, isHost: true },
                        { id: '2', name: 'Bot Azul', color: 'blue', isReady: true, isHost: false },
                        { id: '3', name: 'Bot Verde', color: 'green', isReady: true, isHost: false }
                    ]}
                    currentPlayerId="1"
                    onStartGame={handleStartGame}
                    onLeaveRoom={() => console.log('Salir')}
                    onToggleReady={() => console.log('Toggle ready')}
                    onChangeColor={() => console.log('Change color')}
                />
            )}

            {gamePhase === 'result' && (
                <GameResultModal
                    results={results}
                    onClose={handleCloseResults}
                    onPlayAgain={handleStartGame}
                />
            )}

            <style>{`
                .loader {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #333;
                    border-top: 5px solid #ffd700;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default FiveInLineGame;