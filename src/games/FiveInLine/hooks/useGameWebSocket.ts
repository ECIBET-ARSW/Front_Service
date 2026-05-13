import { useState, useEffect, useCallback, useRef } from 'react';

interface Player {
    id: string;
    name: string;
    color: string;
    animation: string;
    frameIndex: number;
    x: number;
    y: number;
    isAlive: boolean;
    lives: number;
    distance: number;
}

interface GameState {
    players: Player[];
    obstacles: any[];
    effects: any[];
    groundType: string;
    worldOffset: number;
    gameTime: number;
}

interface LobbyResponse {
    lobbyCode: string;
    lobbyId: string;
    betAmount: number;
    players?: number;
}

export const useGameWebSocket = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const roomCodeRef = useRef<string | null>(null);

    const emitEvent = useCallback((eventName: string, data: any) => {
        const customEvent = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(customEvent);
        console.log('Evento emitido:', eventName, data);
    }, []);

    const connectWebSocket = useCallback((userId: string, lobbyCode: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }

        roomCodeRef.current = lobbyCode;

        const ws = new WebSocket(`ws://localhost:8080/ws-game/websocket?userId=${userId}&lobbyCode=${lobbyCode}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket conectado exitosamente');
            setIsConnected(true);
            setError(null);
            emitEvent('gameEvent', { type: 'websocket_connected' });

            setTimeout(() => {
                fetchLobbyStatus(lobbyCode);
            }, 500);
        };

        ws.onmessage = (event) => {
            console.log('WebSocket mensaje raw:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket mensaje parseado:', data);

                if (data.type === 'GAME_STATE') {
                    setGameState(data);
                    emitEvent('gameEvent', { type: 'game_state', state: data });
                } else if (data.type === 'COUNTDOWN_START') {
                    console.log('COUNTDOWN_START recibido:', data.count);
                    emitEvent('gameEvent', { type: 'countdown_start', count: data.count });
                    emitEvent('gameEvent', { type: 'lobby_starting' });
                } else if (data.type === 'COUNTDOWN_TICK') {
                    console.log('COUNTDOWN_TICK recibido:', data.count);
                    emitEvent('gameEvent', { type: 'countdown_tick', count: data.count });
                } else if (data.type === 'COUNTDOWN_GO') {
                    console.log('COUNTDOWN_GO recibido');
                    emitEvent('gameEvent', { type: 'countdown_go' });
                } else if (data.type === 'GAME_END') {
                    console.log('GAME_END recibido');
                    emitEvent('gameEvent', { type: 'game_finished', results: data.results });
                } else if (data.type === 'GAME_STARTING') {
                    console.log('GAME_STARTING recibido del backend');
                    emitEvent('gameEvent', { type: 'lobby_starting' });
                } else if (data.type === 'LOBBY_UPDATE') {
                    console.log('LOBBY_UPDATE recibido:', data);
                    emitEvent('gameEvent', {
                        type: 'lobby_updated',
                        players: data.players,
                        lobbyCode: data.lobbyCode,
                        betAmount: data.betAmount,
                        minPlayers: data.minPlayers,
                        currentPlayers: data.currentPlayers,
                        maxPlayers: data.maxPlayers,
                        hostId: data.hostId
                    });
                } else if (data.type === 'ERROR') {
                    console.error('Error del servidor:', data.message);
                    emitEvent('gameEvent', { type: 'error', message: data.message });
                }
            } catch (e) {
                console.error('Error parseando mensaje:', e, event.data);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Error de conexión con el servidor');
            emitEvent('gameEvent', { type: 'error', message: 'Error de conexión' });
        };

        ws.onclose = () => {
            console.log('WebSocket desconectado');
            setIsConnected(false);
        };
    }, [emitEvent]);

    const fetchLobbyStatus = useCallback(async (lobbyCode: string) => {
        try {
            const response = await fetch('http://localhost:8080/api/lobbies/public');
            const lobbies = await response.json();
            const lobby = lobbies.find((l: any) => l.code === lobbyCode);
            if (lobby && lobby.players) {
                const playersList = Object.values(lobby.players).map((p: any) => ({
                    userId: p.userId,
                    username: p.username,
                    color: p.color.toLowerCase(),
                    isReady: p.isReady || false,
                    isHost: p.userId === lobby.hostId
                }));
                console.log('Fetch lobby status:', playersList);
                emitEvent('gameEvent', {
                    type: 'lobby_updated',
                    players: playersList,
                    hostId: lobby.hostId,
                    lobbyCode: lobbyCode,
                    betAmount: lobby.betAmount,
                    minPlayers: lobby.minPlayers,
                    currentPlayers: lobby.players.length,
                    maxPlayers: lobby.maxPlayers
                });
            }
        } catch (error) {
            console.error('Error fetching lobby:', error);
        }
    }, [emitEvent]);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify(message);
            wsRef.current.send(msg);
            console.log('Mensaje enviado:', message);
        } else {
            console.log('WebSocket no conectado, estado:', wsRef.current?.readyState);
        }
    }, []);

    const sendAction = useCallback((action: string) => {
        sendMessage({
            type: 'PLAYER_ACTION',
            action: action,
            timestamp: Date.now()
        });
    }, [sendMessage]);

    const sendReady = useCallback(() => {
        console.log('Enviando TOGGLE_READY...');
        sendMessage({
            type: 'TOGGLE_READY'
        });
    }, [sendMessage]);

    const sendColor = useCallback((color: string) => {
        sendMessage({
            type: 'CHANGE_COLOR',
            color: color.toUpperCase()
        });
    }, [sendMessage]);

    const sendClientReady = useCallback(() => {
        console.log('Enviando CLIENT_READY...');
        sendMessage({
            type: 'CLIENT_READY'
        });
    }, [sendMessage]);

    const leaveRoom = useCallback((lobbyCode: string, userId: string) => {
        sendMessage({
            type: 'LEAVE_ROOM',
            lobbyCode: lobbyCode
        });

        if (wsRef.current) {
            wsRef.current.close();
        }
    }, [sendMessage]);

    const createLobby = useCallback(async (userId: string, username: string, betAmount: number, minPlayers: number, color: string): Promise<LobbyResponse | null> => {
        try {
            console.log('Creando lobby:', { userId, username, betAmount, minPlayers, color });

            const response = await fetch('http://localhost:8080/api/lobbies/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    username: username,
                    betAmount: betAmount,
                    minPlayers: minPlayers,
                    color: color.toUpperCase()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Lobby creado:', data);

            if (data.lobbyCode) {
                connectWebSocket(userId, data.lobbyCode);
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error creating lobby:', error);
            setError('Error al crear la sala');
            return null;
        }
    }, [connectWebSocket]);

    const joinLobby = useCallback(async (lobbyCode: string, userId: string, username: string, betAmount: number, color: string): Promise<LobbyResponse | null> => {
        try {
            console.log('Uniendo a lobby:', { lobbyCode, userId, username, betAmount, color });

            const response = await fetch('http://localhost:8080/api/lobbies/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lobbyCode: lobbyCode,
                    userId: userId,
                    username: username,
                    betAmount: betAmount,
                    color: color.toUpperCase()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Unido a lobby:', data);

            if (data.lobbyCode) {
                connectWebSocket(userId, data.lobbyCode);
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error joining lobby:', error);
            setError('Error al unirse a la sala');
            return null;
        }
    }, [connectWebSocket]);

    const startGame = useCallback(async (lobbyCode: string, userId: string) => {
        try {
            console.log('Iniciando partida via HTTP para sala:', lobbyCode);
            const response = await fetch('http://localhost:8080/api/lobbies/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lobbyCode: lobbyCode,
                    userId: userId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('Partida iniciada via HTTP');
        } catch (error) {
            console.error('Error starting game:', error);
            setError('Error al iniciar la partida');
        }
    }, []);

    return {
        gameState,
        isConnected,
        error,
        sendAction,
        sendReady,
        sendColor,
        sendClientReady,
        leaveRoom,
        createLobby,
        joinLobby,
        startGame
    };
};