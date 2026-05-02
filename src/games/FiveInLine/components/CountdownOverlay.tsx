import React, { useState, useEffect } from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';

interface CountdownOverlayProps {
    isActive: boolean;
    onComplete: () => void;
    initialCount?: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
                                                                      isActive,
                                                                      onComplete,
                                                                      initialCount = 3
                                                                  }) => {
    const [count, setCount] = useState(initialCount);
    const { getSprite } = useSpriteLoader();

    useEffect(() => {
        if (!isActive) {
            setCount(initialCount);
            return;
        }

        if (count > 0) {
            const timer = setTimeout(() => {
                setCount(count - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                onComplete();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isActive, count, initialCount, onComplete]);

    if (!isActive) return null;

    const getCountdownImage = () => {
        if (count > 0) {
            return getSprite(`ui_countdown_${count}`);
        }
        return getSprite('ui_countdown_go');
    };

    const image = getCountdownImage();
    const isGo = count === 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000
        }}>
            {image && (
                <img
                    src={image.src}
                    alt={isGo ? 'GO!' : count.toString()}
                    style={{
                        width: '128px',
                        height: '128px',
                        animation: isGo ? 'bounce 0.5s ease-out' : 'pulse 1s ease-in-out infinite'
                    }}
                />
            )}
            {!image && (
                <div style={{
                    fontSize: '80px',
                    fontWeight: 'bold',
                    color: '#ffd700',
                    animation: isGo ? 'bounce 0.5s ease-out' : 'pulse 1s ease-in-out infinite'
                }}>
                    {isGo ? 'GO!' : count}
                </div>
            )}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes bounce {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};