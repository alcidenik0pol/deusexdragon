// spawnPositions.js
export const LEVEL_SPAWN_POSITIONS = {
    'singapore6': { x: -60, z: 60 },
    'default': { x: 0, z: 0 },
    // Add other levels as needed
    'grid': { x: 10, z: 10 },
    'singapore4': { x: -20, z: 30 },
    'taiyong': { x: -37, z: -37 },
    'nightclub': { x: 0, z: -48 }  // Position player near southwest corner
};

// Helper function to get spawn position for a level
export function getSpawnPosition(levelType) {
    return LEVEL_SPAWN_POSITIONS[levelType] || LEVEL_SPAWN_POSITIONS['default'];
}