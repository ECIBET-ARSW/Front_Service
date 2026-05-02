import { useState, useEffect, useCallback, useRef } from 'react';

export type ControlAction = 'run' | 'stop' | 'jump' | 'slide' | 'none';

interface UseKeyboardControlsProps {
    onAction: (action: ControlAction) => void;
    enabled?: boolean;
    throttleMs?: number;
}

export const useKeyboardControls = ({
                                        onAction,
                                        enabled = true,
                                        throttleMs = 50
                                    }: UseKeyboardControlsProps) => {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const lastActionTimeRef = useRef<Record<string, number>>({});
    const isRunningRef = useRef<boolean>(false);
    const jumpCooldownRef = useRef<boolean>(false);
    const slideCooldownRef = useRef<boolean>(false);

    const keyToAction: Record<string, ControlAction> = {
        'KeyD': 'run',
        'KeyA': 'stop',
        'ArrowRight': 'run',
        'ArrowLeft': 'stop',
        'KeyW': 'jump',
        'KeyS': 'slide',
        'ArrowUp': 'jump',
        'ArrowDown': 'slide',
        'Space': 'jump'
    };

    const throttledAction = useCallback((action: ControlAction) => {
        if (!enabled || action === 'none') return;

        const now = Date.now();
        const lastTime = lastActionTimeRef.current[action] || 0;

        if (now - lastTime >= throttleMs) {
            lastActionTimeRef.current[action] = now;
            onAction(action);
            console.log('Throttled action dispatched:', action);
        }
    }, [enabled, throttleMs, onAction]);

    const startRunning = useCallback(() => {
        if (!enabled) return;
        if (!isRunningRef.current) {
            isRunningRef.current = true;
            throttledAction('run');
            console.log('RUN started');
        }
    }, [enabled, throttledAction]);

    const stopRunning = useCallback(() => {
        if (!enabled) return;
        if (isRunningRef.current) {
            isRunningRef.current = false;
            throttledAction('stop');
            console.log('RUN stopped');
        }
    }, [enabled, throttledAction]);

    const handleJump = useCallback(() => {
        if (!enabled) return;
        if (!jumpCooldownRef.current) {
            jumpCooldownRef.current = true;
            throttledAction('jump');
            console.log('JUMP dispatched');
            setTimeout(() => {
                jumpCooldownRef.current = false;
            }, 500);
        } else {
            console.log('JUMP on cooldown, ignoring');
        }
    }, [enabled, throttledAction]);

    const handleSlide = useCallback(() => {
        if (!enabled) return;
        if (!slideCooldownRef.current) {
            slideCooldownRef.current = true;
            throttledAction('slide');
            console.log('SLIDE dispatched');
            setTimeout(() => {
                slideCooldownRef.current = false;
            }, 500);
        } else {
            console.log('SLIDE on cooldown, ignoring');
        }
    }, [enabled, throttledAction]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
            event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
            event.code === 'Space' || event.code === 'KeyW' ||
            event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD') {
            event.preventDefault();
        }

        const action = keyToAction[event.code];

        if (action) {
            console.log('KeyDown event:', event.code, 'Action:', action);
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.add(event.code);
                return newSet;
            });

            if (action === 'jump') {
                handleJump();
            } else if (action === 'slide') {
                handleSlide();
            } else if (action === 'run') {
                startRunning();
            } else if (action === 'stop') {
                stopRunning();
            }
        }
    }, [enabled, handleJump, handleSlide, startRunning, stopRunning]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const action = keyToAction[event.code];

        console.log('KeyUp event:', event.code, 'Action:', action);

        if (action === 'run') {
            stopRunning();
        }

        setPressedKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(event.code);
            return newSet;
        });
    }, [enabled, stopRunning]);

    useEffect(() => {
        console.log('useKeyboardControls mounted, enabled:', enabled);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            console.log('useKeyboardControls unmounted');
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return {
        pressedKeys,
        isRunning: isRunningRef.current,
        isJumping: pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp') || pressedKeys.has('Space'),
        isSliding: pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')
    };
};