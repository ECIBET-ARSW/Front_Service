import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from '../../games/FiveInLine/components/GameCanvas';
import { WaitingRoom } from '../../games/FiveInLine/components/WaitingRoom';
import { GameResultModal } from '../../games/FiveInLine/components/GameResultModal';
import { GameHUD } from '../../games/FiveInLine/components/GameHUD';
import { CountdownOverlay } from '../../games/FiveInLine/components/CountdownOverlay';
import { useSpriteLoader } from '../../games/FiveInLine/hooks/useSpriteLoader';
import { useKeyboardControls, ControlAction } from '../../games/FiveInLine/hooks/useKeyboardControls';

type GamePhase = 'selector' | 'waiting' | 'countdown' | 'playing' | 'result';

interface PlayerResult {
    playerId: string;
    playerName: string;
    position: number;
    coinsEarned: number;
    color: string;
}

interface LobbyPlayer {
    userId: string;
    username: string;
    color: string;
    isReady: boolean;
    isHost: boolean;
}

const isProduction = (import.meta as any).env?.PROD ?? false;
const API_BASE = isProduction
    ? 'https://5inline.duckdns.org/api'
    : 'http://localhost:8080/api';

const FiveInLineGame: React.FC = () => {
    const [gamePhase, setGamePhase] = useState<GamePhase>('selector');
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 8)}`);
    const [username] = useState(() => `Player_${Math.floor(Math.random() * 1000)}`);
    const [selectedColor, setSelectedColor] = useState<string>('red');
    const [results, setResults] = useState<PlayerResult[]>([]);
    const [countdownActive, setCountdownActive] = useState(false);
    const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [betAmount, setBetAmount] = useState<number>(10000);
    const [minPlayers, setMinPlayers] = useState<number>(3);
    const [joinCode, setJoinCode] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [takenColors, setTakenColors] = useState<string[]>([]);
    const [gameState, setGameState] = useState<any>(null);
    const [isTogglingReady, setIsTogglingReady] = useState(false);
    const [isCreatingLobby, setIsCreatingLobby] = useState(false);
    const [gameEndMessage, setGameEndMessage] = useState<string | null>(null);
    const pollingIntervalRef = useRef<any>(null);
    const [wsError, setWsError] = useState<string | null>(null);

    const { isLoading } = useSpriteLoader();

    useEffect(() => {
        console.log('=== LOBBY PLAYERS UPDATED ===', lobbyPlayers);
    }, [lobbyPlayers]);

    useEffect(() => {
        console.log('=== GAME PHASE CHANGED ===', gamePhase);
    }, [gamePhase]);

    useEffect(() => {
        if (gameEndMessage) {
            const timer = setTimeout(() => setGameEndMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [gameEndMessage]);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const handleAction = useCallback((action: ControlAction) => {
        if (gamePhase !== 'playing') return;
        // Simulación - en producción esto enviaría WebSocket
        console.log('Action:', action);
    }, [gamePhase]);

    useKeyboardControls({
        onAction: handleAction,
        enabled: gamePhase === 'playing'
    });

    const fetchLobbyStatus = useCallback(async (code: string) => {
        if (!code) return;
        try {
            const response = await fetch(`${API_BASE}/lobbies/public`);
            const lobbies = await response.json();
            const lobby = lobbies.find((l: any) => l.code === code);
            if (lobby && lobby.players) {
                const playersList: LobbyPlayer[] = Object.values(lobby.players).map((p: any) => ({
                    userId: p.userId,
                    username: p.username,
                    color: p.color.toLowerCase(),
                    isReady: p.isReady === true,
                    isHost: p.userId === lobby.hostId
                }));
                setLobbyPlayers(playersList);
                setIsHost(lobby.hostId === userId);
                setTakenColors(playersList.map(p => p.color));
            }
        } catch (error) {
            console.error('Error fetching lobby:', error);
            setWsError('No se pudo conectar con el servidor');
        }
    }, [userId]);

    // Polling para obtener el estado del lobby
    useEffect(() => {
        if (gamePhase === 'waiting' && roomCode) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(() => {
                fetchLobbyStatus(roomCode);
            }, 1000);
            return () => clearInterval(pollingIntervalRef.current);
        }
    }, [gamePhase, roomCode, fetchLobbyStatus]);

    const createLobby = async () => {
        if (isCreatingLobby) return;
        setIsCreatingLobby(true);
        setWsError(null);
        try {
            const response = await fetch(`${API_BASE}/lobbies/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId, username,
                    betAmount: betAmount,
                    minPlayers: minPlayers,
                    color: selectedColor.toUpperCase()
                })
            });
            const data = await response.json();
            setRoomCode(data.lobbyCode);
            setIsHost(true);
            setGamePhase('waiting');
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error:', error);
            setWsError('Error al crear la sala. ¿El backend está corriendo?');
            alert('Error al crear la sala. Verifica que el backend esté ejecutándose en http://localhost:8080');
        } finally {
            setIsCreatingLobby(false);
        }
    };

    const joinLobby = async () => {
        if (!joinCode) {
            alert('Ingresa un código de sala');
            return;
        }
        setWsError(null);
        try {
            const response = await fetch(`${API_BASE}/lobbies/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lobbyCode: joinCode.toUpperCase(),
                    userId, username,
                    betAmount: 10000,
                    color: selectedColor.toUpperCase()
                })
            });
            const data = await response.json();
            setRoomCode(data.lobbyCode);
            setIsHost(false);
            setGamePhase('waiting');
            setJoinCode('');
        } catch (error) {
            console.error('Error:', error);
            setWsError('Error al unirse a la sala. ¿El backend está corriendo?');
            alert('Error al unirse a la sala. Verifica que el backend esté ejecutándose en http://localhost:8080');
        }
    };

    const toggleReady = () => {
        if (isHost) {
            console.log('Host no puede cambiar estado');
            return;
        }

        if (isTogglingReady) return;

        setIsTogglingReady(true);

        // Simular toggle ready mediante HTTP
        fetch(`${API_BASE}/lobbies/toggle-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyCode: roomCode, userId: userId })
        }).catch(console.error);

        setTimeout(() => setIsTogglingReady(false), 1000);
    };

    const startGame = () => {
        if (isHost && roomCode) {
            fetch(`${API_BASE}/lobbies/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyCode: roomCode, userId: userId })
            }).catch(console.error);
        }
    };

    const leaveLobby = () => {
        fetch(`${API_BASE}/lobbies/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyCode: roomCode, userId: userId })
        }).catch(console.error);

        setRoomCode(null);
        setGamePhase('selector');
        setGameEndMessage(null);
    };

    const changeColor = (color: string) => {
        setSelectedColor(color);
        fetch(`${API_BASE}/lobbies/change-color`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyCode: roomCode, userId: userId, color: color.toUpperCase() })
        }).catch(console.error);
    };

    const handleCountdownComplete = () => {
        setCountdownActive(false);
        setGamePhase('playing');
    };

    const handleCloseResults = () => {
        setResults([]);
        setRoomCode(null);
        setGamePhase('selector');
        setGameEndMessage(null);
    };

    const handlePlayAgain = () => {
        handleCloseResults();
    };

    const { getSprite } = useSpriteLoader();

    const allPlayersReady = lobbyPlayers.length >= minPlayers && lobbyPlayers.length > 0 && lobbyPlayers.every(p => p.isReady === true);
    const canStartGame = isHost && allPlayersReady;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Cargando recursos del juego...</h2>
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            {wsError && (
                <div style={{
                    position: 'fixed',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ff0000',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    zIndex: 9999,
                    fontSize: '14px'
                }}>
                    ⚠️ {wsError}
                </div>
            )}

            {gamePhase === 'playing' && gameState && gameState.players && gameState.players.length > 0 && (
                <>
                    <GameCanvas gameState={gameState} canvasWidth={1024} canvasHeight={576} onAnimationFrame={undefined} />
                    <GameHUD
                        players={gameState.players.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            color: p.color,
                            lives: p.lives || 3,
                            distance: p.distance || 0,
                            maxDistance: 1000,
                            isAlive: p.isAlive !== false
                        }))}
                        currentPlayerId={userId}
                        gameTime={gameState.gameTime || 0}
                    />
                </>
            )}

            {gamePhase === 'countdown' && (
                <CountdownOverlay isActive={true} onComplete={handleCountdownComplete} initialCount={3} />
            )}

            {gamePhase === 'waiting' && roomCode && (
                <WaitingRoom
                    roomCode={roomCode}
                    players={lobbyPlayers}
                    currentPlayerId={userId}
                    onStartGame={startGame}
                    onLeaveRoom={leaveLobby}
                    onToggleReady={toggleReady}
                    onChangeColor={changeColor}
                    canStartGame={canStartGame}
                />
            )}

            {gamePhase === 'selector' && (
                <div style={{
                    backgroundImage: `url(${getSprite('lobby_lobby_background')?.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontFamily: '"Courier New", monospace'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        borderRadius: '20px',
                        padding: '40px',
                        minWidth: '450px',
                        textAlign: 'center',
                        border: '2px solid #ffd700'
                    }}>
                        <img src={getSprite('lobby_logo')?.src} alt="5InLine" style={{ width: '256px', marginBottom: '30px' }} />

                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: 'white', marginBottom: '15px' }}>Elige tu color</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {['red', 'blue', 'green', 'yellow', 'purple'].map(color => {
                                    const isTaken = takenColors.includes(color) && color !== selectedColor;
                                    return (
                                        <div
                                            key={color}
                                            onClick={() => !isTaken && changeColor(color)}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                backgroundColor: color,
                                                borderRadius: '10px',
                                                cursor: isTaken ? 'not-allowed' : 'pointer',
                                                border: selectedColor === color ? '3px solid #ffd700' : '2px solid transparent',
                                                opacity: isTaken ? 0.3 : (selectedColor === color ? 1 : 0.7),
                                                filter: isTaken ? 'grayscale(0.5)' : 'none'
                                            }}
                                            title={isTaken ? 'Color ya usado' : `Seleccionar ${color}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={() => setShowCreateModal(true)} style={{ width: '100%', padding: '15px', marginBottom: '15px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Crear Partida
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Código de sala"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                style={{ flex: 1, padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '10px', color: 'white', fontSize: '16px', textAlign: 'center' }}
                            />
                            <button onClick={joinLobby} style={{ padding: '15px 30px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Unirse
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#1a1a2e', borderRadius: '20px', padding: '30px', minWidth: '350px', textAlign: 'center', border: '2px solid #ffd700' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px' }}>Configurar Partida</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>Apuesta (COP)</label>
                            <select value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '5px', color: 'white', fontSize: '14px' }}>
                                <option value={1000}>$1,000 COP</option>
                                <option value={5000}>$5,000 COP</option>
                                <option value={10000}>$10,000 COP</option>
                                <option value={25000}>$25,000 COP</option>
                                <option value={50000}>$50,000 COP</option>
                                <option value={100000}>$100,000 COP</option>
                                <option value={200000}>$200,000 COP</option>
                                <option value={500000}>$500,000 COP</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>Mínimo de jugadores</label>
                            <select value={minPlayers} onChange={(e) => setMinPlayers(Number(e.target.value))} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '5px', color: 'white', fontSize: '14px' }}>
                                <option value={3}>3 jugadores</option>
                                <option value={4}>4 jugadores</option>
                                <option value={5}>5 jugadores</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Cancelar</button>
                            <button onClick={createLobby} disabled={isCreatingLobby} style={{ flex: 1, padding: '12px', backgroundColor: isCreatingLobby ? '#666' : '#ffd700', color: '#000', border: 'none', borderRadius: '8px', cursor: isCreatingLobby ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                                {isCreatingLobby ? 'Creando...' : 'Crear Partida'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gamePhase === 'result' && (
                <GameResultModal results={results} onClose={handleCloseResults} onPlayAgain={handlePlayAgain} />
            )}

            {gameEndMessage && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    color: '#FFD700',
                    padding: '20px 40px',
                    borderRadius: '15px',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    fontFamily: '"Courier New", monospace',
                    textAlign: 'center',
                    zIndex: 2000,
                    border: '3px solid #FFD700',
                    boxShadow: '0 0 30px rgba(255,215,0,0.5)',
                    animation: 'fadeInOut 3s ease-in-out'
                }}>
                    {gameEndMessage}
                </div>
            )}

            <style>{`
                .loader { width: 50px; height: 50px; border: 5px solid #333; border-top: 5px solid #ffd700; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeInOut { 
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `}</style>
        </div>
    );
};

export default FiveInLineGame;