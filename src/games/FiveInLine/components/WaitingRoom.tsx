import React, { useState } from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';

interface LobbyPlayer {
    userId: string;
    username: string;
    color: string;
    isReady: boolean;
    isHost: boolean;
}

interface WaitingRoomProps {
    roomCode: string;
    players: LobbyPlayer[];
    currentPlayerId: string;
    onStartGame: () => void;
    onLeaveRoom: () => void;
    onToggleReady: () => void;
    onChangeColor: (color: string) => void;
    canStartGame?: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
                                                            roomCode,
                                                            players,
                                                            currentPlayerId,
                                                            onStartGame,
                                                            onLeaveRoom,
                                                            onToggleReady,
                                                            onChangeColor,
                                                            canStartGame = false
                                                        }) => {
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);
    const { getSprite } = useSpriteLoader();

    const currentPlayer = players.find(p => p.userId === currentPlayerId);
    const isHost = currentPlayer?.isHost || false;
    const isCurrentPlayerReady = currentPlayer?.isReady || false;

    console.log('WaitingRoom render - isHost:', isHost, 'isCurrentPlayerReady:', isCurrentPlayerReady, 'currentPlayer:', currentPlayer);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert('¡Código de sala copiado al portapapeles!');
    };

    const getColorHex = (color: string): string => {
        const colors: Record<string, string> = {
            red: '#ff4444',
            blue: '#4444ff',
            green: '#44ff44',
            yellow: '#ffff44',
            purple: '#ff44ff'
        };
        return colors[color] || '#ffffff';
    };

    const handleToggleReadyClick = () => {
        console.log('Toggle ready button clicked');
        onToggleReady();
    };

    return (
        <div
            style={{
                backgroundImage: `url(${getSprite('lobby_lobby_background')?.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: '"Courier New", monospace',
                position: 'relative'
            }}
        >
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: '20px',
                padding: '40px',
                minWidth: '500px',
                textAlign: 'center',
                border: '2px solid #ffd700',
                boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }}>
                <img
                    src={getSprite('lobby_logo')?.src}
                    alt="5InLine"
                    style={{
                        width: '256px',
                        marginBottom: '20px',
                        filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))'
                    }}
                />

                <div
                    onClick={copyRoomCode}
                    style={{
                        marginBottom: '30px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img
                        src={getSprite('lobby_code_icon')?.src}
                        alt="Code"
                        style={{ width: '24px' }}
                    />
                    <span style={{ color: '#ffd700', fontSize: '28px', fontWeight: 'bold' }}>
                        {roomCode}
                    </span>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '20px' }}>
                        Jugadores ({players.length}/5)
                    </h3>

                    {players.length === 0 && (
                        <p style={{ color: '#aaa', textAlign: 'center' }}>
                            Esperando jugadores...
                        </p>
                    )}

                    {players.map(player => (
                        <div key={player.userId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            margin: '10px 0',
                            padding: '10px 15px',
                            borderRadius: '10px',
                            border: player.userId === currentPlayerId ? '1px solid #ffd700' : 'none',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    backgroundColor: getColorHex(player.color),
                                    borderRadius: '10px',
                                    border: '2px solid rgba(255,255,255,0.3)'
                                }} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                                        {player.username}
                                        {player.userId === currentPlayerId && ' (Tú)'}
                                        {player.isHost && ' 👑'}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '12px', textTransform: 'capitalize' }}>
                                        {player.color}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {player.isReady ? (
                                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Listo</span>
                                ) : (
                                    <span style={{ color: '#ff9800', fontWeight: 'bold' }}>○ Esperando...</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {players.length < 3 && (
                    <p style={{ color: '#ff9800', marginBottom: '20px', fontSize: '14px' }}>
                        Esperando más jugadores (mínimo 3)
                    </p>
                )}

                {players.length >= 3 && !canStartGame && (
                    <p style={{ color: '#ff9800', marginBottom: '20px', fontSize: '14px' }}>
                        Esperando a que todos los jugadores estén listos...
                    </p>
                )}

                {players.length >= 3 && canStartGame && (
                    <p style={{ color: '#4caf50', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                        🎲 Todos los jugadores están listos. ¡Puedes iniciar la partida!
                    </p>
                )}

                {/* Selector de color */}
                <div style={{ marginBottom: '30px' }}>
                    <p style={{ color: 'white', marginBottom: '10px' }}>Elige tu color:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {['red', 'blue', 'green', 'yellow', 'purple'].map(color => {
                            const isTaken = players.some(p => p.color === color && p.userId !== currentPlayerId);
                            const isSelected = currentPlayer?.color === color;
                            return (
                                <div
                                    key={color}
                                    onClick={() => !isTaken && onChangeColor(color)}
                                    onMouseEnter={() => setHoveredColor(color)}
                                    onMouseLeave={() => setHoveredColor(null)}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: getColorHex(color),
                                        borderRadius: '10px',
                                        cursor: isTaken ? 'not-allowed' : 'pointer',
                                        border: isSelected ? '3px solid #ffd700' : '2px solid transparent',
                                        opacity: isTaken ? 0.3 : (isSelected || hoveredColor === color ? 1 : 0.7),
                                        transform: hoveredColor === color && !isTaken ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
                                    }}
                                    title={isTaken ? 'Color ya usado' : `Seleccionar ${color}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Botón Listo - visible para todos excepto host */}
                    {!isHost && (
                        <button
                            onClick={handleToggleReadyClick}
                            style={{
                                backgroundColor: isCurrentPlayerReady ? '#ff9800' : '#4caf50',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'transform 0.2s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isCurrentPlayerReady ? '❌ No listo' : '✅ Listo'}
                        </button>
                    )}

                    {/* Indicador de host */}
                    {isHost && (
                        <div style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontFamily: 'inherit',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}>
                            👑 Host (siempre listo)
                        </div>
                    )}

                    {/* Botón iniciar partida - solo host */}
                    {isHost && (
                        <button
                            onClick={onStartGame}
                            disabled={!canStartGame}
                            style={{
                                backgroundColor: canStartGame ? '#ffd700' : '#666',
                                color: canStartGame ? '#000' : '#999',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                cursor: canStartGame ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'transform 0.2s',
                                boxShadow: canStartGame ? '0 2px 5px rgba(0,0,0,0.3)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (canStartGame) e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (canStartGame) e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            🎮 Iniciar Partida
                        </button>
                    )}

                    {/* Botón salir */}
                    <button
                        onClick={onLeaveRoom}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            transition: 'transform 0.2s',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        🚪 Salir
                    </button>
                </div>
            </div>
        </div>
    );
};