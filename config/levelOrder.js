// Configuration file defining the order of levels in the game
export const LEVEL_ORDER = [
    'singapore6',
    'taiyong',
    'nightclub',
    'credits' // Special case - not a real level but a credits screen
];

// Special level ID for the main menu
export const MAIN_MENU_ID = 'main_menu';

// Helper function to get the next level in the sequence
export function getNextLevel(currentLevelId) {
    // If we're at the main menu, return the first level
    if (currentLevelId === MAIN_MENU_ID) {
        return LEVEL_ORDER[0];
    }
    
    const currentIndex = LEVEL_ORDER.indexOf(currentLevelId);
    
    // If current level not found or is the last level, return null
    if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
        return null;
    }
    
    return LEVEL_ORDER[currentIndex + 1];
} 