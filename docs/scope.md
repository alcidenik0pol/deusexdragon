# Authorship & Scope Audit — Deus Ex: Neon Merlion

This document is a neutral technical audit of **who built what** in Deus Ex: Neon Merlion. For every functional area it states, as precisely as possible, what the author hand-wrote versus what was provided by the engine (Babylon.js), third-party libraries, external services (OpenRouter), and AI-generation tools (Trellis, Meshy, Suno, ElevenLabs).

**Orientation.** The game is a Babylon.js 7.52 application. Babylon provides the WebGL renderer, the scene graph, primitive mesh builders, the material classes, the GLB loader, and the light/camera/post-process primitives. Almost everything *above* raw engine primitives — the level system, the component system, the light-clustering layer, the movement and camera controllers, the NPC FSM, the dialogue/quest/progression logic, and the entire UI — is custom code. There is no physics engine and no game framework; collision is hand-rolled ray-casting. The only non-Babylon runtime dependencies are the dev toolchain (Webpack/TS/Tailwind/PostCSS), the browser APIs (`fetch`, `ReadableStream`, DOM, pointer-lock, storage), and the OpenRouter inference API. Every visible 3D model, music track, and voice line is AI-generated; dialogue itself is generated live by LLMs at runtime.

This audit is distinct from `docs/project.md` (a dense portfolio summary) and `README.md` (user-facing marketing + architecture). It exists to state scope boundaries exactly.

---

## 1. Foundation — engine, toolchain, entry flow

### What was written

The bootstrap sequence in `index.ts` and `main.ts` is custom. `index.ts` imports the Babylon packages and assigns them onto `window.BABYLON` (core), `window.BABYLON.GUI`, and `window.BABYLON.Materials` so that the plain-JS source files can consume them as a global. `main.ts` owns the engine and scene lifecycle: it constructs the `BABYLON.Engine`, exposes a `createScene(levelType)` factory that instantiates a scene, builds a `GameCamera`, asks `debugControls.getLevelGenerator()` for the right level class, calls `levelGenerator.createLevel()`, loads the player character meshes, wires pointer-lock input (`scene.onPointerDown` requests the lock; `scene.onPointerMove` applies mouse delta to camera rotation with a pitch clamp), reads the per-level spawn position, constructs the `Controls` movement system, sets `scene.clearColor`, and starts the render loop via `engine.runRenderLoop`. A `recreateScene(levelType)` helper disposes the current scene and calls `createScene` again; it is exposed on `window.recreateScene`. World-scale configuration — `UNIT_SCALE`, `GRID_CELL_SIZE` (both 1, i.e. 1 unit = 1 meter), `DEFAULT_WORLD_SIZE` (100), and the light-clustering constants (`CLUSTER_SIZE: 8`, `MAX_LIGHTS_PER_CLUSTER: 3`, `MAX_LIGHTS_PER_MESH: 3`, `VERTICAL_CLUSTERS: 4`) — is defined by the author in `config/config.js`.

### What was provided externally

The engine itself: `@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders`, and `@babylonjs/materials` (four runtime npm dependencies at `^7.52.2`). The toolchain: Webpack 5, `webpack-cli` 4, `webpack-dev-server` 4, TypeScript 5.3 with `ts-loader` 9, TailwindCSS 3.4 with `postcss`/`autoprefixer`/`postcss-loader`, `css-loader`, `style-loader`, `html-webpack-plugin`, `copy-webpack-plugin`, and `@types/node` (fourteen devDependencies). The browser's WebGL implementation and the underlying GLSL shader compiler.

### Notes

`@babylonjs/gui` is imported and assigned onto `window.BABYLON.GUI`, but no source file ever reads it back — it is dead weight in the bundle (see §10). `index.ts` likewise assigns `window.BABYLON.Materials` without consumption.

---

## 2. Graphics & Rendering

### What was written

Two pieces of custom GLSL exist, both inlined into JS via `BABYLON.Effect.ShadersStore` (there are no `.fragment`/`.vertex` files on disk):

- **FogEffect2** (`fx/FogEffect2.js`) — a `BABYLON.PostProcess` that applies scene fog only below a `heightLimit` uniform, with a smooth ten-unit transition band above it. The fragment shader samples the frame texture, mixes a `fogColor`, and pulses density over time. This is the height-limited post-process.
- **Nightclub dance-floor shader** (`levels/nightclub/lighting.js`) — the only `BABYLON.ShaderMaterial` instance in the repo. Its vertex shader computes distance from each vertex to a `lightPosition` uniform, applies an aggressive hotspot at 20% of `maxDistance` with cubic falloff to 40%, and emits a `vDistanceFactor`; the fragment shader animates reflectivity with a `sin(time)` wave and adds a pulse. It is bound to the mesh whose id is `nightclub-floor`.

Beyond shaders, the author hand-authored the `DynamicTexture` art used for gradient/light-pool effects: a 256×256 radial gradient for streetlight ground pools in `levels/singapore6/lighting.js`, a linear gradient for light pools in `levels/taiyong/lighting.js`, soft-circle particle textures in `levels/singapore6/furniture.js`, radial-gradient ground lights in `fx/NightclubLightEffect.js`, and volumetric-cone/strobe-beam alpha gradients in `levels/nightclub/lighting.js`. The author chooses per-level material strategies (flat grey ground in Singapore6, `GridMaterial` defaults in the base class, `PBRMaterial` for character meshes in the nightclub, `StandardMaterial` for most architecture), sets `scene.clearColor` per context (daylight blue in `main.ts`, pure black during nightclub blackout), and configured the single HDR environment setup: a prefiltered `.env` CubeTexture loaded from the Babylon CDN, an `environmentIntensity` of 0.5, a 512-tap `ReflectionProbe` positioned at the nightclub centre, and `ImageProcessingConfiguration` tone mapping (exposure 1.0, contrast 1.1).

### What was provided externally

Babylon's material classes (`StandardMaterial`, `PBRMaterial`, `GridMaterial` from `@babylonjs/materials`, `WaterMaterial`), the `ShaderMaterial` and `PostProcess` machinery, `VolumetricLightScatteringPostProcess`, `GlowLayer`, `ReflectionProbe`, `DynamicTexture`, `CubeTexture` (including `CreateFromPrefilteredData`), the HDR environment loader, and the browser's WebGL driver.

### Notes

The nightclub floor shader is the only `ShaderMaterial`; FogEffect2 is a `PostProcess`, not a `ShaderMaterial`. The HDR `.env` texture is fetched from `assets.babylonjs.com` — an external CDN asset, not authored here.

---

## 3. Lighting system

### What was written

The headline custom infrastructure is **`ClusterManager`** (`fx/lighting/ClusterManager.js`), a light-pooling system the author built because Babylon constrains the number of simultaneous lights affecting a single mesh. Its design:

- A fixed pool of **three** `BABYLON.PointLight` instances (`poolLight_0/1/2`) is created once. The count comes from `MAX_LIGHTS_PER_MESH` (3) in `config/config.js` and is passed explicitly by `Singapore6Lighting`.
- Per-level code registers light *descriptions* (position, colour, intensity, range, optional spotlight parameters) into a `lightRegistry` Map; no real Babylon lights are created per source.
- An update loop runs every **ten frames** (`UPDATE_FREQUENCY = 10`, counting `registerBeforeRender` ticks). On each update, `updateLights()` builds a candidate list and filters it in four stages: (1) **ray-cast wall occlusion** — for each candidate, `BABYLON.Ray.Intersects` is tested against the bounding boxes of all meshes tagged `"wall"`, and occluded lights are dropped; (2) **frustum dot-product cull** — `Vector3.Dot(cameraForward, cameraToLight.normalized()) > 0` keeps only lights in front of the camera half-space; (3) **distance filter** — lights beyond `range * 1.5` (default 15 m) are dropped; (4) **sort** — in-frustum lights first, then ascending by distance.
- The top three survivors are then *copied* onto the pool lights: each pool light receives the source's position, diffuse/specular, range, and an intensity scaled to 0.6× of the source (spotlight sources get a 0.7× range reduction and 1.2× intensity boost as an approximation). Unused pool lights are set to intensity zero.
- Ground-disc "light pool" decals are authored at the per-level lighting layer (`levels/singapore6/lighting.js` creates a `MeshBuilder.CreateDisc` with an emissive `StandardMaterial` and a radial-gradient `DynamicTexture` as `opacityTexture`; `fx/NightclubLightEffect.js` does the same for moving spot beams).

Per-level lighting configs are plain JS classes: `Singapore6Lighting` instantiates `ClusterManager` directly and registers streetlights via a `registerStreetlight()` helper; `NightClubLighting` receives a cluster manager from its level, defines a large colour/timing config object, and drives animations that call `clusterManager.updateLightProperty()` each frame.

### What was provided externally

Babylon's light primitives (`PointLight`, `SpotLight`, `HemisphericLight`, `DirectionalLight`), `BABYLON.Ray.Intersects` (static AABB intersection, used for the occlusion test), and — critically — Babylon's per-mesh maximum-lights constraint, which is the reason the custom system exists at all.

### Notes

The occlusion test uses `Ray.Intersects` against bounding boxes, not `scene.pickWithRay` against triangle geometry; it is therefore an AABB wall-occlusion approximation, not precise geometric occlusion. The frustum test is a half-space dot-product check (`> 0`), not a full frustum-cube intersection.

---

## 4. World & Level Architecture

### What was written

`LevelGenerator` (`levels/levelGenerator.js`) is a template-method base class. Its `createLevel()` calls `setupSkybox()`, `createGround()`, and `createWalls()` in sequence and returns a result object; subclasses override the individual steps (or override `createLevel()` itself, calling `super.createLevel()` first) to add NPCs, lighting, effects, and quest setup. The base class also holds static `LEVEL_BOUNDS` (derived from `WORLD_CONFIG`), a `DEFAULT_CONFIG` (`mazeSize: 16`, `skyboxSize: 1000`), and a `dispose()` that tears down walls, components, the settings UI, and the skybox. An intermediate `customLevel.js` extends `LevelGenerator` with larger 80×80 bounds.

Each level is a folder under `levels/` containing modular files: the main `*Level.js` class, plus `buildings.js`, `objectMapping.js`, `lighting.js`, `npc.js`, `quest.js`, `furniture.js`, and level-specific extras. Five level folders exist — `singapore6` (`singapore6Level.js`), `nightclub` (`nightClubLevel.js`), `taiyong` (`taiyongLevel.js`), `grid` (`GridLevel.js`), and `credits` (`creditsLevel.js`) — plus a `customLevel.js` intermediate base. The `objectMapping.js` files are hand-authored grid-coordinate placement tables: `levels/singapore6/objectMapping.js` defines `DEFAULT_SPAWN`, named `BUILDINGS` with `{x,z}` grid coords, `STREETLIGHTS` arrays, `WATER` dimensions, `CONTAINER_SHIPS` (north/east rows), and `CITY_BORDERS`/`SEA_BORDERS` line segments. Levels convert these to world positions via a `getWorldPosition(gridX, gridZ)` helper (with `GRID_CELL_SIZE = 1`, grid coords are effectively metres).

`CityscapeBorder` (`levels/singapore6/cityscapeBorder.js`, extending `WallComponent`) is a procedural skyline generator: given start/end points it segments the span, randomises each segment's width and height around configurable averages (`avgHeight: 45`, variation 15, 30% chance of a short building), and emits a box mesh per segment with collision enabled. The flying-car system (`levels/singapore6/vehicles.js` + `singapore6Level.js`) spawns ten `Car03` GLB components with emissive head/tail lights and a per-frame `updateFlyingCar()` loop that advances each car along its axis and wraps position back to start when it exceeds its end coordinate. Level teardown is split: the base `LevelGenerator.dispose()` cleans walls/components/skybox, and each subclass `dispose()` adds lighting/effects/NPC/quest cleanup; `main.ts`'s `recreateScene` calls Babylon's `Scene.dispose()` to drop all meshes.

### What was provided externally

`MeshBuilder` primitives (`CreateBox`, `CreateGround`, `CreatePlane`, `CreateDisc`, `CreateCylinder`), `Scene.dispose()`, and the transform/parenting graph. The "level" concept itself is the author's — Babylon ships no level system, scene manager, or asset-pack loader.

### Notes

The five level folders use inconsistent filename casing (`singapore6Level.js` vs `nightClubLevel.js` vs `GridLevel.js`). `levels/nightclub/furniture.js` and `levels/nightclub/objectMapping.js` are zero-byte stubs.

---

## 5. Component system & asset pipeline

### What was written

`BaseComponent` (`components/BaseComponent.js`) is the root of the component hierarchy: it holds position/rotation/scale, a `collisionMesh`, attach points, and a `floorOffset`, and provides `initialize`, `setVisible`, `setCollision`, `dispose`, `getFloorPosition`, and `setWorldPosition` (which preserves `floorOffset` as the y-value). Concrete subclasses: `BuildingComponent` (box-mesh buildings with `setHighlight`), `WallComponent` (light-blocking walls with a `setTransparent` glass mode), `DoorComponent` (fixed 4×8×0.1 dimensions, open/close state), `FloorComponent` (ground plane), `CeilingComponent` (extends `FloorComponent`, rotated), `BlinderComponent` (Venetian-slat walls built from many slat meshes plus one invisible collision box), and `SkyboxComponent` (standalone; supports a custom material or a `CubeTexture` skybox with `infiniteDistance`).

The asset pipeline is `BaseComponent.loadAsset(assetType, assetId)`. It fetches `/assets/<type>/<id>.json` metadata, reads four fields — `standardDimensions`, `rawDimensions`, `scaleFactor`, and `facing` (validated against north/east/south/west) — loads the GLB via `SceneLoader.ImportMeshAsync`, applies `scaleFactor` as uniform scaling, computes `floorOffset = (rawDimensions.height * scale) / 2`, and positions the mesh so its base sits at y=0 with the facing rotation applied. Collision-box placement is delegated to subclasses, not done inside `loadAsset`.

`MaterialFactory` (`components/MaterialFactory.js`) is a small caching factory for wall/floor `StandardMaterial`s. It is legacy: no level or component class imports it; all materials are created inline.

### What was provided externally

`SceneLoader.ImportMeshAsync` and the GLB loader from `@babylonjs/loaders`, JSON parsing via the browser, and the GLB models themselves (AI-generated — see §11).

### Notes

`loadAsset` does not read a `gridFootprint` field even though the JSON schema includes one. A second ceiling file, `components/NEWCeilingComponent.js`, exists alongside `CeilingComponent.js` and is the one actually imported by the taiyong and nightclub levels; it renders a `CreatePlane` in a red debug colour.

---

## 6. Gameplay — movement, camera, controls, collision

### What was written

The entire movement and collision layer is hand-written in `ui/controls.js` and `camera.js` (`GameCamera`). There is no physics engine.

**Movement.** `Controls` receives the seven player meshes and a `GameCamera`. It listens to raw `window` keydown/keyup events (not Babylon's input managers) and maintains its own key-state object. Hand-tuned speeds live in `controls.js`: `baseMoveSpeed = 0.04`, with forward/backward/strafe derived as fractions and a `sprintMultiplier = 8.0`. The movement loop runs in `registerBeforeRender`: it derives a forward vector from the camera yaw, builds a `moveVector`, then performs **per-frame ray-cast collision** — a `BABYLON.Ray` is cast from the character's mid-height in the movement direction, and `scene.pickWithRay` tests it against meshes where `checkCollisions === true && !mesh.isWalkthrough`; movement is applied only when `!hit.hit`. The K key triggers the dance animation (highest priority, returns early); SHIFT+W engages sprint; P initiates level progression (it checks the resolution manager's point/threshold gating before allowing exit).

**Camera.** `GameCamera` (`camera.js`) creates a `BABYLON.UniversalCamera` but never calls `attachControl` — the camera is repositioned manually every frame. Three profiles are defined: `thirdPerson` (offset 0, 2.5, 4), `npcFocus` (0, 2.15, 2.2), and `waiting` (0, 2.2, 2.2). The follow math is spherical-coordinate: `radius = sqrt(offsetZ² + offsetY²)`, with the desired position computed from yaw/pitch. Camera-wall collision is another ray cast — from target to desired position, length `radius`, via `scene.pickWithRay`; on hit the camera snaps to the picked point plus a **0.2-unit** offset along the target-to-hit normal, with a max-distance clamp at 6 units. Mouse-look applies `evt.movementX/Y * 0.002` to camera rotation with pitch clamped to ±π/3.

**Key bindings** are distributed across files: WASD/SHIFT/K/P in `controls.js`; E (NPC interaction) in `ui/chatUI.js`; J (quest journal) in `quest/questJournal.js`; O (settings) in `quest/settingsUI.js`; L (level select) and 1 (debug) and F (FPS) in `ui/debugControls.js`; ESC closes the active window across several handlers. Guards prevent movement while chat or settings windows are open: `controls.js` checks `ChatUI.isActive`, `SettingsUI.isActive`, and a `movementLocked` flag set by `lockPlayerControls` custom events.

### What was provided externally

`UniversalCamera`, `Ray`, `scene.pickWithRay`, the pointer-lock API (`canvas.requestPointerLock`, `engine.isPointerLock`), and canvas pointer events.

### Notes

Babylon's built-in camera input (`attachControl`/`inputs`) and its built-in keyboard managers are **not** used; `camera.checkCollisions` and `camera.ellipsoid` are set but inert because `attachControl` is never called. Mouse-look handling is duplicated between `camera.js` and `main.ts`; the `main.ts` handler overwrites `scene.onPointerMove`. There is no physics-engine import anywhere in the source tree — the plan's "physics plugins imported but unused" framing is inaccurate; the only physics-related code is dead defensive `physicsImpostor` cleanup in `DoorComponent.js`.

---

## 7. Characters & NPCs

### What was written

`NPCBase` (`characters/gameplay/NPCBase.js`) is a finite-state machine with three states — `IDLE`, `WALKING`, `LOCKED` (movement suppressed, e.g. during dialogue). Four parametric movement patterns are implemented in closed form: `CIRCLE` (cosine/sine, radius 5), `FIGURE_8` (`sin(t)` × `sin(t/2)` lemniscate), `OVAL` (circle with z halved), and `INFINITY` (rational parametric `sin(t)/(1+cos²t)`). Random timers drive transitions: IDLE holds 2–5 s, WALKING holds 4–8 s, and the active pattern is re-randomised every 15–30 s.

The persona data schema is hand-authored in `characters/data/*.js` (thirteen files: `maggiechow`, `tong`, `maxeen`, `mreed`, `csk`, `bangweitun`, `guardm01`, `copf01`, `bluef01`, `orangef01`, `purple02f`, `npc1`, `npc2`). Each persona carries `id`, `name`, `animations` (a map of animation name → GLB path), `defaultAnimation`, `scale`, `rotation`, `interactionRadius`, `persona` (backstory string), `initialMemories` (an array of memory strings), and `questDetails` (`relevantInfo`, `connections`, `playerObjectives`). Each level has its own `npc.js` `NPCManager` that registers NPCs and wires them to the dialogue/quest systems.

The **mesh-swap animation technique** replaces skeletal animation. For the player character (`characters/pc/maincharacter.js`), **seven** GLB files are pre-loaded together via `Promise.all` — `idle`, `walk` (forward), `walkb` (backward), `sleft`, `sright`, `run`, `dance` — and animation switching is done by toggling each mesh's visibility (`setEnabled`), with all seven sharing one position. For NPCs, `NPCBase.setAnimation()` disposes the current mesh and re-loads the GLB via `SceneLoader.ImportMeshAsync`; in practice NPCs run a single `defaultAnimation` for their lifetime and the FSM only changes position/rotation. Character materials get post-processing in both: NPCs set `emissiveColor`/`ambientColor` to black and `needDepthPrePass = true`; the player sets `needDepthPrePass = false`.

### What was provided externally

The GLB models for Paul Denton (the seven player animation states) and the NPCs (AI-generated — see §11), `SceneLoader.ImportMeshAsync`, and `Quaternion`/`Vector3`.

### Notes

Babylon's `AnimationGroup` skeletal animation system is **not** used. `characters/npcService.js` is dead code — a REST client (`getNPC`, `createNPC`, `startConversation`, `addMessage`, `getConversationHistory`) hitting `/api/...` endpoints for a backend server that does not exist; it is imported by `NPCBase` but its methods are never called on the live dialogue path. The `initialMemories` persona field is loaded into `this.initialMemories` by every gameplay NPC but is never injected into any LLM prompt (the prompt builders in `config/llm.js` consume only `persona` and `questDetails`). `window.player` is read inside `NPCBase.updateMovement()` to face the player during conversation, but no file ever assigns `window.player`, so that branch always sleeps.

---

## 8. Dialogue & LLM integration

### What was written

`quest/chatService.js` is a complete streaming SSE client written against the browser primitives — no SDK. `streamChat()` issues a raw `fetch` POST to OpenRouter's `/chat/completions` endpoint, obtains `response.body.getReader()`, and runs a hand-written SSE line parser that splits on newlines, detects the `data: ` prefix, handles the `[DONE]` sentinel, and JSON-parses each chunk to surface tokens. Conversation history is a per-NPC `Map` keyed by NPC id, trimmed to a model-specific `max_history_length` via `history.shift()`. Prompt construction branches on `supportsSystemMessages(model)`: for models that support system messages, a system prompt is built from `SYSTEM_DIALOGUE` + `QUEST_INFO` templates; for models that do not (only Gemma), the same context is embedded into the user message via `USER_WITH_CONTEXT`. Persona and quest info (`relevantInfo`, `connections`, `playerObjectives`) are injected into every prompt. HTTP errors (401/429/402) and stream errors produce specific fallback messages; a catch-all path calls `getFallbackResponse()`. Action-text filtering (stripping `*action*` spans) is applied to the completed response in `ui/chatUI.js` via a regex.

`DialogueManager` (`quest/DialogueManager.js`) handles the E key and runs a proximity scan: it reads the player mesh via `scene.getMeshByName("PlayerCharacter")`, iterates registered NPCs, computes `Vector3.Distance`, and selects the closest NPC within its `interactionRadius` (default 3). Camera focus on the active NPC is triggered from `ui/chatUI.js` (`gameCamera.focusOnNPC` / `clearNPCFocus`), with a brief player-focus during message submission.

`config/llm.js` defines per-model parameters for **six** models (dialogue temperature 0.5–0.8, `max_tokens` 800–1200, `history_length` 4–8; resolution temperature 0.05–0.2, smaller token budgets) and the prompt templates (`SYSTEM_DIALOGUE`, `USER_WITH_CONTEXT`, `QUEST_INFO`, `EVALUATION`, `CONVERSATION_FORMAT`, `FALLBACK_RESPONSE`). `config/models.js` lists the six available models: Google Gemma 3 27B (default), Qwen 3 14B, OpenAI GPT OSS 20B, DeepSeek Chat v3, DeepSeek R1 (May), and DeepSeek R1. `supportsSystemMessages()` returns false only for Gemma.

### What was provided externally

The OpenRouter REST API and its SSE streaming protocol, the inference of all six LLM models, and the browser `fetch`/`ReadableStream`/`TextDecoder` APIs. No LLM SDK is used.

### Notes

`DialogueManager` registers NPCs and scans for them on E, but `NPCBase.interact()` drives interaction through `window.chatUI` directly — the two paths partly overlap. The README's architecture diagram lists five models; the code and `config/models.js` define six (the two `deepseek-r1` variants are distinct).

---

## 9. Quest & progression systems

### What was written

Quest conditions are hand-authored per level (e.g. `levels/singapore6/quest.js`) with a schema of `id`, `points` (integer), `condition` (a natural-language yes/no question for the LLM), `npcIds` (which NPCs the condition applies to, or `["ANY"]`), `required` (boolean, mandatory for level completion), optional `pathId`, and optional `resolvesLevel`. `ResolutionManager` (`quest/ResolutionManager.js`) filters the applicable conditions for the current NPC and completion status, then for each one calls the LLM with the `EVALUATION` prompt (instructing a one-word `yes`/`no` answer), using the model's **resolution** profile — low temperature (0.05–0.2), **non-streaming** (`stream: false`), small `max_tokens`. The answer is accepted when it includes `"yes"`. Points accumulate on completion; `checkLevelCompletion()` requires **both** `points >= threshold` **and** all `required` conditions done, after which `unlockLevelExit()` dispatches a `levelExitUnlocked` event. Singapore6 defines **five** solution paths — `blackmail`, `identity_theft`, `diversion`, `referral`, `espionage` — against a threshold of 10 points.

Progression is layered: `quest/levelProgression.js` and `config/levelOrder.js` define the canonical order (`singapore6` → `taiyong` → `nightclub` → `credits`) and a `getNextLevel()` helper. The P key in `controls.js` re-checks the resolution threshold before calling `levelProgression.goToNextLevel()`, and stops music and adds level points to the global score on success. `quest/questJournal.js` (J key) renders points/threshold and objective completion status and locks player controls while open. `quest/settingsUI.js` (O key) is a singleton that swaps the active model via radio buttons. `quest/userSettings.js` persists the selected model in **`localStorage`** (key `selectedLLM`) with a one-time migration from sessionStorage; `ResolutionManager` persists game progress in **`sessionStorage`** (key `gameProgress`), cleared on reload. A custom-event bus ties it together: `conditionCompleted`, `levelExitUnlocked`, `modelChanged`, `changeLevel`, `startGame`, `lockPlayerControls`, `stopCharacterMovement`, `toggleDebugOverlay`, and `globalPointsUpdated` are dispatched across the codebase.

### What was provided externally

OpenRouter inference for the yes/no evaluations, and the browser `localStorage`/`sessionStorage`/`CustomEvent`/`dispatchEvent`/`addEventListener` APIs.

### Notes

Two events are dead: `globalPointsUpdated` is dispatched but has no listener, and `npcInteraction` is listened for by the per-level quest scripts but never dispatched.

---

## 10. User Interface

### What was written

The entire UI is hand-rolled HTML/DOM. Every UI class builds its elements with `document.createElement` and styles them either via inline `style.cssText` (`ui/chatUI.js`, `quest/questJournal.js`, `quest/settingsUI.js`) or via Tailwind utility classes on `className` (`ui/mainMenuUI.js`, `ui/creditsUI.js`, `ui/debugUI.js`, `ui/fpsDisplay.js`). The cyberpunk visual language is consistent across all of them: the `Share Tech Mono` font (loaded from Google Fonts), an amber-on-navy palette (`#d97706`/`#fbbf24` accents on `#111827` backgrounds), with emerald success and red error colours. The custom-event bus (§9) is the communication channel between the Babylon scene and the DOM layer. UI files: `ui/chatUI.js`, `ui/mainMenuUI.js`, `ui/creditsUI.js`, `ui/debugUI.js`, `ui/fpsDisplay.js`, plus `quest/questJournal.js`, `quest/settingsUI.js`, and `ui/debugControls.js` for key handling.

### What was provided externally

The DOM/CSS APIs, Tailwind utility classes, and the `Share Tech Mono` webfont from Google Fonts.

### Notes

`@babylonjs/gui` is imported and assigned onto `window.BABYLON.GUI` but **no visible UI uses it** — all on-screen interface is plain DOM. `ui/fpsDisplay.js` registers its own `engine.runRenderLoop` callback (it only reads `engine.getFps()` and updates a text node — no rendering — but it does add a second per-frame callback alongside the main loop in `main.ts`).

---

## 11. Assets & generated content

### What was written

The author defined the JSON metadata schema that accompanies each GLB (`standardDimensions`, `rawDimensions`, `scaleFactor`, `facing`, and an unused `gridFootprint`), authored the per-level `objectMapping.js` placement tables, and selected which assets appear where. All selection, composition, and integration is the author's.

### What was provided externally

Per the README attribution, the asset pipeline is fully AI-generated:

| Asset type | Source |
|---|---|
| 3D meshes (buildings, characters, vehicles, streetlights, merlion, containership) | Trellis + Meshy AI |
| Music | Suno |
| Voice acting | ElevenLabs |
| NPC dialogue | OpenRouter LLMs (generated live at runtime) |

Additional external assets: the `Share Tech Mono` webfont (Google Fonts), the HDR `.env` environment texture (Babylon CDN), and skybox textures. The repo also contains generation-pipeline artifacts (ThinkDiffusion Flux configs, character sheets, FBX intermediates); these are sources used to produce the runtime GLBs/MP3s, not assets loaded by the game.

---

## 12. Audio

### What was written

`quest/MusicManager.js` is a singleton that manages per-level playlists with a **30-second** transition delay between tracks (`transitionDelay = 30000`) and a **2-second** fade (`fadeDuration = 2000`, applied in 20 steps of 100 ms). Playlists are defined per level — `menu` (1 track), `singapore6` (2), `nightclub` (3), `taiyong` (5), `credits` (1) — with random track selection. On level change, `_handleLevelChange()` pauses the current track, clears pending timeouts, and switches level; `controls.js` also explicitly calls `musicManager.stopAll()` before progression.

### What was provided externally

Babylon's `Sound`/audio system and the Suno-generated MP3 files.

---

## Consolidated scope matrix

| Capability | Provided by | Notes |
|---|---|---|
| WebGL rendering, scene graph, mesh primitives, materials, GLB loading, lights, cameras, post-processes, ray/picking | **Babylon.js** (`@babylonjs/core`, `@babylonjs/loaders`, `@babylonjs/materials`) | Four runtime deps |
| GUI widgets | **Babylon.js** (`@babylonjs/gui`) | Imported but unused; all UI is DOM |
| Build, bundling, HMR, styling | **npm toolchain** (Webpack, TS, Tailwind, PostCSS, loaders) | 14 devDeps |
| Pointer-lock, `fetch`, `ReadableStream`, DOM/CSS, storage, `CustomEvent` | **Browser** | |
| NPC dialogue generation, quest yes/no evaluation | **OpenRouter** (6 LLM models) | Raw HTTP + SSE, no SDK |
| 3D meshes | **Trellis + Meshy AI** | AI-generated GLBs |
| Music | **Suno** | AI-generated MP3s |
| Voice acting | **ElevenLabs** | AI-generated audio |
| Webfont | **Google Fonts** | Share Tech Mono |
| HDR env texture | **Babylon CDN** | External `.env` |
| Engine/scene bootstrap, level system, component system, light clustering, movement/camera/collision, NPC FSM, mesh-swap animation, dialogue/quest/progression logic, DOM UI, shaders, audio manager, world placement | **Author (hand-written)** | Almost everything above raw engine primitives |
