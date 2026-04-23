import React, { useState, useEffect } from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';
import { RunnerColor, RUNNER_COLORS } from '../config/sprites.config';

interface Player {
    id: string;
    name: string;
    color: RunnerColor;
    isReady: boolean;
    isHost: boolean;
}

interface WaitingRoomProps {
    roomCode: string;
    players: Player[];
    currentPlayerId: string;
    onStartGame: () => void;
    onLeaveRoom: () => void;
    onToggleReady: () => void;
    onChangeColor: (color: RunnerColor) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
                                                            roomCode,
                                                            players,
                                                            currentPlayerId,
                                                            onStartGame,
                                                            onLeaveRoom,
                                                            onToggleReady,
                                                            onChangeColor
                                                        }) => {
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [pressedButton, setPressedButton] = useState<string | null>(null);
    const { getSprite } = useSpriteLoader();

    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const isHost = currentPlayer?.isHost || false;
    const allReady = players.length > 0 && players.every(p => p.isReady);

    const getButtonImage = (buttonType: 'create' | 'join') => {
        const state = pressedButton === buttonType ? 'pressed' : (hoveredButton === buttonType ? 'hover' : 'normal');
        return getSprite(`lobby_btn_${buttonType}_${state}`);
    };


    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert('Código de sala copiado!');
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
            {/* Contenedor principal */}
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: '20px',
                padding: '40px',
                minWidth: '500px',
                textAlign: 'center',
                border: '2px solid #ffd700',
                boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }}>

                {/* Logo */}
                <img
                    src={getSprite('lobby_logo')?.src}
                    alt="5InLine"
                    style={{
                        width: '256px',
                        marginBottom: '20px',
                        filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))'
                    }}
                />

                {/* Código de sala */}
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

                {/* Lista de jugadores */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '20px' }}>
                        Jugadores ({players.length}/5)
                    </h3>

                    {players.map(player => (
                        <div key={player.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            margin: '10px 0',
                            padding: '10px 15px',
                            borderRadius: '10px',
                            border: player.id === currentPlayerId ? '1px solid #ffd700' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img
                                    src={getSprite(`lobby_avatar_select_${player.color}`)?.src}
                                    alt={player.color}
                                    style={{ width: '48px', height: '48px', borderRadius: '10px' }}
                                />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>
                                        {player.name}
                                        {player.id === currentPlayerId && ' (Tú)'}
                                        {player.isHost && ' 👑'}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '12px' }}>
                                        {player.color.charAt(0).toUpperCase() + player.color.slice(1)}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {player.isReady ? (
                                    <span style={{ color: '#4caf50' }}> Listo</span>
                                ) : (
                                    <span style={{ color: '#ff9800' }}> Esperando...</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selector de color (solo para el jugador actual) */}
                <div style={{ marginBottom: '30px' }}>
                    <p style={{ color: 'white', marginBottom: '10px' }}>Elige tu color:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {RUNNER_COLORS.map(color => (
                            <img
                                key={color}
                                src={getSprite(`lobby_avatar_select_${color}`)?.src}
                                alt={color}
                                onClick={() => onChangeColor(color)}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    cursor: 'pointer',
                                    borderRadius: '10px',
                                    border: currentPlayer?.color === color ? '3px solid #ffd700' : '2px solid transparent',
                                    opacity: currentPlayer?.color === color ? 1 : 0.6,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPlayer?.color !== color) {
                                        e.currentTarget.style.opacity = '0.8';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPlayer?.color !== color) {
                                        e.currentTarget.style.opacity = '0.6';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button
                        onClick={onToggleReady}
                        style={{
                            backgroundColor: currentPlayer?.isReady ? '#ff9800' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {currentPlayer?.isReady ? ' No listo' : ' Listo'}
                    </button>

                    {isHost && (
                        <button
                            onClick={onStartGame}
                            disabled={!allReady}
                            style={{
                                backgroundColor: allReady ? '#ffd700' : '#666',
                                color: allReady ? '#000' : '#999',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                cursor: allReady ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (allReady) e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (allReady) e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                             Iniciar Partida
                        </button>
                    )}

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
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        🚪 Salir
                    </button>
                </div>

                {/* Mensaje de espera para el host */}
                {isHost && !allReady && (
                    <p style={{ color: '#ff9800', marginTop: '20px', fontSize: '14px' }}>
                        Esperando que todos los jugadores estén listos...
                    </p>
                )}
            </div>
        </div>
    );
};