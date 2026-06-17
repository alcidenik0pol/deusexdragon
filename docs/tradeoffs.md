# Engineering Tradeoffs — Deus Ex: Neon Merlion

A 3D cyberpunk exploration game built on **Babylon.js** with **OpenRouter**-powered LLM dialogue and quest systems. The game world is a neon-lit, grid-based 3D environment where players walk around, talk to NPCs in natural language, and resolve quests through open-ended conversation rather than keyword matching.

## Scope

This document catalogs **tradeoffs the project made because of underlying difficulties** — platform constraints, capability gaps, and integration challenges that forced non-obvious architectural decisions. Each entry explains the difficulty, the architecture that addresses it, the data flow, and what was gained versus sacrificed.

Entries are **ranked hardest-first**. Tier 1 covers fundamental platform/capability constraints that required building custom subsystems; Tier 5 captures lower-stakes smells and dead code.

### Asset Pipeline (proprietary)

All in-game assets are **proprietary** — generated and authored through the following pipeline, and not redistributable:

1. **Stable Diffusion** — 2D concept/sprite generation.
2. **Trellis** — 2D → 3D mesh conversion.
3. **Blender** — format conversion and cleanup into the final GLB/GLTF assets consumed by Babylon.js.
4. **Meshy AI + Mixamo** — character animation (the source of the per-state GLB files referenced in T3.2).

This pipeline is why several tradeoffs downstream (notably T3.2, animation via full GLB reload rather than skeletal blending) are shaped the way they are: animations arrive as separate exported GLBs per state, not as a single rigged skeleton with animation groups.

## Entry Flow (for context)

The game boots through a short, fixed path. `index.ts` runs first, attaching the Babylon.js library onto `window.BABYLON` as a global, loading the ChatUI, and then calling into `main.ts`. `main.ts` creates the engine and scene, instantiates a `LevelGenerator` for the starting level, loads characters, and starts the render loop. From there, all subsequent systems read `window.BABYLON` rather than importing Babylon per file, and they coordinate through `window.*` singletons and `CustomEvent` dispatches.

## Summary Table

| Tier | Tradeoff | Primary files |
|------|----------|---------------|
| 1 | WebGL per-mesh light limit → virtual light registry (`ClusterManager`) | `fx/lighting/ClusterManager.js`, `fx/lighting/DefaultLight.js`, `config/config.js`, `levels/singapore6/lighting.js`, `levels/singapore6/furniture.js` |
| 1 | LLM-as-judge quest resolution | `quest/ResolutionManager.js`, `quest/chatService.js`, `config/llm.js`, `levels/*/quest.js` |
| 2 | No physics engine → per-frame ray-cast collision | `ui/controls.js`, `camera.js`, `components/BaseComponent.js` |
| 2 | Free-tier multi-model support → per-model prompt adaptation | `config/llm.js`, `config/models.js`, `quest/chatService.js`, `quest/userSettings.js` |
| 2 | Cross-system coordination via `window` globals + custom event bus | `main.ts`, `index.ts`, all `quest/*`, `ui/chatUI.js`, `ui/controls.js` |
| 3 | Hybrid TS/JS with global `window.BABYLON` | `index.ts`, `main.ts`, ~60 `.js` files |
| 3 | Animation via full GLB reload (no skeletal animation) | `characters/gameplay/NPCBase.js`, `characters/data/*.js`, `ui/controls.js` |
| 3 | SSE streaming chat with partial-response recovery | `quest/chatService.js`, `ui/chatUI.js` |
| 3 | Custom GLSL shader for height-limited fog | `fx/FogEffect2.js`, `fx/FogEffect.js` |
| 3 | Scene recreation for level switching | `main.ts`, `quest/levelProgression.js`, `config/levelOrder.js` |
| 4 | NPC subclass boilerplate (DRY violation) | `characters/gameplay/NPCBase.js` + 10+ subclasses |
| 4 | Effect variant proliferation (iterative dead code) | `fx/RainEffect*.js`, `fx/FogEffect*.js`, `components/*CeilingComponent.js` |
| 4 | Dual ChatUI interaction paths | `quest/DialogueManager.js`, `characters/gameplay/NPCBase.js`, `ui/chatUI.js` |
| 5 | `DebugControls` doubling as production level factory | `ui/debugControls.js` |
| 5 | Dynamic imports in hot paths | `ui/controls.js` |
| 5 | Pervasive logging + dead code | `quest/*`, `characters/*`, `characters/npcService.js` |

---

# Tier 1 — Very Hard

*Fundamental platform/capability constraints that required building a custom subsystem because no off-the-shelf solution exists.*

## T1.1 — WebGL Per-Mesh Light Limit → `ClusterManager` Virtual Light Registry

**Difficulty:** Fundamental platform constraint.

**Files:** `fx/lighting/ClusterManager.js`, `fx/lighting/DefaultLight.js`, `config/config.js`, `levels/singapore6/lighting.js`, `levels/singapore6/furniture.js`.

### The difficulty

Babylon.js **Standard Material** supports only ~4 simultaneous lights affecting any given mesh. A neon cyberpunk city needs dozens to hundreds of light sources — signage, street lamps, interiors, fog volumes. Naively placing every light as a real GPU `PointLight` would either blow the per-mesh budget or force most lights to be inert.

### Architecture & data flow

The system maintains two tiers of lights:

1. **Virtual light registry** — light *properties* (position, color, intensity, type) stored as plain data. There can be hundreds of these. They never touch the GPU directly.
2. **Fixed pool of real lights** — a small number of actual Babylon `PointLight` objects, sized by `MAX_LIGHTS_PER_MESH` (=3) per the light-clustering budget in `config/config.js`.

Every 10th frame, the `ClusterManager` runs an update pass that decides which virtual lights get promoted to real lights for each mesh of interest:

- **Occlusion test** — for each candidate virtual light, ray-cast from the light toward each mesh tagged as a `"wall"` to determine whether the light is actually visible or blocked by geometry.
- **Frustum visibility** — a dot-product test discards lights behind the camera or outside the relevant frustum.
- **Distance sort** — surviving candidates are sorted by distance to the mesh.
- **Pool reassignment** — the closest `MAX_LIGHTS_PER_MESH` visible virtual lights are assigned to the real light pool, which then illuminates the mesh.

Spotlights are approximated as point lights (a lossy simplification), and an ~60% intensity scaling is applied so the pooled lights land in a visually reasonable brightness range.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Hundreds of "virtual" lights can coexist in a single scene. | Spotlights reduced to point lights — no cone shaping. |
| Visual quality stays high without exceeding WebGL light budgets. | Visible "popping" on the 10-frame throttle as the pool reassigns. |
| Wall occlusion gives plausible shadow-like behavior for free. | Per-update cost is roughly O(lights × walls) ray casts — the 10-frame throttle exists to keep this affordable. |
| | 60% intensity scaling is a hand-tuned global constant, not physically derived. |

---

## T1.2 — LLM-as-Judge Quest Resolution

**Difficulty:** No deterministic way to evaluate free-form dialogue against quest objectives.

**Files:** `quest/ResolutionManager.js`, `quest/chatService.js`, `config/llm.js`, `levels/singapore6/quest.js`, `levels/taiyong/quest.js`, `levels/nightclub/quest.js`.

### The difficulty

Quests resolve through natural conversation — players must persuade, bluff, confess, or extract information from NPCs over multiple turns. There is no keyword set, no option tree, and no state machine that could capture "did the player convincingly roleplay contrition to the guard?" Deterministic checks would either be trivially gameable or reject legitimate roleplay.

### Architecture & data flow

1. The player's message and NPC reply are appended to history via `ChatService.addToHistory()`.
2. After a 1-second delay, `ResolutionManager.evaluateConversation()` runs.
3. The manager filters the level's quest conditions by `npcIds` — only conditions relevant to the NPC the player just spoke with are evaluated.
4. For each applicable condition, a yes/no prompt is built from the template in `config/llm.js` and sent as a **non-streaming** OpenRouter call (streaming is pointless for a yes/no answer).
5. The response is parsed for `"yes"` or `"no"`.
6. On `"yes"`, `completeCondition()` awards quest points and dispatches a `conditionCompleted` custom event.
7. When accumulated points cross the level's threshold, a `levelExitUnlocked` event fires.
8. Progress is persisted to `sessionStorage` so a refresh doesn't lose quest state.

Conditions are evaluated sequentially in a `for...of` loop, awaiting each LLM call before starting the next.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Genuine open-ended roleplay — any path through dialogue can resolve a quest. | **Cost amplification:** one NPC reply triggers N sequential LLM calls (one per applicable condition). |
| No keyword dictionaries to author or maintain per quest. | **Silent failures:** free models hallucinate non-yes/no answers, which parse as `"no"` → quest silently stuck. |
| Resolution logic is data-driven via quest definitions. | **No retry or throttle** — a rate limit mid-evaluation abandons remaining conditions. |
| | **Sequential latency** — `for...of` with `await` means evaluation time scales linearly with condition count. |

---

# Tier 2 — Hard

*Architectural decisions with real consequences — each one was a genuine fork in the road where the alternative was materially worse.*

## T2.1 — No Physics Engine → Per-Frame Ray-Cast Collision

**Files:** `ui/controls.js`, `camera.js`, `components/BaseComponent.js`.

### The difficulty

A full physics engine (Cannon.js, Ammo.js, Havok) is a heavy dependency for what is essentially a walking simulator with no rigid bodies, no stacking, no projectiles. Pulling in a wasm physics module would bloat the bundle and add integration complexity that the gameplay doesn't justify.

### Architecture & data flow

- **Collision meshes** are invisible boxes (`visibility = 0`, `checkCollisions = true`) attached to buildings, walls, doors, and furniture. Their dimensions come from JSON metadata.
- **Per-frame**, the camera and movement system cast rays against tagged collision meshes; a hit blocks the proposed movement for that frame.
- `BaseComponent` standardizes the pattern for emitting these collision meshes from component subclasses.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Tiny bundle size — no physics wasm, no physics plugin. | No rigid bodies, no sliding, no resting contacts. |
| Simple integration — collision is just another ray query. | Per-frame ray cost on every movement tick. |
| Easy to author — a JSON entry produces a collider. | Fidelity is limited to AABB-ish boxes; no convex hulls, no per-triangle collision. |

---

## T2.2 — Free-Tier Multi-Model Support → Per-Model Prompt Adaptation

**Files:** `config/llm.js`, `config/models.js`, `quest/chatService.js`, `quest/userSettings.js`.

### The difficulty

Six different free models are supported (Google Gemma default, Qwen, OpenAI GPT OSS, DeepSeek Chat, DeepSeek R1, and others). They differ in capability: some support system messages, some don't; context windows vary; the game is tuned primarily for Gemma. A single prompt format cannot satisfy all of them.

### Architecture & data flow

- `getModelConfig(modelId, type)` returns model-specific parameters (temperature, `max_tokens`, `history_length`).
- `supportsSystemMessages()` branches the prompt construction:
  - **Models with system support** — use the `SYSTEM_DIALOGUE` template as the system message and include a longer history slice.
  - **Models without system support** (notably Gemma) — use the `USER_WITH_CONTEXT` embedded template, baking persona and world context into the user message with a shorter (last-2-exchange) history slice.
- `userSettings.js` exposes model selection to the player; switching dispatches a `modelChanged` event.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Model portability — players can choose any free model. | **Dual prompt paths** must be maintained and tested. |
| Zero-cost inference (all free-tier models). | **Shallower context for Gemma** — the default model gets the most constrained history. |
| Graceful fallback if a model is rate-limited or deprecated. | **Mid-conversation model switches** leave an oversized history in the buffer until the next truncation point. |

---

## T2.3 — Cross-System Coordination via `window` Globals + Custom Event Bus

**Files:** `main.ts`, `index.ts`, all `quest/*`, `ui/chatUI.js`, `ui/controls.js`, plus 8+ `window.*` singletons (`currentLevel`, `resolutionManager`, `levelProgression`, `chatUI`, `gameCamera`, `recreateScene`, `userSettings`, `characters`).

### The difficulty

The game has many loosely coupled subsystems — dialogue, quests, levels, UI, camera, input, effects — that need to talk to each other without a unifying framework, DI container, or shared store. Introducing one mid-project would be a large refactor.

### Architecture & data flow

- **Singletons on `window`** — systems write themselves onto `window` during construction (`window.currentLevel`, `window.resolutionManager`, `window.chatUI`, etc.). Consumers read them lazily at call time.
- **Custom event bus** — cross-system signals are dispatched as `CustomEvent`s on the global `window`:
  - `lockPlayerControls` — UI opened, freeze movement.
  - `conditionCompleted` — a quest condition resolved true.
  - `levelExitUnlocked` — quest threshold reached.
  - `modelChanged` — player picked a new LLM.
  - `changeLevel` — request a level transition.
  - `stopCharacterMovement` — freeze NPCs.
- **Static flag coordination** — UI-active state is shared via static class flags (`ChatUI.isActive`, `SettingsUI.isActive`, etc.) so input handlers can short-circuit when a window is open.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Zero boilerplate decoupling — any system can signal any other. | **Hidden dependency graph** — to know what calls `window.resolutionManager`, you must grep the codebase. |
| No DI container or state library to learn. | **Untestable in isolation** — every subsystem depends on `window` being populated. |
| Trivial to add a new event type. | **Implicit ordering bugs** — listeners fire in registration order with no priority. |
| | **Event-listener leaks** — `DialogueManager.dispose()` cannot remove its anonymous `.bind(this)` listener because the bound reference is new each time. |

---

# Tier 3 — Medium-Hard

*Notable design decisions — each one defensible, but with maintenance or performance tax.*

## T3.1 — Hybrid TS/JS with Global `window.BABYLON`

**Files:** `index.ts`, `main.ts` (typed); ~60 `.js` files untyped.

### The difficulty

Babylon.js is a large library; importing it per file is verbose and slows iteration in game-logic files where the same surface is used repeatedly across dozens of files.

### Architecture & data flow

`index.ts` imports the Babylon.js modules once and attaches them to `window.BABYLON`. Every `.js` file reads Babylon from that global, eliminating per-file imports.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Terse game code — no Babylon import boilerplate in any `.js` file. | No tree-shaking — the entire Babylon surface is retained. |
| Fast to write new game-logic files. | No IDE autocomplete or type safety in the 60 untyped files. |
| | Split codebase personality — typed entry, untyped body. |

---

## T3.2 — Animation via Full GLB Reload (No Skeletal Animation)

**Files:** `characters/gameplay/NPCBase.js`, `characters/data/*.js`, `ui/controls.js`.

### The difficulty

Skeletal animation blending on a single mesh (animation groups, weights, transition graphs) is complex to wire up per character, especially across the 10+ NPC types in this project.

### Architecture & data flow

- `NPCBase.setAnimation()` disposes the current mesh and re-imports a new GLB via `SceneLoader.ImportMeshAsync`.
- The **player** preloads 7 separate meshes (idle, forward, back, left, right, run, dance) once and toggles `visibility` on the desired one — no reload at runtime.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Simple state transitions — one mesh per state, no blend graph. | **Visual popping** on every NPC state change (dispose + reload). |
| Trivial to author new states — export a new GLB. | **7× player-model memory** — seven full meshes resident. |
| | **Per-transition load latency** for NPC animation changes. |

---

## T3.3 — SSE Streaming Chat with Partial-Response Recovery

**Files:** `quest/chatService.js`, `ui/chatUI.js`.

### The difficulty

Real-time chat display requires streaming tokens to the player. Networks fail mid-stream, rate limits hit partway through, and free-model endpoints return HTTP errors that must map to specific UI guidance.

### Architecture & data flow

- `fetch` POST returns a `ReadableStream`.
- The reader parses `data: {...}` SSE lines and invokes an `onChunk` callback per token.
- **On error mid-stream:** if a partial response exists, it is saved as the complete assistant turn; otherwise a static `getFallbackResponse()` message is inserted.
- **HTTP error mapping:** 401, 429, and 402 are translated into specific UI errors via `window.debugUI.showApiError()`.
- A duplicate-history-insertion guard prevents the same partial response from being recorded twice.
- An action-text regex filters the final rendered response (this filter runs only on completion, so action text is briefly visible during streaming).

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Responsive UX — tokens appear as they arrive. | Complex partial-state handling and recovery paths. |
| Graceful degradation — partial or fallback responses keep the conversation flowing. | Duplicate-insertion guard adds a non-obvious invariant. |
| Specific error UX for auth/rate-limit/payment errors. | Action-text filter is visible-during-streaming because it runs only on completion. |

---

## T3.4 — Custom GLSL Shader for Height-Limited Fog

**Files:** `fx/FogEffect2.js` (versus the simpler `fx/FogEffect.js`).

### The difficulty

Babylon's standard exponential fog applies uniformly by depth, which darkens the skybox as well — unacceptable when the skybox is doing atmospheric work above the fog layer.

### Architecture & data flow

- Linear fog is combined with a **custom post-process shader**.
- The shader reconstructs the view-space position of each fragment from its depth value.
- Fragments **above** `heightLimit` are discarded, preserving the skybox.
- A sine-wave opacity pulse modulates fog density over time for atmosphere.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Fog that respects altitude — skybox stays clear above the height limit. | Depth → view-space reconstruction is approximate; artifacts at grazing angles. |
| Animated density for atmosphere. | Shader maintenance burden — custom GLSL must be kept in sync with engine updates. |

---

## T3.5 — Scene Recreation for Level Switching

**Files:** `main.ts` (`window.recreateScene`), `quest/levelProgression.js`, `config/levelOrder.js`.

### The difficulty

Levels differ structurally — outdoor neon city versus indoor nightclub versus corporate interiors. Hot-swapping geometry in place is more error-prone than rebuilding from scratch, given the heavy use of `window` globals and custom event listeners.

### Architecture & data flow

- `changeLevel` event → `LevelProgression` → `window.recreateScene(levelId)`.
- The **entire scene is disposed** and a new one created.
- A new `LevelGenerator` is instantiated via `DebugControls.getLevelGenerator()` (see T5.1).
- Characters are reloaded into the new scene.
- Only data explicitly stored on `window.*` or in `sessionStorage` survives the transition.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| No stale-state leakage — every transition starts from a clean scene. | **Loading hitch** on every transition. |
| Simple lifecycle — dispose, rebuild, done. | Progress persists only via explicit `window.*` + sessionStorage hand-off. |
| | `ChatService` conversation histories may be lost across transitions if not carried explicitly. |

---

# Tier 4 — Medium

*Code-smell-tier tradeoffs — each one is a known cost, but not painful enough to refactor yet.*

## T4.1 — NPC Subclass Boilerplate (DRY Violation)

**Files:** `characters/gameplay/NPCBase.js` plus 10+ identical subclasses (`maggiechow.js`, `mreed.js`, `tong.js`, `maxeen.js`, `csk.js`, `bangweitun.js`, `copf01.js`, `guardm01.js`, `bluef01.js`, `orangeF01.js`, `purple02f.js`).

### The difficulty

A data-driven NPC concept (persona in `data/`, behavior in `gameplay/`) was implemented before the shared `NPCBase` fully matured.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Per-NPC customization hook is always available. | ~28 copy-pasted lines per subclass — roughly **300 lines of pure duplication**. |
| Easy to add a new NPC — copy a file, change the name. | A single `NPCBase` method parameterized by data would eliminate the duplication. |

---

## T4.2 — Effect Variant Proliferation (Iterative Dead Code)

**Files:** `fx/RainEffect.js`, `RainEffect2.js`, `RainEffect3.js`, `RainEffect4.js` (only #4 used); `fx/FogEffect.js`, `FogEffect2.js`; `components/CeilingComponent.js`, `NEWCeilingComponent.js`.

### The difficulty

GPU versus CPU approaches for rain, and several fog strategies, were explored empirically — the team kept every iteration rather than pruning.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Rapid empirical iteration produced better final variants. | **3 dead rain implementations** shipped in the bundle. |
| Older variants remain diff-able if a regression appears. | `NEWCeilingComponent.js` (originally red debug material, now used in production with an override) is a tech-debt hotspot — the name lies. |
| | `EffectManager` imports all variants, so tree-shaking cannot drop them. |

---

## T4.3 — Dual ChatUI Interaction Paths

**Files:** `quest/DialogueManager.js` (keyboard `'E'` proximity trigger), `characters/gameplay/NPCBase.js` (`OnPickTrigger` click → `interact()`), `ui/chatUI.js`.

### The difficulty

Keyboard proximity interaction and click-to-talk were added independently, each wiring up its own `ChatService`.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Two input modalities — keyboard and mouse players both served. | **Two `ChatService` instances** with split conversation histories per NPC. |
| | `window.chatUI` singleton conflict risk between the two paths. |

---

# Tier 5 — Lower

*Smells and cleanup candidates — low individual impact, worth flagging.*

## T5.1 — `DebugControls` Doubling as Production Level Factory

**Files:** `ui/debugControls.js`.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Quick to add — level switching was bolted onto an existing debug surface. | `getLevelGenerator()` is the **real production level factory**, despite the `Debug` name. |
| | Dead switch-case branches reference `LadiesRoomLevel` and `TestCameraCollision`, which are not imported. |

---

## T5.2 — Dynamic Imports in Hot Paths

**Files:** `ui/controls.js`.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Lazy-loads the settings UI — only fetched when first needed. | A dynamic `import('../quest/settingsUI.js')` runs **inside every keydown/keyup handler** — Promise/microtask overhead on every keypress, adding input latency. |

---

## T5.3 — Pervasive Logging + Dead Code

**Files:** nearly all `quest/*` and `characters/*`; `characters/npcService.js` (a REST client for a backend that does not exist); the `clearHistory` no-op in `chatService.js`; `initialMemories` authored in character data but never injected into prompts.

### Tradeoff

| Gained | Sacrificed |
|--------|------------|
| Debugging visibility during development. | Console noise in production. |
| | `npcService.js` is entirely dead — a phantom backend client. |
| | The **Goodbye button** calls `clearHistory`, which is a no-op — users believe they are clearing history when they are not. |
| | `initialMemories` are authored but never reach the prompt — wasted authorial effort and a latent feature gap. |

---

# Appendix — Latent Bugs Worth Flagging

These are not tradeoffs but live bugs discovered during the tradeoff review. They are listed here so they are not lost.

| Bug | Location | Impact |
|-----|----------|--------|
| **NPC ID mismatch** — `csk.js` uses `id: "csk"`, but `levels/taiyong/quest.js` references `"khychoonsoh"`. | `characters/data/csk.js`, `levels/taiyong/quest.js` | A Taiyong quest objective that depends on this NPC is unreachable. |
| **Duplicate `maggiechow` data files** — `characters/data/npc1.js`, `npc2.js`, and `maggiechow.js` all define the same NPC. | `characters/data/` | Ambiguous source of truth; risk of the wrong file being loaded depending on import path. |
| **Tong has an empty `persona` string.** | `characters/data/tong.js` | Broken prompt — Tong's dialogue context is empty. |
| **`setDimensions` bug in `BuildingComponent`** — scaling always evaluates to 1.0. | `components/BuildingComponent.js` | Building dimensions silently wrong. |
| **Event-listener leak in `DialogueManager.dispose()`.** | `quest/DialogueManager.js` | `.bind(this)` creates a new function reference each call, so `removeEventListener` cannot match the originally registered listener. |
| **`FPSDisplay` runs its own `engine.runRenderLoop`** alongside the main one. | `ui/debugUI.js` | Two render loops race; FPS counters and frame timing may diverge. |
