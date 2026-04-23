export const SPRITES_CONFIG = {
    runners: {
        red: {
            idle: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 },
            running: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            jumping: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            sliding: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            dying: { frames: 2, frameWidth: 32, frameHeight: 32, sheetWidth: 64, sheetHeight: 32 }
        },
        blue: {
            idle: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 },
            running: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            jumping: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            sliding: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            dying: { frames: 2, frameWidth: 32, frameHeight: 32, sheetWidth: 64, sheetHeight: 32 }
        },
        green: {
            idle: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 },
            running: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            jumping: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            sliding: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            dying: { frames: 2, frameWidth: 32, frameHeight: 32, sheetWidth: 64, sheetHeight: 32 }
        },
        yellow: {
            idle: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 },
            running: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            jumping: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            sliding: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            dying: { frames: 2, frameWidth: 32, frameHeight: 32, sheetWidth: 64, sheetHeight: 32 }
        },
        purple: {
            idle: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 },
            running: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            jumping: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            sliding: { frames: 3, frameWidth: 32, frameHeight: 32, sheetWidth: 96, sheetHeight: 32 },
            dying: { frames: 2, frameWidth: 32, frameHeight: 32, sheetWidth: 64, sheetHeight: 32 }
        }
    },
    obstacles: {
        rock: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32, animated: true },
        lava: { frames: 6, frameWidth: 32, frameHeight: 16, sheetWidth: 192, sheetHeight: 16, animated: true },
        blade: { frames: 8, frameWidth: 32, frameHeight: 32, sheetWidth: 256, sheetHeight: 32, animated: true },
        sink_block: { frames: 5, frameWidth: 32, frameHeight: 32, sheetWidth: 160, sheetHeight: 32, animated: true },
        powerup_speed: { frames: 4, frameWidth: 24, frameHeight: 24, sheetWidth: 96, sheetHeight: 24, animated: true },
        wall: { frames: 1, frameWidth: 32, frameHeight: 64, sheetWidth: 32, sheetHeight: 64, animated: false },
        spike: { frames: 1, frameWidth: 32, frameHeight: 32, sheetWidth: 32, sheetHeight: 32, animated: false },
        pit: { frames: 1, frameWidth: 64, frameHeight: 32, sheetWidth: 64, sheetHeight: 32, animated: false },
        platform: { frames: 1, frameWidth: 48, frameHeight: 16, sheetWidth: 48, sheetHeight: 16, animated: false },
        trampoline: { frames: 1, frameWidth: 32, frameHeight: 16, sheetWidth: 32, sheetHeight: 16, animated: false }
    },
    ui: {
        dust: { frames: 4, frameWidth: 8, frameHeight: 8, sheetWidth: 32, sheetHeight: 8 },
        jump_effect: { frames: 2, frameWidth: 16, frameHeight: 16, sheetWidth: 32, sheetHeight: 16 },
        explosion: { frames: 6, frameWidth: 32, frameHeight: 32, sheetWidth: 192, sheetHeight: 32 },
        star: { frames: 8, frameWidth: 24, frameHeight: 24, sheetWidth: 192, sheetHeight: 24 }
    },
    lobby: {
        coin: { frames: 4, frameWidth: 32, frameHeight: 32, sheetWidth: 128, sheetHeight: 32 }
    }
};


export const GROUND_ASSETS = {
    normal: 'ground_normal.png',
    cracked: 'ground_cracked.png',
    wet: 'ground_wet.png',
    slippery: 'ground_slippery.png'
} as const;

export type GroundType = keyof typeof GROUND_ASSETS;


export const OBSTACLE_ASSETS = {
    wall: 'wall.png',
    spike: 'spike.png',
    pit: 'pit.png',
    platform: 'platform.png',
    rock: 'rock.png',
    lava: 'lava.png',
    blade: 'blade.png',
    sink_block: 'sink_block.png',
    trampoline: 'trampoline.png',
    powerup_speed: 'powerup_speed.png'
} as const;

export type ObstacleType = keyof typeof OBSTACLE_ASSETS;


export const PLAYER_HITBOX = {
    width: 16,
    height: 24,
    offsetX: 8,
    offsetY: 8
};


export const RUNNER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'] as const;
export type RunnerColor = typeof RUNNER_COLORS[number];

export const RUNNER_ANIMATIONS = ['idle', 'running', 'jumping', 'sliding', 'dying'] as const;
export type RunnerAnimation = typeof RUNNER_ANIMATIONS[number];