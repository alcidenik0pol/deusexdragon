// Characters: e.g., 1.8 units tall
// Buildings: e.g., 15 units tall depending on type
// Furniture: e.g., 1 units tall

// config.js or similar
export const WORLD_CONFIG = {
    UNIT_SCALE: 1,         // 1 BabylonJS unit = 1 meter
    GRID_CELL_SIZE: 1,     // Each grid cell is 1×1×1 meters
    PHYSICS_SCALE: 1,      // Physics scale matches world scale
    DEFAULT_WORLD_SIZE: 100 // Default world is 100x100 meters
};