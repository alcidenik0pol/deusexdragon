# Singapore6 Level Documentation

## Coordinate System

- The level uses a grid-based coordinate system where each grid cell is 1×1×1 meters (defined by GRID_CELL_SIZE in config.js)
- The origin point (0,0) is at the center of the level, not the bottom left edge
- Positive X extends to the right (east)
- Positive Z extends forward (north)
- Negative X extends to the left (west)
- Negative Z extends backward (south)
- The level bounds are approximately defined by LEVEL_BOUNDS

## Object Placement

- Buildings, furniture, and other objects are positioned using grid coordinates
- When placing objects, use the getWorldPosition() method to convert grid coordinates to world coordinates
- Most objects are defined in objectMapping.js with their grid positions
- Default spawn position for new objects: (0, -20) [center of level, 20 units south]
- The default spawn position is defined as DEFAULT_SPAWN in objectMapping.js

## Level Features

- Borders: City borders and sea borders define the level boundaries
