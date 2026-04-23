import React from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';
import { RunnerColor } from '../config/sprites.config';

interface PlayerHUD {
    id: string;
    name: string;
    color: RunnerColor;
    lives: number;
    distance: number;
    maxDistance: number;
    isAlive: boolean;
}

interface GameHUDProps {
    players: PlayerHUD[];
    currentPlayerId: string;
    gameTime: number;
    worldRecord?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
                                                    players,
                                                    currentPlayerId,
                                                    gameTime,
                                                    worldRecord
                                                }) => {
    const { getSprite } = useSpriteLoader();
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getColorForRunner = (color: RunnerColor): string => {
        const colors = {
            red: '#ff4444',
            blue: '#4444ff',
            green: '#44ff44',
            yellow: '#ffff44',
            purple: '#ff44ff'
        };
        return colors[color];
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            pointerEvents: 'none',
            zIndex: 10,
            fontFamily: '"Courier New", monospace'
        }}>
            {/* Barra superior */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '15px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
            }}>
                {/* Tiempo y récord */}
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '8px 15px',
                    borderRadius: '10px',
                    border: '1px solid #ffd700'
                }}>
                    <div style={{ color: '#ffd700', fontSize: '12px' }}>TIEMPO</div>
                    <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                        {formatTime(gameTime)}
                    </div>
                    {worldRecord && (
                        <div style={{ color: '#aaa', fontSize: '10px' }}>
                            Record: {formatTime(worldRecord)}
                        </div>
                    )}
                </div>

                {/* Información del jugador actual */}
                {currentPlayer && (
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '8px 15px',
                        borderRadius: '10px',
                        border: `2px solid ${getColorForRunner(currentPlayer.color)}`,
                        minWidth: '200px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                                src={getSprite(`lobby_avatar_select_${currentPlayer.color}`)?.src}
                                alt={currentPlayer.name}
                                style={{ width: '40px', borderRadius: '5px' }}
                            />
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>
                                    {currentPlayer.name}
                                </div>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <img
                                            key={i}
                                            src={getSprite(i < currentPlayer.lives ? 'ui_heart_full' : 'ui_heart_empty')?.src}
                                            alt="heart"
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                    ))}
                                    {/* Estrellas decorativas */}
                                    <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
                                        <span style={{ color: '#ffd700', fontSize: '12px' }}>⭐</span>
                                        <span style={{ color: '#ffd700', fontSize: '12px' }}>⭐</span>
                                        <span style={{ color: '#ffd700', fontSize: '12px' }}>⭐</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra de progreso de distancia */}
                {currentPlayer && (
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '8px 15px',
                        borderRadius: '10px',
                        minWidth: '250px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <img
                                src={getSprite('ui_distance_icon')?.src}
                                alt="distance"
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ color: 'white', fontSize: '14px' }}>
                                Progreso: {Math.floor(currentPlayer.distance)} / {currentPlayer.maxDistance}
                            </span>
                        </div>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '20px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={getSprite('ui_progress_bar_bg')?.src}
                                alt="bg"
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '20px',
                                    top: 0,
                                    left: 0
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                width: `${(currentPlayer.distance / currentPlayer.maxDistance) * 100}%`,
                                height: '20px',
                                overflow: 'hidden',
                                borderRadius: '10px'
                            }}>
                                <img
                                    src={getSprite('ui_progress_bar_fill')?.src}
                                    alt="fill"
                                    style={{
                                        width: '100%',
                                        height: '20px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de jugadores (lado izquierdo) con estrellas */}
            <div style={{
                position: 'absolute',
                left: '20px',
                top: '100px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {players.filter(p => p.id !== currentPlayerId).map(player => (
                    <div key={player.id} style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: `1px solid ${getColorForRunner(player.color)}`,
                        opacity: player.isAlive ? 1 : 0.5
                    }}>
                        <img
                            src={getSprite(`lobby_avatar_select_${player.color}`)?.src}
                            alt={player.name}
                            style={{ width: '32px', borderRadius: '5px' }}
                        />
                        <div>
                            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                {player.name}
                            </div>
                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                {/* Vidas (corazones) */}
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <img
                                        key={i}
                                        src={getSprite(i < player.lives ? 'ui_heart_full' : 'ui_heart_empty')?.src}
                                        alt="heart"
                                        style={{ width: '12px', height: '12px' }}
                                    />
                                ))}
                                {/* Estrellas decorativas al lado */}
                                <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
                                    <span style={{ color: '#ffd700', fontSize: '10px' }}>⭐</span>
                                    <span style={{ color: '#ffd700', fontSize: '10px' }}>⭐</span>
                                    <span style={{ color: '#ffd700', fontSize: '10px' }}>⭐</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controles */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '10px 20px',
                borderRadius: '10px',
                display: 'flex',
                gap: '20px',
                pointerEvents: 'none'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>A D</div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>Moverse</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>W</div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>Saltar</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>S</div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>Deslizar</div>
                </div>
            </div>
        </div>
    );
};