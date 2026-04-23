import { useState, useEffect, useCallback } from 'react';

export type ControlAction = 'moveLeft' | 'moveRight' | 'jump' | 'slide' | 'none';

interface UseKeyboardControlsProps {
    onAction: (action: ControlAction) => void;
    enabled?: boolean;
}

export const useKeyboardControls = ({ onAction, enabled = true }: UseKeyboardControlsProps) => {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    const keyToAction: Record<string, ControlAction> = {
        'KeyA': 'moveLeft',
        'KeyD': 'moveRight',
        'KeyW': 'jump',
        'KeyS': 'slide',
        'ArrowLeft': 'moveLeft',
        'ArrowRight': 'moveRight',
        'ArrowUp': 'jump',
        'ArrowDown': 'slide',
        'Space': 'jump'
    };

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
            event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
            event.code === 'Space') {
            event.preventDefault();
        }

        const action = keyToAction[event.code];
        if (action && action !== 'none') {
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.add(event.code);
                return newSet;
            });
            onAction(action);
        }
    }, [enabled, onAction]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        setPressedKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(event.code);
            return newSet;
        });
    }, [enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return {
        pressedKeys,
        isMovingLeft: pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'),
        isMovingRight: pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight'),
        isJumping: pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp') || pressedKeys.has('Space'),
        isSliding: pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')
    };
};