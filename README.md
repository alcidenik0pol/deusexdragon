# Deus Ex: Neon Merlion

[![Deus Ex: Neon Merlion — demo video (with sound)](https://res.cloudinary.com/xpweckjx/video/upload/so_2,f_jpg,w_1280/internal/projects/cyberpunk-rpg/deus-ex-dragon.jpg)](https://res.cloudinary.com/xpweckjx/video/upload/internal/projects/cyberpunk-rpg/deus-ex-dragon.webm)

> **An AI-native 3D cyberpunk RPG where your conversations drive the story.** Talk your way through quests — an LLM evaluates every dialogue exchange to unlock doors, reposition NPCs, and trigger level transitions in real-time.

---

## What Makes This Different

- **Dual LLM System** — One LLM generates NPC dialogue in real-time; a second evaluates your conversations against quest conditions and triggers in-world events when objectives are met
- **100% AI-Generated Assets** — The entire asset pipeline is AI: meshes, music, voice acting, dialogue
- **No Scripted Dialogue Trees** — NPCs respond dynamically; quest progression emerges from natural conversation
- **3 Explorable Levels** — Singapore streets, nightclubs, corporate towers, each with unique atmosphere and objectives

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   ENTRY POINT                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  index.ts                                                                       │
│  ├── Initialize BABYLON global                                                  │
│  ├── Load ChatUI                                                                │
│  └── Call main.ts                                                               │
│                                                                                 │
│  main.ts                                                                        │
│  ├── Create Engine & Scene                                                      │
│  ├── Load Character Models (7 animation states)                                 │
│  ├── Initialize Controls, Camera, DebugUI                                       │
│  ├── Start MusicManager & LevelProgression                                      │
│  └── Run Render Loop                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
┌───────────────────────────┐ ┌─────────────────┐ ┌────────────────────────────┐
│      LEVEL SYSTEM         │ │   NPC SYSTEM    │ │      QUEST SYSTEM          │
├───────────────────────────┤ ├─────────────────┤ ├────────────────────────────┤
│ levels/                   │ │ characters/     │ │ quest/                     │
│ ├── levelGenerator.js     │ │ ├── data/       │ │ ├── DialogueManager.js     │
│ │   (Base class)          │ │ │   └── personas│ │ │   └── Handle E key       │
│ │                         │ │ │               │ │ │   └── Find nearby NPC    │
│ ├── singapore6/           │ │ └── gameplay/   │ │ │                          │
│ │   ├── Singapore6Level.js│ │     └── NPC FSM │ │ ├── chatService.js         │
│ │   ├── buildings.js      │ │                 │ │ │   └── OpenRouter API     │
│ │   ├── lighting.js       │ │  4 Movement     │ │ │   └── Stream responses   │
│ │   ├── npc.js            │ │  Patterns:      │ │ │   └── Conversation hist  │
│ │   ├── quest.js          │ │  • Circle       │ │ │                          │
│ │   ├── furniture.js      │ │  • Figure-8     │ │ ├── ResolutionManager.js   │
│ │   └── objectMapping.js  │ │  • Oval         │ │ │   └── Evaluate dialogue  │
│ │                         │ │  • Infinity     │ │ │   └── Check conditions   │
│ ├── nightclub/            │ │                 │ │ │   └── Trigger scripts    │
│ ├── taiyong/              │ │  States:        │ │ │   └── Unlock exits       │
│ ├── grid/                 │ │  IDLE → WALKING │ │ │                          │
│ └── credits/              │ │  → LOCKED       │ │ ├── levelProgression.js    │
│                           │ │                 │ │ └── MusicManager.js        │
└───────────────────────────┘ └─────────────────┘ └────────────────────────────┘
          │                                                    │
          │                                                    │
          ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LLM INTEGRATION                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────┐              ┌─────────────────────────────────┐   │
│  │     DIALOGUE LLM        │              │      RESOLUTION LLM             │   │
│  ├─────────────────────────┤              ├─────────────────────────────────┤   │
│  │ chatService.js          │              │ ResolutionManager.js            │   │
│  │                         │              │                                 │   │
│  │ • Real-time NPC talk    │              │ • Evaluates after each exchange │   │
│  │ • SSE streaming         │              │ • Checks quest conditions       │   │
│  │ • Per-model config      │   1 second   │ • Triggers game events:         │   │
│  │   - temp: 0.5-0.8       │ ──────────►  │   - Door unlocks                │   │
│  │   - tokens: 800-1200    │    delay     │   - NPC repositioning           │   │
│  │   - history: 4-8        │              │   - Level transitions           │   │
│  │                         │              │   - Exit availability           │   │
│  └───────────┬─────────────┘              └─────────────────────────────────┘   │
│              │                                                                  │
│              ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        config/llm.js                                     │   │
│  │  • Model-specific parameters (temperature, max_tokens, history_length)  │   │
│  │  • Prompt templates for dialogue & resolution                            │   │
│  │  • supportsSystemMessages() check for model compatibility               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│              │                                                                  │
│              ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         OpenRouter API                                   │   │
│  │  Gemma 3 27B │ Qwen 3 14B │ GPT OSS 20B │ DeepSeek v3 │ DeepSeek R1     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RENDERING SYSTEMS                                  │
├──────────────────────────────────┬──────────────────────────────────────────────┤
│         COMPONENTS               │              EFFECTS                         │
├──────────────────────────────────┤──────────────────────────────────────────────┤
│ components/                      │ fx/                                          │
│ ├── BaseComponent.js             │ ├── EffectManager.js                         │
│ ├── BuildingComponent.js         │ ├── FogEffect.js (+ 2 variants)              │
│ ├── WallComponent.js             │ ├── RainEffect.js (+ 3 variants)             │
│ ├── DoorComponent.js             │ ├── VolumetricLightEffect.js                 │
│ ├── FloorComponent.js            │ ├── NightclubPanelLightEffect.js             │
│ ├── CeilingComponent.js          │ └── lighting/                                │
│ ├── SkyboxComponent.js           │     └── Light Clustering System              │
│ └── MaterialFactory.js           │         • Max 3 lights per mesh              │
│                                  │         • Frustum culling                    │
└──────────────────────────────────┴─────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 UI LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ui/                                                                             │
│ ├── chatUI.js ─────────────► Dialogue interface                                 │
│ ├── controls.js ───────────► WASD + interactions                                │
│ ├── debugUI.js ────────────► FPS, position, API errors                          │
│ └── debugControls.js ──────► Level selection, settings                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Player presses E near NPC                                                     │
│            │                                                                    │
│            ▼                                                                    │
│   DialogueManager.findClosestNPC()                                              │
│            │                                                                    │
│            ▼                                                                    │
│   ChatUI.show() ──────► Player types message                                    │
│            │                                                                    │
│            ▼                                                                    │
│   ChatService.streamChat() ──────► OpenRouter API (Dialogue LLM)                │
│            │                                                                    │
│            ▼                                                                    │
│   SSE streaming response displayed in ChatUI                                    │
│            │                                                                    │
│            ▼                                                                    │
│   ChatService.addToHistory() ──────► 1 second delay                             │
│            │                                                                    │
│            ▼                                                                    │
│   ResolutionManager.evaluateConversation() ──────► OpenRouter API (Resolution)  │
│            │                                                                    │
│            ▼                                                                    │
│   If condition met: dispatch CustomEvent                                        │
│            │                                                                    │
│            ▼                                                                    │
│   Level scripts respond: door.open(), npc.moveTo(), levelProgression.next()     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Levels

| Level | Setting | Atmosphere |
|-------|---------|------------|
| **Singapore6** | Rain-soaked streets | Neon-lit urban exploration |
| **Nightclub** | Underground club | Volumetric lights, music, crowds |
| **Taiyong** | Corporate tower | Sterile corporate dystopia |

Each level is a folder with modular files: `*Level.js`, `buildings.js`, `lighting.js`, `npc.js`, `quest.js`, `furniture.js`, `objectMapping.js`.

---

## AI-Generated Asset Pipeline

Every asset in the game was created with generative AI:

| Asset Type | Tool |
|------------|------|
| **3D Meshes** | Trellis, Meshy AI |
| **Music** | Suno |
| **Voice Acting** | ElevenLabs |
| **NPC Dialogue** | Multi-model LLM (OpenRouter) |

Models exported as GLB/GLTF with JSON metadata schema.

---

## Technical Stack

**Engine & Rendering**
- Babylon.js 7.52.2 (WebGL)
- Babylon.js GUI, Loaders, Materials
- Custom light clustering (max 3 lights per mesh, frustum culling, ray-cast occlusion)
- Ray-casting collision detection (no physics engine)

**Build & Styling**
- TypeScript, JavaScript
- Webpack 5, webpack-dev-server 4
- TailwindCSS 3.4.17, PostCSS 8.5.3, autoprefixer
- ts-loader, css-loader, style-loader
- html-webpack-plugin, copy-webpack-plugin

**LLM Integration**
- OpenRouter API with server-sent events streaming
- Google Gemma 3 27B, Qwen 3 14B, OpenAI GPT OSS 20B
- DeepSeek Chat v3, DeepSeek R1

**Game Systems**
- Finite state machine for NPC behavior (4 movement patterns: circle, figure-8, oval, infinity)
- Grid-based coordinate system (1 unit = 1 meter)
- Third-person camera with 3 profiles and collision detection
- Effect manager: fog, rain (3 variants), volumetric light, panel effects
- Music manager with 30s transition delay, 2s fade

---

## Key Implementation Details

- **Light Clustering** — Distance-sorted priority queue with frustum dot-product filtering and wall occlusion ray-casting, updating every 10 frames for 60fps
- **Camera Collision** — Ray-casting from character to camera position, snapping to hit point with 0.2-unit offset
- **Multi-Model LLM** — Abstracted prompt construction with `supportsSystemMessages()` check; context embedded in user message for unsupported models
- **Animation System** — 7 pre-loaded meshes (idle, forward, backward, left, right, run, dance) with visibility toggling for frame-accurate transitions
- **Water Rendering** — 256px render target with 32 subdivisions (reduced from 512px default)

---

*Built Apr–Aug 2025*
