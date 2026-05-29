# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deus Ex: Neon Merlion is a 3D cyberpunk exploration game built with Babylon.js featuring LLM-powered NPC dialogue and quest systems.

## Commands

```bash
npm run dev      # Start dev server on localhost:9000 with hot reload
npm run build    # Production build to dist/
npm run watch    # Watch mode for continuous rebuilding
```

## Setup

1. Copy `config/env.example.js` to `config/env.js`
2. Add your OpenRouter API key to `config/env.js`
3. Run `npm run dev`

## Controls

- **WASD** - Movement
- **SHIFT+W** - Sprint
- **E** - Interact with NPCs
- **K** - Dance
- **J** - Toggle Quest Journal
- **O** - Toggle Settings Menu
- **P** - Move to Next Level
- **1** - Toggle Debug Info (FPS/Position)
- **L** - Level Selection (Debug)
- **ESC** - Close Active Window

## Architecture

### Entry Flow
- `index.ts` → initializes BABYLON global, loads ChatUI, calls `main.ts`
- `main.ts` → creates engine, scene, loads characters, starts render loop

### Level System
- `levels/levelGenerator.js` - Base class all levels extend
- Each level (e.g., `singapore6/`) is a folder containing:
  - `*Level.js` - Main level class extending LevelGenerator (creates ground, NPCs, effects)
  - `buildings.js` - Building definitions (positions, dimensions, materials)
  - `npc.js` - NPC manager for the level
  - `quest.js` - Quest definitions and conditions
  - `lighting.js` - Light placements and configurations
  - `furniture.js` - Interior/exterior decorations
  - `*Effects.js` - Level-specific visual effects (fog, rain, particles)

### NPC & Dialogue System
- `characters/data/` - NPC personas and dialogue data
- `characters/gameplay/` - NPC behavior and interaction logic
- `quest/chatService.js` - LLM API calls via OpenRouter
- `quest/DialogueManager.js` - Manages NPC conversations
- `quest/ResolutionManager.js` - Evaluates quest completion via LLM

### LLM Configuration
- `config/models.js` - Available LLM models
- `config/llm.js` - Model-specific parameters (temperature, max_tokens, history_length) and prompt templates
- Models without system message support use embedded context in user messages
- Game optimized for Google Gemma; other models available but less tested

### Component System
- `components/` - Reusable building blocks (BaseComponent, BuildingComponent, WallComponent, DoorComponent, FloorComponent)
- `components/MaterialFactory.js` - Material creation utility

### Visual Effects
- `fx/EffectManager.js` - Effect orchestration
- Multiple effect variants (FogEffect, RainEffect, etc.) for different scenarios
- `fx/lighting/` - Light clustering optimization system

### UI Layer
- `ui/chatUI.js` - Dialogue interface
- `ui/controls.js` - Input handling (WASD, interactions)
- `ui/debugUI.js`, `ui/debugControls.js` - Debug tools

## World Configuration

Grid-based coordinate system defined in `config/config.js`:
- 1 Babylon.js unit = 1 meter
- Each grid cell is 1×1×1 meters
- Light clustering: 8x8x8 cell clusters, max 3 lights per cluster/mesh

## Key Globals

- `window.currentLevel` - Active level instance
- `window.levelProgression` - Level progression manager
- `window.resolutionManager` - Quest resolution evaluator
- `window.recreateScene(levelType)` - Recreate scene with new level
