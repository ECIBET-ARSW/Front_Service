import React, { useRef, useEffect, useCallback } from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';
import { GroundType, ObstacleType, RunnerColor, RunnerAnimation } from '../config/sprites.config';

interface Player {
    id: string;
    name: string;
    color: RunnerColor;
    animation: RunnerAnimation;
    frameIndex: number;
    x: number;
    y: number;
    isAlive: boolean;
}

interface Obstacle {
    type: ObstacleType;
    frameIndex: number;
    x: number;
    y: number;
}

interface Effect {
    type: 'dust' | 'jump' | 'explosion' | 'star';
    frameIndex: number;
    x: number;
    y: number;
    duration?: number;
}

interface GameState {
    players: Player[];
    obstacles: Obstacle[];
    effects: Effect[];
    groundType: GroundType;
    worldOffset: number;
    gameTime: number;
}

interface GameCanvasProps {
    gameState: GameState | null;
    canvasWidth: number;
    canvasHeight: number;
    onAnimationFrame?: (timestamp: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
                                                          gameState,
                                                          canvasWidth,
                                                          canvasHeight,
                                                          onAnimationFrame
                                                      }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const {
        isLoading,
        drawFrame,
        drawGroundTile,
        drawObstacle,
        getAnimationConfig,
        getSprite
    } = useSpriteLoader();

    const GROUND_Y = canvasHeight - 100;
    const TILE_SIZE = 32;

    useEffect(() => {
        console.log('GameCanvas - gameState changed:', gameState);
        console.log('GameCanvas - isLoading:', isLoading);
        console.log('GameCanvas - canvas dimensions:', canvasWidth, canvasHeight);
    }, [gameState, isLoading, canvasWidth, canvasHeight]);

    const drawSky = useCallback((ctx: CanvasRenderingContext2D) => {
        console.log('Drawing sky');
        const skyImg = getSprite('sky');
        if (skyImg) {
            ctx.drawImage(skyImg, 0, 0, canvasWidth, canvasHeight);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f3460');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
    }, [canvasWidth, canvasHeight, getSprite]);

    const drawGround = useCallback((ctx: CanvasRenderingContext2D, worldOffset: number) => {
        if (!gameState?.groundType) {
            console.log('No groundType in gameState');
            return;
        }

        console.log('Drawing ground, worldOffset:', worldOffset);
        const tilesNeeded = Math.ceil(canvasWidth / TILE_SIZE) + 2;
        const startTile = Math.floor(worldOffset / TILE_SIZE);

        for (let i = -1; i < tilesNeeded; i++) {
            const tileX = (i + startTile) * TILE_SIZE - (worldOffset % TILE_SIZE);
            if (tileX > -TILE_SIZE && tileX < canvasWidth) {
                drawGroundTile(gameState.groundType, ctx, tileX, GROUND_Y, TILE_SIZE, TILE_SIZE);
            }
        }
    }, [canvasWidth, gameState?.groundType, drawGroundTile, GROUND_Y]);

    const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
        if (!gameState?.obstacles) {
            console.log('No obstacles in gameState');
            return;
        }

        console.log('Drawing obstacles, count:', gameState.obstacles.length);
        const visibleObstacles = gameState.obstacles.filter(
            (obs) => obs.x > -100 && obs.x < canvasWidth + 100
        );

        visibleObstacles.forEach((obstacle) => {
            drawObstacle(
                obstacle.type,
                obstacle.frameIndex,
                ctx,
                obstacle.x,
                obstacle.y,
                1
            );
        });
    }, [gameState?.obstacles, canvasWidth, drawObstacle]);

    const drawPlayers = useCallback((ctx: CanvasRenderingContext2D) => {
        if (!gameState?.players) {
            console.log('No players in gameState');
            return;
        }

        console.log('Drawing players, count:', gameState.players.length);

        gameState.players.forEach((player) => {
            console.log(`Player ${player.name}: x=${player.x}, y=${player.y}, isAlive=${player.isAlive}, animation=${player.animation}, frameIndex=${player.frameIndex}`);

            if (!player.isAlive) return;

            const config = getAnimationConfig(player.color, player.animation);
            console.log(`Animation config for ${player.color}_${player.animation}:`, config);

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(player.x + 16, player.y + 28, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            drawFrame(
                `${player.color}_${player.animation}`,
                player.frameIndex,
                ctx,
                player.x,
                player.y,
                1,
                false
            );

            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(player.name, player.x + 16, player.y - 8);
            ctx.restore();
        });
    }, [gameState?.players, drawFrame, getAnimationConfig]);

    const drawEffects = useCallback((ctx: CanvasRenderingContext2D) => {
        if (!gameState?.effects) return;

        gameState.effects.forEach((effect) => {
            let spriteKey = '';
            let scale = 1;

            switch (effect.type) {
                case 'dust':
                    spriteKey = 'ui_dust';
                    scale = 1;
                    break;
                case 'jump':
                    spriteKey = 'ui_jump_effect';
                    scale = 1.5;
                    break;
                case 'explosion':
                    spriteKey = 'ui_explosion';
                    scale = 1.5;
                    break;
                case 'star':
                    spriteKey = 'ui_star';
                    scale = 1;
                    break;
            }

            if (spriteKey) {
                drawFrame(spriteKey, effect.frameIndex, ctx, effect.x, effect.y, scale);
            }
        });
    }, [gameState?.effects, drawFrame]);

    const animate = useCallback((timestamp: number) => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (gameState) {
            console.log('Rendering game frame');
            drawSky(ctx);
            drawGround(ctx, gameState.worldOffset);
            drawObstacles(ctx);
            drawPlayers(ctx);
            drawEffects(ctx);
        } else {
            console.log('No gameState, showing waiting message');
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.font = '24px "Courier New", monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText('Esperando partida...', canvasWidth / 2, canvasHeight / 2);
            ctx.textAlign = 'left';
        }

        if (onAnimationFrame) {
            onAnimationFrame(timestamp);
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [canvasWidth, canvasHeight, gameState, drawSky, drawGround, drawObstacles, drawPlayers, drawEffects, onAnimationFrame]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate]);

    return (
        <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
                imageRendering: 'pixelated',
                backgroundColor: '#000'
            }}
        />
    );
};