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

const API_BASE = 'http://localhost:8080/api';
const WS_BASE = 'ws://localhost:8080/ws';

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
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [isTogglingReady, setIsTogglingReady] = useState(false);
    const [isCreatingLobby, setIsCreatingLobby] = useState(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const clientReadySentRef = useRef<boolean>(false);
    const actionCountRef = useRef<number>(0);

    const { isLoading } = useSpriteLoader();

    useEffect(() => {
        console.log('=== LOBBY PLAYERS UPDATED ===');
        console.log('Players:', lobbyPlayers);
        console.log('Min players:', minPlayers);
        const allReady = lobbyPlayers.length >= minPlayers && lobbyPlayers.length > 0 && lobbyPlayers.every(p => p.isReady === true);
        console.log('All ready:', allReady);
    }, [lobbyPlayers, minPlayers]);

    useEffect(() => {
        console.log('=== GAME PHASE CHANGED ===', gamePhase);
    }, [gamePhase]);

    useEffect(() => {
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (gamePhase === 'waiting' && ws && ws.readyState === WebSocket.OPEN && !isHost && !clientReadySentRef.current) {
            const readyMsg = JSON.stringify({ type: 'CLIENT_READY' });
            ws.send(readyMsg);
            clientReadySentRef.current = true;
            console.log('CLIENT_READY sent for non-host player');
        }
    }, [gamePhase, ws, isHost]);

    const handleAction = useCallback((action: ControlAction) => {
        actionCountRef.current++;
        console.log(`[${actionCountRef.current}] handleAction called with:`, action, 'gamePhase:', gamePhase, 'ws state:', ws?.readyState);

        if (gamePhase === 'playing' && ws && ws.readyState === WebSocket.OPEN) {
            let actionStr = '';
            if (action === 'jump') {
                actionStr = 'jump';
            } else if (action === 'slide') {
                actionStr = 'slide';
            } else if (action === 'run') {
                actionStr = 'run';
            } else if (action === 'stop') {
                actionStr = 'stop';
            }
            if (actionStr) {
                const message = JSON.stringify({ type: 'PLAYER_ACTION', action: actionStr, timestamp: Date.now() });
                ws.send(message);
                console.log(`[${actionCountRef.current}] ACTION SENT:`, actionStr);
            }
        } else {
            console.log(`[${actionCountRef.current}] Cannot send action - gamePhase:`, gamePhase, 'ws readyState:', ws?.readyState);
        }
    }, [gamePhase, ws]);

    useKeyboardControls({
        onAction: handleAction,
        enabled: gamePhase === 'playing'
    });

    const fetchLobbyStatus = useCallback(async (code: string) => {
        if (!code) return;
        try {
            console.log('Fetching lobby status for:', code);
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
        }
    }, [userId]);

    useEffect(() => {
        if (gamePhase === 'waiting' && roomCode) {
            const interval = setInterval(() => {
                fetchLobbyStatus(roomCode);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [gamePhase, roomCode, fetchLobbyStatus]);

    const connectWebSocket = useCallback((lobbyCode: string) => {
        if (!lobbyCode) return;

        const wsUrl = `${WS_BASE}?userId=${userId}&lobbyCode=${lobbyCode}`;
        console.log('Connecting WebSocket to:', wsUrl);

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connected successfully to lobby:', lobbyCode);
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            pingIntervalRef.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'PING' }));
                    console.log('PING sent');
                }
            }, 10000);
        };

        socket.onmessage = (event) => {
            const rawData = event.data;
            console.log('RAW WEBSOCKET MESSAGE:', rawData);

            try {
                const data = JSON.parse(rawData);
                console.log('PARSED MESSAGE - type:', data.type);

                switch (data.type) {
                    case 'LOBBY_UPDATE':
                        console.log('LOBBY_UPDATE received');
                        const playersList: LobbyPlayer[] = (data.players || []).map((p: any) => ({
                            userId: p.userId,
                            username: p.username,
                            color: p.color,
                            isReady: p.isReady === true,
                            isHost: p.userId === data.hostId
                        }));
                        setLobbyPlayers(playersList);
                        setIsHost(data.hostId === userId);
                        setTakenColors(playersList.map(p => p.color));
                        break;

                    case 'GAME_STATE':
                        console.log('GAME_STATE received - players:', data.players?.length);
                        console.log('World offset:', data.worldOffset);
                        setGameState(data);
                        break;

                    case 'COUNTDOWN_START':
                        console.log('COUNTDOWN_START received with count:', data.count);
                        setCountdownActive(true);
                        setGamePhase('countdown');
                        break;

                    case 'COUNTDOWN_TICK':
                        console.log('COUNTDOWN_TICK received:', data.count);
                        break;

                    case 'COUNTDOWN_GO':
                        console.log('COUNTDOWN_GO received - game starting!');
                        setCountdownActive(false);
                        setGamePhase('playing');
                        break;

                    case 'GAME_END':
                        console.log('GAME_END received');
                        setResults(data.results || []);
                        setGamePhase('result');
                        break;

                    case 'PONG':
                        console.log('PONG received - connection alive');
                        break;

                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };

        socket.onclose = (event) => {
            console.log('WebSocket closed - code:', event.code, 'reason:', event.reason);
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        setWs(socket);
        return socket;
    }, [userId]);

    const createLobby = async () => {
        if (isCreatingLobby) {
            console.log('Already creating lobby, ignoring');
            return;
        }

        setIsCreatingLobby(true);
        try {
            console.log('Creating lobby with userId:', userId, 'username:', username);
            const response = await fetch(`${API_BASE}/lobbies/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    username: username,
                    betAmount: betAmount,
                    minPlayers: minPlayers,
                    color: selectedColor.toUpperCase()
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('Create lobby error:', error);
                alert(`Error creating lobby: ${error}`);
                return;
            }

            const data = await response.json();
            console.log('Lobby created successfully:', data);

            const newRoomCode = data.lobbyCode;
            setRoomCode(newRoomCode);
            setIsHost(true);
            setGamePhase('waiting');
            setShowCreateModal(false);
            clientReadySentRef.current = false;

            connectWebSocket(newRoomCode);

        } catch (error) {
            console.error('Error creating lobby:', error);
            alert('Error al crear la sala');
        } finally {
            setIsCreatingLobby(false);
        }
    };

    const joinLobby = async () => {
        if (!joinCode) {
            alert('Ingresa un código de sala');
            return;
        }

        try {
            console.log('Joining lobby with code:', joinCode, 'userId:', userId);
            const response = await fetch(`${API_BASE}/lobbies/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lobbyCode: joinCode.toUpperCase(),
                    userId: userId,
                    username: username,
                    betAmount: 10000,
                    color: selectedColor.toUpperCase()
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('Join error:', error);
                alert(`Error: ${error}`);
                return;
            }

            const data = await response.json();
            console.log('Joined lobby successfully:', data);

            const joinedRoomCode = data.lobbyCode;
            setRoomCode(joinedRoomCode);
            setIsHost(false);
            setGamePhase('waiting');
            setJoinCode('');
            clientReadySentRef.current = false;

            connectWebSocket(joinedRoomCode);

        } catch (error) {
            console.error('Error joining lobby:', error);
            alert('Error al unirse a la sala');
        }
    };

    const toggleReady = () => {
        if (isHost) {
            console.log('Host cannot toggle ready');
            return;
        }

        if (isTogglingReady) {
            console.log('Already toggling ready');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            setIsTogglingReady(true);
            const message = JSON.stringify({ type: 'TOGGLE_READY' });
            ws.send(message);
            console.log('TOGGLE_READY sent');
            setTimeout(() => setIsTogglingReady(false), 1000);
        } else {
            console.log('WebSocket not open, state:', ws?.readyState);
        }
    };

    const startGame = () => {
        if (ws && ws.readyState === WebSocket.OPEN && isHost && roomCode) {
            const startMsg = JSON.stringify({ type: 'START_GAME', lobbyCode: roomCode });
            ws.send(startMsg);
            console.log('START_GAME sent to lobby:', roomCode);

            setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const readyMsg = JSON.stringify({ type: 'CLIENT_READY' });
                    ws.send(readyMsg);
                    console.log('CLIENT_READY sent for host');
                }
            }, 100);
        } else {
            console.log('Cannot start game - ws state:', ws?.readyState, 'isHost:', isHost);
        }
    };

    const leaveLobby = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'LEAVE_ROOM', lobbyCode: roomCode }));
        }
        setRoomCode(null);
        setGamePhase('selector');
        if (ws) {
            ws.close();
            setWs(null);
        }
        clientReadySentRef.current = false;
    };

    const changeColor = (color: string) => {
        setSelectedColor(color);
        if (ws && ws.readyState === WebSocket.OPEN && roomCode) {
            ws.send(JSON.stringify({ type: 'CHANGE_COLOR', color: color.toUpperCase() }));
            console.log('CHANGE_COLOR sent:', color);
        }
    };

    const handleCountdownComplete = () => {
        console.log('Countdown complete');
        setCountdownActive(false);
        setGamePhase('playing');
    };

    const handleCloseResults = () => {
        setResults([]);
        setRoomCode(null);
        setGamePhase('selector');
        if (ws) {
            ws.close();
            setWs(null);
        }
        clientReadySentRef.current = false;
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

            <style>{`
                .loader { width: 50px; height: 50px; border: 5px solid #333; border-top: 5px solid #ffd700; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default FiveInLineGame;