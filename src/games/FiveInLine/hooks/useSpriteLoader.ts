import { useState, useEffect, useRef, useCallback } from 'react';
import {
    SPRITES_CONFIG,
    GROUND_ASSETS,
    OBSTACLE_ASSETS,
    GroundType,
    ObstacleType,
    RunnerColor,
    RunnerAnimation
} from '../config/sprites.config';

interface SpriteLoaderReturn {
    isLoading: boolean;
    error: Error | null;
    progress: number;
    drawFrame: (
        spriteKey: string,
        frameIndex: number,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        scale?: number,
        flipX?: boolean
    ) => void;
    drawGroundTile: (
        groundType: GroundType,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width?: number,
        height?: number
    ) => void;
    drawObstacle: (
        obstacleType: ObstacleType,
        frameIndex: number,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        scale?: number
    ) => void;
    getAnimationConfig: (color: RunnerColor, animation: RunnerAnimation) => {
        frames: number;
        frameWidth: number;
        frameHeight: number;
    };
    getSprite: (key: string) => HTMLImageElement | undefined;
    getImage: (path: string) => HTMLImageElement | undefined;
}

const ASSETS_BASE_PATH = '/src/games/FiveInLine/assets/pixelart_5inline';

const assetPaths: Record<string, string> = {
    red_idle: `${ASSETS_BASE_PATH}/runners/red/red_idle.png`,
    red_running: `${ASSETS_BASE_PATH}/runners/red/red_running.png`,
    red_jumping: `${ASSETS_BASE_PATH}/runners/red/red_jumping.png`,
    red_sliding: `${ASSETS_BASE_PATH}/runners/red/red_sliding.png`,
    red_dying: `${ASSETS_BASE_PATH}/runners/red/red_dying.png`,
    blue_idle: `${ASSETS_BASE_PATH}/runners/blue/blue_idle.png`,
    blue_running: `${ASSETS_BASE_PATH}/runners/blue/blue_running.png`,
    blue_jumping: `${ASSETS_BASE_PATH}/runners/blue/blue_jumping.png`,
    blue_sliding: `${ASSETS_BASE_PATH}/runners/blue/blue_sliding.png`,
    blue_dying: `${ASSETS_BASE_PATH}/runners/blue/blue_dying.png`,
    green_idle: `${ASSETS_BASE_PATH}/runners/green/green_idle.png`,
    green_running: `${ASSETS_BASE_PATH}/runners/green/green_running.png`,
    green_jumping: `${ASSETS_BASE_PATH}/runners/green/green_jumping.png`,
    green_sliding: `${ASSETS_BASE_PATH}/runners/green/green_sliding.png`,
    green_dying: `${ASSETS_BASE_PATH}/runners/green/green_dying.png`,
    yellow_idle: `${ASSETS_BASE_PATH}/runners/yellow/yellow_idle.png`,
    yellow_running: `${ASSETS_BASE_PATH}/runners/yellow/yellow_running.png`,
    yellow_jumping: `${ASSETS_BASE_PATH}/runners/yellow/yellow_jumping.png`,
    yellow_sliding: `${ASSETS_BASE_PATH}/runners/yellow/yellow_sliding.png`,
    yellow_dying: `${ASSETS_BASE_PATH}/runners/yellow/yellow_dying.png`,
    purple_idle: `${ASSETS_BASE_PATH}/runners/purple/purple_idle.png`,
    purple_running: `${ASSETS_BASE_PATH}/runners/purple/purple_running.png`,
    purple_jumping: `${ASSETS_BASE_PATH}/runners/purple/purple_jumping.png`,
    purple_sliding: `${ASSETS_BASE_PATH}/runners/purple/purple_sliding.png`,
    purple_dying: `${ASSETS_BASE_PATH}/runners/purple/purple_dying.png`,
    obstacle_wall: `${ASSETS_BASE_PATH}/obstacles/wall.png`,
    obstacle_spike: `${ASSETS_BASE_PATH}/obstacles/spike.png`,
    obstacle_pit: `${ASSETS_BASE_PATH}/obstacles/pit.png`,
    obstacle_platform: `${ASSETS_BASE_PATH}/obstacles/platform.png`,
    obstacle_rock: `${ASSETS_BASE_PATH}/obstacles/rock.png`,
    obstacle_lava: `${ASSETS_BASE_PATH}/obstacles/lava.png`,
    obstacle_blade: `${ASSETS_BASE_PATH}/obstacles/blade.png`,
    obstacle_sink_block: `${ASSETS_BASE_PATH}/obstacles/sink_block.png`,
    obstacle_trampoline: `${ASSETS_BASE_PATH}/obstacles/trampoline.png`,
    obstacle_powerup_speed: `${ASSETS_BASE_PATH}/obstacles/powerup_speed.png`,
    sky: `${ASSETS_BASE_PATH}/background/sky.png`,
    ground_normal: `${ASSETS_BASE_PATH}/background/ground/ground_normal.png`,
    ground_cracked: `${ASSETS_BASE_PATH}/background/ground/ground_cracked.png`,
    ground_wet: `${ASSETS_BASE_PATH}/background/ground/ground_wet.png`,
    ground_slippery: `${ASSETS_BASE_PATH}/background/ground/ground_slippery.png`,
    ui_avatar_frame: `${ASSETS_BASE_PATH}/ui/avatar_frame.png`,
    ui_heart_full: `${ASSETS_BASE_PATH}/ui/heart_full.png`,
    ui_heart_empty: `${ASSETS_BASE_PATH}/ui/heart_empty.png`,
    ui_distance_icon: `${ASSETS_BASE_PATH}/ui/distance_icon.png`,
    ui_progress_bar_bg: `${ASSETS_BASE_PATH}/ui/progress_bar_bg.png`,
    ui_progress_bar_fill: `${ASSETS_BASE_PATH}/ui/progress_bar_fill.png`,
    ui_countdown_3: `${ASSETS_BASE_PATH}/ui/countdown_3.png`,
    ui_countdown_2: `${ASSETS_BASE_PATH}/ui/countdown_2.png`,
    ui_countdown_1: `${ASSETS_BASE_PATH}/ui/countdown_1.png`,
    ui_countdown_go: `${ASSETS_BASE_PATH}/ui/countdown_go.png`,
    ui_dust: `${ASSETS_BASE_PATH}/ui/dust.png`,
    ui_jump_effect: `${ASSETS_BASE_PATH}/ui/jump_effect.png`,
    ui_explosion: `${ASSETS_BASE_PATH}/ui/explosion.png`,
    ui_star: `${ASSETS_BASE_PATH}/ui/star.png`,
    lobby_logo: `${ASSETS_BASE_PATH}/lobby/logo_5inline.png`,
    lobby_btn_create_normal: `${ASSETS_BASE_PATH}/lobby/btn_create_normal.png`,
    lobby_btn_create_hover: `${ASSETS_BASE_PATH}/lobby/btn_create_hover.png`,
    lobby_btn_create_pressed: `${ASSETS_BASE_PATH}/lobby/btn_create_pressed.png`,
    lobby_btn_join_normal: `${ASSETS_BASE_PATH}/lobby/btn_join_normal.png`,
    lobby_btn_join_hover: `${ASSETS_BASE_PATH}/lobby/btn_join_hover.png`,
    lobby_btn_join_pressed: `${ASSETS_BASE_PATH}/lobby/btn_join_pressed.png`,
    lobby_code_icon: `${ASSETS_BASE_PATH}/lobby/code_icon.png`,
    lobby_avatar_select_red: `${ASSETS_BASE_PATH}/lobby/avatar_select_red.png`,
    lobby_avatar_select_blue: `${ASSETS_BASE_PATH}/lobby/avatar_select_blue.png`,
    lobby_avatar_select_green: `${ASSETS_BASE_PATH}/lobby/avatar_select_green.png`,
    lobby_avatar_select_yellow: `${ASSETS_BASE_PATH}/lobby/avatar_select_yellow.png`,
    lobby_avatar_select_purple: `${ASSETS_BASE_PATH}/lobby/avatar_select_purple.png`,
    lobby_lobby_background: `${ASSETS_BASE_PATH}/lobby/lobby_background.png`,
    lobby_podium_1st: `${ASSETS_BASE_PATH}/lobby/podium_1st.png`,
    lobby_podium_2nd: `${ASSETS_BASE_PATH}/lobby/podium_2nd.png`,
    lobby_podium_3rd: `${ASSETS_BASE_PATH}/lobby/podium_3rd.png`,
    lobby_coin: `${ASSETS_BASE_PATH}/lobby/coin.png`,
};

export const useSpriteLoader = (): SpriteLoaderReturn => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [progress, setProgress] = useState(0);
    const spriteCache = useRef<Map<string, HTMLImageElement>>(new Map());

    const loadImage = (key: string, src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                spriteCache.current.set(key, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    };

    useEffect(() => {
        const loadAllSprites = async () => {
            try {
                const entries = Object.entries(assetPaths);
                let loaded = 0;

                const loadPromises = entries.map(async ([key, path]) => {
                    await loadImage(key, path);
                    loaded++;
                    setProgress((loaded / entries.length) * 100);
                });

                await Promise.all(loadPromises);
                setIsLoading(false);
                console.log('All sprites loaded successfully');
            } catch (err) {
                console.error('Error loading sprites:', err);
                setError(err as Error);
                setIsLoading(false);
            }
        };

        loadAllSprites();
    }, []);

    const getSprite = useCallback((key: string): HTMLImageElement | undefined => {
        return spriteCache.current.get(key);
    }, []);

    const getImage = useCallback((path: string): HTMLImageElement | undefined => {
        for (const [key, img] of spriteCache.current.entries()) {
            if (assetPaths[key] === path || key === path) {
                return img;
            }
        }
        return undefined;
    }, []);

    const getFrameConfig = (spriteKey: string): { frames: number; frameWidth: number; frameHeight: number } | null => {
        if (spriteKey.match(/^(red|blue|green|yellow|purple)_(idle|running|jumping|sliding|dying)$/)) {
            const [color, animation] = spriteKey.split('_');
            const config = SPRITES_CONFIG.runners[color as RunnerColor]?.[animation as RunnerAnimation];
            if (config) return config;
        }

        if (spriteKey.startsWith('ui_')) {
            const uiType = spriteKey.replace('ui_', '');
            const config = SPRITES_CONFIG.ui[uiType as keyof typeof SPRITES_CONFIG.ui];
            if (config) return config;
        }

        if (spriteKey === 'lobby_coin') {
            return SPRITES_CONFIG.lobby.coin;
        }

        return null;
    };

    const drawFrame = useCallback((
        spriteKey: string,
        frameIndex: number,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        scale: number = 1,
        flipX: boolean = false
    ) => {
        const img = spriteCache.current.get(spriteKey);
        if (!img) {
            console.warn(`Sprite not found: ${spriteKey}`);
            return;
        }

        const config = getFrameConfig(spriteKey);
        if (!config) {
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            return;
        }

        const { frameWidth, frameHeight } = config;
        const validFrameIndex = frameIndex % config.frames;
        const sx = validFrameIndex * frameWidth;
        const sy = 0;
        const sw = frameWidth;
        const sh = frameHeight;
        const dw = frameWidth * scale;
        const dh = frameHeight * scale;

        if (flipX) {
            ctx.save();
            ctx.translate(x + dw, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            ctx.restore();
        } else {
            ctx.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
        }
    }, []);

    const drawGroundTile = useCallback((
        groundType: GroundType,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number = 32,
        height: number = 32
    ) => {
        const img = spriteCache.current.get(`ground_${groundType}`);
        if (!img) return;
        ctx.drawImage(img, x, y, width, height);
    }, []);

    const drawObstacle = useCallback((
        obstacleType: ObstacleType,
        frameIndex: number,
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        scale: number = 1
    ) => {
        const img = spriteCache.current.get(`obstacle_${obstacleType}`);
        if (!img) return;

        const config = SPRITES_CONFIG.obstacles[obstacleType];
        if (!config) return;

        const { frameWidth, frameHeight, frames } = config;
        const validFrameIndex = frameIndex % frames;
        const sx = validFrameIndex * frameWidth;
        const sy = 0;
        const sw = frameWidth;
        const sh = frameHeight;
        const dw = frameWidth * scale;
        const dh = frameHeight * scale;

        ctx.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
    }, []);

    const getAnimationConfig = useCallback((color: RunnerColor, animation: RunnerAnimation) => {
        const config = SPRITES_CONFIG.runners[color]?.[animation];
        if (!config) {
            return { frames: 1, frameWidth: 32, frameHeight: 32 };
        }
        return {
            frames: config.frames,
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight
        };
    }, []);

    return {
        isLoading,
        error,
        progress,
        drawFrame,
        drawGroundTile,
        drawObstacle,
        getAnimationConfig,
        getSprite,
        getImage
    };
};