export const GridConfig = {
    // Grid cell size in world units
    CELL_SIZE: 10,
    
    // Grid dimensions
    GRID_WIDTH: 20,
    GRID_HEIGHT: 20,
    
    // Height levels (in world units)
    HEIGHTS: {
        GROUND: 0,
        BUILDING_BASE: 0,
        VEHICLE_PATH: 1,
        FLYING_HEIGHT: 50
    },
    
    // Tile types for the map representation
    TILES: {
        EMPTY: '.',      // Empty space
        BUILDING_A: 'A', // Corporate HQ
        BUILDING_B: 'B', // Residential Tower
        BUILDING_C: 'C', // Tech Hub
        CAR_SPAWN: 'S',  // Vehicle spawn point
        PLAYER: 'P',     // Player spawn
        PATH: '#'        // Path marker
    }
}; 