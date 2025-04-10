export default {
    id: "purple",
    name: "Kristie Dong",
    animations: {
        idle: "./assets/characters/purple02f/idle.glb",
        walking: "./assets/characters/purple02f/walking.glb",
        fighting: "./assets/characters/purple02f/fighting.glb",
        dancing01: "./assets/characters/purple02f/dancing01.glb",
        dancing02: "./assets/characters/purple02f/dancing02.glb"
    },
    defaultAnimation: "idle",
    scene: "ladiesroom",
    scale: 1.6,
    rotation: Math.PI/2,
    interactionRadius: 3.0,
    persona: `You are Kristie Dong, a former Triad assassin...`,  // existing persona
    initialMemories: [
        // ... existing memories ...
    ]
}; 