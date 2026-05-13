import { useState, useEffect } from 'react';
import { RunnerColor, RunnerAnimation } from '../config/sprites.config';

interface MockPlayer {
    id: string;
    name: string;
    color: RunnerColor;
    animation: RunnerAnimation;
    frameIndex: number;
    x: number;
    y: number;
    isAlive: boolean;
    lives: number;
    distance: number;
}

interface MockGameState {
    players: MockPlayer[];
    obstacles: any[];
    effects: any[];
    groundType: 'normal' | 'cracked' | 'wet' | 'slippery';
    worldOffset: number;
    gameTime: number;
}

export const useMockGame = (isPlaying: boolean, playerAction?: string) => {
    const [gameState, setGameState] = useState<MockGameState | null>(null);
    const [gameTime, setGameTime] = useState(0);

    useEffect(() => {
        console.log('useMockGame - isPlaying:', isPlaying);

        if (!isPlaying) {
            setGameState(null);
            setGameTime(0);
            return;
        }

        const initialState: MockGameState = {
            players: [
                {
                    id: 'player1',
                    name: 'Tu',
                    color: 'red',
                    animation: 'idle',
                    frameIndex: 0,
                    x: 400,
                    y: 400,
                    isAlive: true,
                    lives: 3,
                    distance: 0
                },
                {
                    id: 'player2',
                    name: 'Bot Azul',
                    color: 'blue',
                    animation: 'running',
                    frameIndex: 0,
                    x: 500,
                    y: 400,
                    isAlive: true,
                    lives: 3,
                    distance: 50
                },
                {
                    id: 'player3',
                    name: 'Bot Verde',
                    color: 'green',
                    animation: 'running',
                    frameIndex: 0,
                    x: 600,
                    y: 400,
                    isAlive: true,
                    lives: 2,
                    distance: 120
                }
            ],
            obstacles: [
                { type: 'wall', x: 800, y: 368, frameIndex: 0 },
                { type: 'spike', x: 1000, y: 400, frameIndex: 0 },
                { type: 'platform', x: 1200, y: 380, frameIndex: 0 },
                { type: 'lava', x: 1400, y: 416, frameIndex: 0 },
                { type: 'rock', x: 1600, y: 400, frameIndex: 0 }
            ],
            effects: [],
            groundType: 'normal',
            worldOffset: 0,
            gameTime: 0
        };

        console.log('Initial gameState created:', initialState);
        setGameState(initialState);

        const timer = setInterval(() => {
            setGameTime(prev => {
                console.log('Game time:', prev + 1);
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying]);

    useEffect(() => {
        if (!gameState || !isPlaying) return;

        const interval = setInterval(() => {
            setGameState(prev => {
                if (!prev) return prev;

                const newPlayers = prev.players.map(player => {
                    let newAnimation = player.animation;
                    let newFrameIndex = (player.frameIndex + 1) % 4;
                    let newX = player.x;
                    let newDistance = player.distance;

                    if (player.id === 'player1') {
                        if (playerAction === 'moveRight') {
                            newX = Math.min(newX + 5, 800);
                            newAnimation = 'running';
                            newDistance = newDistance + 1;
                        } else if (playerAction === 'moveLeft') {
                            newX = Math.max(newX - 5, 50);
                            newAnimation = 'running';
                        } else if (playerAction === 'jump') {
                            newAnimation = 'jumping';
                        } else if (playerAction === 'slide') {
                            newAnimation = 'sliding';
                        } else {
                            newAnimation = 'idle';
                        }
                    } else {
                        if (player.color === 'blue') {
                            newX = player.x + 2;
                            newAnimation = 'running';
                            newDistance = player.distance + 0.5;
                        } else if (player.color === 'green') {
                            newX = player.x + 1.5;
                            newAnimation = 'running';
                            newDistance = player.distance + 0.3;
                        }
                    }

                    return {
                        ...player,
                        x: newX,
                        y: 400,
                        animation: newAnimation,
                        frameIndex: newFrameIndex,
                        distance: newDistance
                    };
                });

                const newWorldOffset = prev.worldOffset + 1;

                return {
                    ...prev,
                    players: newPlayers,
                    worldOffset: newWorldOffset,
                    gameTime: gameTime
                };
            });
        }, 100);

        return () => clearInterval(interval);
    }, [gameState, isPlaying, playerAction, gameTime]);

    return { gameState, gameTime };
};