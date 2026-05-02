import React from 'react';
import { useSpriteLoader } from '../../../games/FiveInLine/hooks/useSpriteLoader';

interface PlayerResult {
    playerId: string;
    playerName: string;
    position: number;
    coinsEarned: number;
    color: string;
}

interface GameResultModalProps {
    results: PlayerResult[];
    onClose: () => void;
    onPlayAgain: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({ results, onClose, onPlayAgain }) => {
    const { getSprite } = useSpriteLoader();
    const winner = results.find(r => r.position === 1);
    const sortedResults = [...results].sort((a, b) => a.position - b.position);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '20px',
                padding: '30px',
                minWidth: '400px',
                textAlign: 'center',
                border: '2px solid #ffd700'
            }}>
                <h2 style={{ color: '#ffd700', marginBottom: '20px' }}>RESULTADOS</h2>

                {winner && (
                    <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: 'rgba(255,215,0,0.1)',
                        borderRadius: '15px'
                    }}>
                        <div style={{ color: '#ffd700', fontSize: '24px', fontWeight: 'bold' }}>
                            {winner.playerName}
                        </div>
                        <div style={{ color: 'white', fontSize: '18px' }}>
                            Ganó {winner.coinsEarned} monedas!
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '30px' }}>
                    {sortedResults.map((result) => (
                        <div key={result.playerId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 15px',
                            margin: '5px 0',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '10px'
                        }}>
                            <span>#{result.position} {result.playerName}</span>
                            <span style={{ color: '#ffd700' }}>+{result.coinsEarned}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button onClick={onPlayAgain} style={{
                        padding: '10px 25px',
                        backgroundColor: '#ffd700',
                        color: '#000',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer'
                    }}>
                        Jugar de nuevo
                    </button>
                    <button onClick={onClose} style={{
                        padding: '10px 25px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer'
                    }}>
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
};