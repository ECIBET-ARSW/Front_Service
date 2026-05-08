import React, { useRef, useEffect, useCallback } from 'react';
import { useSpriteLoader } from '../hooks/useSpriteLoader';
import { ObstacleType } from '../config/sprites.config';

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

interface Obstacle {
    type: string;
    frameIndex: number;
    x: number;
    y: number;
}

interface Effect {
    type: string;
    frameIndex: number;
    x: number;
    y: number;
}

interface GameState {
    players: Player[];
    obstacles: Obstacle[];
    effects: Effect[];
    groundType: string;
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
    const { drawFrame, drawObstacle, getSprite } = useSpriteLoader();

    const GROUND_START_Y = canvasHeight - 120;
    const GROUND_BOTTOM_Y = canvasHeight;

    const drawSky = useCallback((ctx: CanvasRenderingContext2D) => {
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

    const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
        const groundHeight = GROUND_BOTTOM_Y - GROUND_START_Y;

        ctx.fillStyle = '#800080';
        ctx.fillRect(0, GROUND_START_Y, canvasWidth, groundHeight);

        ctx.fillStyle = '#9932CC';
        ctx.fillRect(0, GROUND_START_Y, canvasWidth, 3);

        ctx.fillStyle = '#4B0082';
        ctx.fillRect(0, GROUND_BOTTOM_Y - 4, canvasWidth, 4);
    }, [canvasWidth, GROUND_START_Y, GROUND_BOTTOM_Y]);

    const drawObstacles = useCallback((ctx: CanvasRenderingContext2D, worldOffset: number) => {
        if (!gameState?.obstacles) return;

        const visibleObstacles = gameState.obstacles.filter((obs) => {
            const screenX = obs.x - worldOffset;
            return screenX > -200 && screenX < canvasWidth + 200;
        });

        visibleObstacles.forEach((obstacle) => {
            const screenX = obstacle.x - worldOffset;
            let obstacleType: ObstacleType = 'platform';

            switch (obstacle.type.toLowerCase()) {
                case 'wall': obstacleType = 'wall'; break;
                case 'spike': obstacleType = 'spike'; break;
                case 'pit': obstacleType = 'pit'; break;
                case 'platform': obstacleType = 'platform'; break;
                case 'rock': obstacleType = 'rock'; break;
                case 'lava': obstacleType = 'lava'; break;
                case 'blade': obstacleType = 'blade'; break;
                case 'sink_block': obstacleType = 'sink_block'; break;
                case 'trampoline': obstacleType = 'trampoline'; break;
                case 'powerup_speed': obstacleType = 'powerup_speed'; break;
                default: obstacleType = 'platform';
            }

            drawObstacle(obstacleType, obstacle.frameIndex, ctx, screenX, obstacle.y, 1);
        });
    }, [gameState?.obstacles, canvasWidth, drawObstacle]);

    const drawPlayers = useCallback((ctx: CanvasRenderingContext2D, worldOffset: number) => {
        if (!gameState?.players) return;

        const sortedPlayers = [...gameState.players].sort((a, b) => a.y - b.y);

        sortedPlayers.forEach((player) => {
            if (!player.isAlive) return;

            const screenX = player.x - worldOffset;
            const spriteKey = `${player.color}_${player.animation}`;

            ctx.save();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX + 16, player.y + 28, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            drawFrame(spriteKey, player.frameIndex, ctx, screenX, player.y, 1, false);

            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 0;
            ctx.fillText(player.name, screenX + 16, player.y - 8);

            for (let i = 0; i < Math.min(player.lives, 5); i++) {
                const heartImg = getSprite('ui_heart_full');
                if (heartImg) {
                    ctx.drawImage(heartImg, screenX - 5 + (i * 12), player.y - 20, 10, 10);
                }
            }

            ctx.restore();
        });
    }, [gameState?.players, drawFrame, getSprite]);

    const drawEffects = useCallback((ctx: CanvasRenderingContext2D, worldOffset: number) => {
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
                const screenX = effect.x - worldOffset;
                drawFrame(spriteKey, effect.frameIndex, ctx, screenX, effect.y, scale);
            }
        });
    }, [gameState?.effects, drawFrame]);

    const drawUI = useCallback((ctx: CanvasRenderingContext2D) => {
        if (!gameState) return;

        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        const minutes = Math.floor(gameState.gameTime / 60);
        const seconds = Math.floor(gameState.gameTime % 60);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(timeString, 20, 40);

        const distanceImg = getSprite('ui_distance_icon');
        if (distanceImg) {
            ctx.drawImage(distanceImg, 20, 55, 20, 20);
        }
        if (gameState.players && gameState.players.length > 0) {
            const playerDistance = gameState.players[0].distance;
            ctx.fillText(`${Math.floor(playerDistance)}m`, 45, 72);
        }

        ctx.textAlign = 'right';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(`${gameState.players?.length || 0} players`, canvasWidth - 20, 30);

        const aliveCount = gameState.players?.filter(p => p.isAlive).length || 0;
        ctx.fillStyle = aliveCount > 1 ? '#44FF44' : '#FF4444';
        ctx.fillText(`Alive: ${aliveCount}`, canvasWidth - 20, 55);

        ctx.textAlign = 'left';
    }, [gameState, canvasWidth, getSprite]);

    const animate = useCallback((timestamp: number) => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (gameState && gameState.players && gameState.players.length > 0) {
            const worldOffset = gameState.worldOffset || 0;
            drawSky(ctx);
            drawGround(ctx);
            drawObstacles(ctx, worldOffset);
            drawPlayers(ctx, worldOffset);
            drawEffects(ctx, worldOffset);
            drawUI(ctx);
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText('ESPERANDO PARTIDA...', canvasWidth / 2, canvasHeight / 2 - 30);
            ctx.font = '18px "Courier New", monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Presiona D para correr', canvasWidth / 2, canvasHeight / 2 + 20);
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText('Presiona W para saltar', canvasWidth / 2, canvasHeight / 2 + 50);
            ctx.fillStyle = '#888888';
            ctx.fillText('Presiona S para deslizar', canvasWidth / 2, canvasHeight / 2 + 80);
            ctx.textAlign = 'left';
        }

        if (onAnimationFrame) {
            onAnimationFrame(timestamp);
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [canvasWidth, canvasHeight, gameState, drawSky, drawGround, drawObstacles, drawPlayers, drawEffects, drawUI, onAnimationFrame]);

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