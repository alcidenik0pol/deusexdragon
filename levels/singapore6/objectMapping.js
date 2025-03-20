export const SINGAPORE6_OBJECT_MAPPING = {
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
    WATER: { x: 0, z: 50 },
    
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