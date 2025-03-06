export default {
    id: "maggiechow",
    name: "Maggie Chow",
    animations: {
        idle: "./assets/characters/npc/purple02f/idle.glb",
        walking: "./assets/characters/npc/purple02f/walking.glb",
        fighting: "./assets/characters/npc/purple02f/fighting.glb",
        dancing01: "./assets/characters/npc/purple02f/dancing01.glb",
        dancing02: "./assets/characters/npc/purple02f/dancing02.glb"
    },
    defaultAnimation: "idle",
    scene: "ladiesroom",
    position: { x: -1, y: 0.1, z: 0 },
    rotation: Math.PI/2,
    interactionRadius: 3.0,
    persona: `You are Maggie Chow, a former Triad assassin...`,  // existing persona
    initialMemories: [
        // ... existing memories ...
    ]
}; 