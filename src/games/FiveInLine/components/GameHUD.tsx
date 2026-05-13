import React from 'react';
import { useSpriteLoader } from '../../../games/FiveInLine/hooks/useSpriteLoader';

interface PlayerHUD {
    id: string;
    name: string;
    color: string;
    lives: number;
    distance: number;
    maxDistance: number;
    isAlive: boolean;
}

interface GameHUDProps {
    players: PlayerHUD[];
    currentPlayerId: string;
    gameTime: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
                                                    players,
                                                    currentPlayerId,
                                                    gameTime
                                                }) => {
    const { getSprite } = useSpriteLoader();
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getColorStyle = (color: string): string => {
        const colors: Record<string, string> = {
            red: '#ff4444',
            blue: '#4444ff',
            green: '#44ff44',
            yellow: '#ffff44',
            purple: '#ff44ff'
        };
        return colors[color] || '#ffffff';
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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '15px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
            }}>
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
                </div>

                {currentPlayer && (
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '8px 15px',
                        borderRadius: '10px',
                        border: `2px solid ${getColorStyle(currentPlayer.color)}`,
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
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    {[1, 2, 3].map(i => (
                                        <img
                                            key={i}
                                            src={getSprite(i <= currentPlayer.lives ? 'ui_heart_full' : 'ui_heart_empty')?.src}
                                            alt="heart"
                                            style={{ width: '16px' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentPlayer && (
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '8px 15px',
                        borderRadius: '10px',
                        minWidth: '250px'
                    }}>
                        <div style={{ marginBottom: '5px' }}>
                            <span style={{ color: 'white', fontSize: '14px' }}>
                                Progreso: {Math.floor(currentPlayer.distance)} / {currentPlayer.maxDistance}
                            </span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '20px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(currentPlayer.distance / currentPlayer.maxDistance) * 100}%`,
                                height: '100%',
                                backgroundColor: '#ffd700'
                            }} />
                        </div>
                    </div>
                )}
            </div>

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
                        border: `1px solid ${getColorStyle(player.color)}`,
                        opacity: player.isAlive ? 1 : 0.5
                    }}>
                        <img
                            src={getSprite(`lobby_avatar_select_${player.color}`)?.src}
                            alt={player.name}
                            style={{ width: '32px' }}
                        />
                        <div>
                            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                                {player.name}
                            </div>
                            <div style={{ display: 'flex', gap: '3px' }}>
                                {[1, 2, 3].map(i => (
                                    <img
                                        key={i}
                                        src={getSprite(i <= player.lives ? 'ui_heart_full' : 'ui_heart_empty')?.src}
                                        alt="heart"
                                        style={{ width: '12px' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '10px 20px',
                borderRadius: '10px',
                display: 'flex',
                gap: '20px'
            }}>
                <div><span style={{ fontSize: '20px' }}>W</span> <span style={{ color: '#aaa' }}>Saltar</span></div>
                <div><span style={{ fontSize: '20px' }}>S</span> <span style={{ color: '#aaa' }}>Deslizar</span></div>
            </div>
        </div>
    );
};