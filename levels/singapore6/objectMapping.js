export const SINGAPORE6_OBJECT_MAPPING = {
    // Define default spawn position as a constant
    DEFAULT_SPAWN: { x: 0, z: -20 },
    
    // Building positions
    BUILDINGS: {
        // Left column (x = -70)
        Fulton: { x: -70, z: 70 },      // 1
        Parkview: { x: -70, z: 50 },    // 4
        UOBHigh: { x: -70, z: 30 },     // 8
        Republic: { x: -70, z: 10 },    // 6
        OUC: { x: -70, z: -10 },        // 5
        Capitas: { x: -70, z: -30 },    // 3
        Shops: { x: -70, z: -70 },      // 7
        
        // Right side (x = 50)
        MBS: { x: 50, z: 50 },          // 2
        
        // Northwest corner position for Merlion (between top lamp post and water)
        Merlion: { x: -40, z: 70 }      // Northwest corner position
    },
    
    // Streetlight positions
    STREETLIGHTS: [
        // First column of streetlights (x = -60)
        { x: -60, z: 70 },
        { x: -60, z: 50 },
        { x: -60, z: 30 },
        { x: -60, z: 10 },
        { x: -60, z: -10 },
        { x: -60, z: -30 },
        
        // Second column of streetlights (x = -50)
        { x: -50, z: 70 },
        { x: -50, z: 50 },
        { x: -50, z: 30 },
        { x: -50, z: 10 },
        { x: -50, z: -10 },
        { x: -50, z: -30 },
    ],
    
    // Water position
    WATER: { x: 0, z: 30, x_length: 40, z_length: 100 },
    
    // Container ship positions
    CONTAINER_SHIPS: {
        // North border ships (facing east) - placed further north with varied positions
        NORTH: [
            { x: -65, z: 140 },
            { x: -25, z: 150 },
            { x: 15, z: 145 },
            { x: 55, z: 155 },
            { x: -5, z: 160 }
        ],
        // East border ships (facing south) - placed further east with varied positions
        EAST: [
            { x: 140, z: 65 },
            { x: 150, z: 25 },
            { x: 145, z: -15 },
            { x: 155, z: -55 },
            { x: 160, z: 5 }
        ]
    },
    
    // Border segments
    CITY_BORDERS: [
        // Left/West vertical border (x: -80, z: 80 to -80)
        { start: { x: -80, z: 80 }, end: { x: -80, z: -80 } },
        
        // Bottom/South horizontal border (x: -80 to 80, z: -80)
        { start: { x: -80, z: -80 }, end: { x: 80, z: -80 } },
        
        // Bottom extension (x: -80 to 0, z: -90)
        { start: { x: -80, z: -90 }, end: { x: 0, z: -90 } }
    ],
    
    // Sea border segments
    SEA_BORDERS: [
        // Top/North horizontal border (x: -80 to 80, z: 80)
        { 
            start: { x: -80, z: 80 }, 
            end: { x: 80, z: 80 },
            type: 'north'
        },
        
        // Right/East vertical border (x: 80, z: 80 to -80)
        { 
            start: { x: 80, z: 80 }, 
            end: { x: 80, z: -80 },
            type: 'east'
        },
        
        // Northeast corner piece
        { 
            start: { x: 80, z: 80 }, 
            end: { x: 80, z: 80 }, // Same point for corner piece
            type: 'northeast'
        }
    ]
}; 