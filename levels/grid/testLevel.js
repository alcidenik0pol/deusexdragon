import { GridConfig } from './GridConfig.js';

export const testLevel = {
    name: "Test Grid Level",
    // Visual representation of the map
    // Each character represents one tile
    map: [
        "....................".split(''),
        "....AAA.....BBB....".split(''),
        "....AAA.....BBB....".split(''),
        "....AAA.....BBB....".split(''),
        "....................".split(''),
        "......S##########S..".split(''),
        "....................".split(''),
        "....CCC.....BBB....".split(''),
        "....CCC.....BBB....".split(''),
        "....CCC.....BBB....".split(''),
        "..........P........".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split(''),
        "....................".split('')
    ],

    // Define what each tile type means
    legend: {
        'A': {
            type: "BUILDING",
            variant: "CORPORATE_HQ",
            rotation: 0
        },
        'B': {
            type: "BUILDING",
            variant: "RESIDENTIAL_TOWER",
            rotation: 180
        },
        'C': {
            type: "BUILDING",
            variant: "TECH_HUB",
            rotation: 0
        },
        'S': {
            type: "VEHICLE_SPAWN",
            variant: "FLYING_CAR",
            direction: 90
        },
        'P': {
            type: "PLAYER_SPAWN",
            rotation: 0
        },
        '#': {
            type: "VEHICLE_PATH",
            height: GridConfig.HEIGHTS.VEHICLE_PATH
        }
    }
}; 