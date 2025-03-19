// Characters: e.g., 1.8 units tall
// Buildings: e.g., 15 units tall depending on type
// Furniture: e.g., 1 units tall

// config.js or similar
export const WORLD_CONFIG = {
    UNIT_SCALE: 1,         // 1 BabylonJS unit = 1 meter
    GRID_CELL_SIZE: 1,     // Each grid cell is 1×1×1 meters
    PHYSICS_SCALE: 1,      // Physics scale matches world scale
    DEFAULT_WORLD_SIZE: 100, // Default world is 100x100 meters
    
    // Light clustering configuration
    LIGHTING: {
        CLUSTER_SIZE: 8,           // Size of each cluster in grid cells (8x8x8)
        MAX_LIGHTS_PER_CLUSTER: 3, // Maximum lights per cluster (N=3)
        MAX_LIGHTS_PER_MESH: 3,    // Maximum lights that can affect a single mesh
        VERTICAL_CLUSTERS: 4,      // Number of vertical divisions
        LIGHT_FADE_START: 0.8,     // Distance at which lights start fading
        LIGHT_FADE_END: 1.0,       // Distance at which lights are fully faded
        DEFAULT_LIGHT_RANGE: 15,   // Default range for lights in meters
        PARTICLE_VISIBILITY_RANGE: 10.5 // Range at which particles become visible (70% of light range)
    }
};