# PLAN TÉCNICO: belentani-visual-engine

## Context
- **Repo**: `belentani7/belentani-visual-engine` (por crear)
- **Stack**: Vite + Three.js r185 WebGPU/TSL + TypeScript (frontend) | FastAPI + PostgreSQL (studio backend) | Tauri v2 (desktop)
- **Deploy**: Vercel (web) + Railway (API) + GitHub Releases (desktop)
- **Commit base**: `git rev-parse HEAD` (nuevo repo)
- **Artefactos clave existentes** (reusar, no regenerar):
  - `judas-experience-web/sources/planetary/omega-living-universe.html` — Planet shader (FBM, breath, veins, aurora)
  - `judas-experience-web/sources/planetary/judas-accretion-kernel.html` — Accretion disk (GPU particles, gravity interaction)
  - `judas-experience-web/index.html` — Diamond IOR 2.417, Key PBR, Machine 432Hz shaders
  - `belentani-experience-tour` — 175 UI components (glassmorphism, neon, glass cards)
  - `nexus-os` — Browser OS shell (launcher, window manager)
  - `belentani-the-judas-experience` — FastAPI + Jinja2 + HTMX (Studio CMS base)
  - `belentani-video-forge` — FFmpeg + Three.js → MP4 export
  - `pvc-u-frontend` — Liquid glass/neon React 19 + Three.js

---

## Proposed Changes

### 1. Monorepo Structure (Turborepo + npm workspaces)
```
belentani-visual-engine/
├── packages/
│   ├── core/                 # Shared types, schemas (Zod), branded types
│   ├── generators/           # Pure TS generators (no Three.js deps)
│   ├── frontend/             # Three.js WebGPU/TSL renderer
│   ├── studio-api/           # FastAPI backend
│   └── desktop/              # Tauri v2 app
├── SPEC.md
├── PROTOCOLO-SDD-MAESTRO.md
├── turbo.json
├── package.json (workspaces)
└── tsconfig.base.json
```

### 2. Core Package — Shared Schemas & Types
**Archivos nuevos:**
- `packages/core/src/lore-schema.ts` — Zod schemas para lore JSON (entities: planet, diamond, key, machine, mirror, accretion)
- `packages/core/src/parameter-types.ts` — Branded types: `IOR`, `FrequencyHz`, `WavelengthNm`, `DistanceKm`, `TemperatureK`, `Seed`
- `packages/core/src/scene-schema.ts` — Three.js scene config schema (cameras, objects, materials, lights, animation, narrative)
- `packages/core/src/generator-types.ts` — Input/output types para cada generador
- `packages/core/src/audio-types.ts` — 432Hz synthesis params, stem metadata

**Validación:** `npm run validate:schemas` (Zod parse test)

### 3. Generators Package — Pure TS (CPU-side, deterministic)
**Generadores (cada uno en su carpeta con `Generator.ts`, `types.ts`, `index.ts`):**

| Generador | Parámetros clave (desde lore) | Output | Complejidad |
|-----------|-------------------------------|--------|-------------|
| **Planet** | `radius`, `noiseScale`, `mountainHeight`, `breathSpeed`, `veinColor`, `atmosphereDensity`, `rotationSpeed`, `biomeConfig` | `PlanetOutput { geometry, material, atmosphere }` | Alta |
| **Diamond** | `ior: 2.417`, `dispersion: 0.044`, `cutQuality`, `causticsIntensity`, `glowColor`, `facetCount` | `DiamondOutput { geometry, material, caustics }` | Alta |
| **Key** | `metalRoughness`, `scratchDensity`, `goldHue`, `ritualGlow`, `engravingDepth`, `pulseFrequency` | `KeyOutput { geometry, material }` | Media |
| **Machine** | `irisAperture`, `ringCount`, `pulseFrequency: 432Hz`, `biologicalNoise`, `metalness`, `ringPhase` | `MachineOutput { geometry, material, animation }` | Media |
| **Mirror** | `fractureLevel`, `refractionIndex`, `glitchIntensity`, `voidDepth`, `nexusConnections` | `MirrorOutput { geometry, material, portal }` | Alta |
| **Accretion** | `particleCount`, `innerRadius`, `outerRadius`, `diskHeight`, `gravityStrength`, `temperatureGradient`, `interactionRadius` | `AccretionOutput { geometry, material, physics }` | Alta |

**SceneComposer** — Combina todos los outputs → `SceneConfig` válido contra `scene-schema.ts`

**Tests:** 100% coverage en generadores (Vitest, deterministic seeds)

### 4. Frontend Package — Three.js WebGPU/TSL Renderer
**Arquitectura de render (orden de passes):**
```
RenderPipeline
├── PrePass (MRT: normalView, velocity, depth)          → GTAO, SSGI, TRAA
├── ScenePass (beauty + emissive MRT)                   → Bloom selectivo
├── VolumetricCloudsPass (VolumeNodeMaterial + 3D noise) → Clouds/atmosphere
├── PostProcessing Chain:
│   ├── GTAO (builtinAOContext, half-res, temporal)
│   ├── SSGI (screen-space GI, 2 slices, 8 steps)
│   ├── Bloom (emissive-only, threshold/strength/radius)
│   ├── Lensflare (ghosts + blur)
│   ├── TRAA (temporal anti-aliasing)
│   └── ToneMapping (ACESFilmic, exposure control)
└── Output (sRGB, colorSpace conversion)
```

**Componentes clave:**
- `RenderEngine.ts` — WebGPURenderer init, RenderPipeline, MRT config, Inspector
- `PostProcessing.ts` — Factory para bloom, GTAO, SSGI, TRAA, lensflare, anamorphic bloom
- `VolumetricClouds.ts` — VolumeNodeMaterial + 3D noise compute (WGSL) + temporal reprojection
- `Atmosphere.ts` — MetaverseSky / SebH-TSL-Sky integration (Rayleigh/Mie, sun disc, aerial perspective)
- `SceneManager.ts` — Carga `SceneConfig`, instancia objetos Three.js, dispose anterior
- `CameraController.ts` — OrbitControls + cinematic paths + floating origin (camera-relative)
- `NarrativeFlow.ts` — Camera paths, transitions, triggers, audio sync
- `Objects/*.ts` — Cada objeto: geometry + TSL material + animation loop
- `UI/*.ts` — ParameterPanel (signals), ExportPanel, LoreInput (markdown paste)

**Workers:**
- `generation.worker.ts` — Offload generadores pesados (main thread libre)
- `export.worker.ts` — GLTFExporter, USDZExporter, MP4Encoder (FFmpeg.wasm)

### 5. Studio API Package — FastAPI Backend
**Endpoints:**
```
POST   /api/lore/parse           # Markdown → structured JSON (Zod validated)
POST   /api/lore/extract         # Structured JSON → numeric params (all generators)
POST   /api/scenes               # Create scene from params
GET    /api/scenes/{id}          # Get scene config
PATCH  /api/scenes/{id}          # Update params (versioned)
POST   /api/scenes/{id}/export   # Queue export job (GLTF/USDZ/MP4/WebM)
GET    /api/exports/{jobId}      # Export status + signed URL
GET    /api/exports/{jobId}/download
WS     /ws/scenes/{id}           # Hot-reload params (sub-100ms)
```

**Servicios:**
- `LoreParser` — Markdown → entities (regex + LLM-assisted para conceptos abstractos)
- `ParameterExtractor` — Conceptos → numeric params (lookup tables + interpolation)
- `SceneGenerator` — Llama generadores TS (via Node.js child_process o WASM)
- `ExportService` — GLTFExporter, USDZ (via usdz-cli), MP4 (FFmpeg.wasm + Three.js render loop)

**Workers:** BullMQ + Redis — `generation`, `export` queues

**Auth:** JWT + OAuth (GitHub/Google) — solo para Studio CMS

### 6. Desktop Package — Tauri v2
**Comandos Tauri:**
- `generate_scene` — Llama generadores, retorna `SceneConfig`
- `export_gltf` / `export_usdz` / `export_mp4` — Exporta archivos locales
- `save_project` / `load_project` — File system access
- `open_external` — Browser para docs

**Config:** `tauri.conf.json` con `allowlist.fs`, `allowlist.shell`, `allowlist.dialog`

---

## Testing & Validation (Mapeo SPEC.md → Tests)

| Behavior Invariant (SPEC) | Test / Verificación |
|---------------------------|---------------------|
| SC-01: Parse lore < 500ms | Vitest benchmark `LoreParser.parse()` |
| SC-02: Extract params all 6 generators | Unit tests `ParameterExtractor.extract()` |
| SC-03: Generate scene < 2s | Integration test `SceneComposer.compose()` |
| SC-04: 60fps sustained | Lighthouse CI budget + Playwright `page.metrics()` |
| SC-05: Hot-reload < 100ms | Playwright WS timing |
| SC-06: GLTF export valid | `gltf-validator` + Three.js load test |
| SC-07: MP4 export plays | FFprobe duration + frame count |
| SC-08: CI quality gates pass | GitHub Actions required checks |
| SC-09: Deploy URL 200 + health | Post-deploy `curl -I` |
| SC-10: Tauri binary launches | CI artifact test (Windows/macOS/Linux) |
| SC-11: Planet "vivo" visual | Visual regression (pixelmatch 0.1%) |
| SC-12: Diamond IOR 2.417 visual | Visual regression |
| SC-13: Key PBR gold visual | Visual regression |
| SC-14: Machine 432Hz sync visual | Visual regression + audio analysis |
| SC-15: Mirror portal visual | Visual regression |

---

## Parallelization (Sub-agentes con worktrees)

| Sub-agente | Subtask | Mode | Worktree | Branch | Coordination |
|------------|---------|------|----------|--------|--------------|
| `core-schemas` | Core package: Zod schemas, branded types, scene schema | local | `../worktrees/core-schemas` | `feat/core-schemas` | Files: `packages/core/` |
| `generators` | Generators package: 6 generadores + SceneComposer | local | `../worktrees/generators` | `feat/generators` | Files: `packages/generators/` |
| `frontend-render` | Frontend: RenderEngine, PostProcessing, VolumetricClouds | local | `../worktrees/frontend-render` | `feat/frontend-render` | Files: `packages/frontend/src/render/` |
| `frontend-objects` | Frontend: Objects (Planet, Diamond, Key, Machine, Mirror, Accretion) | local | `../worktrees/frontend-objects` | `feat/frontend-objects` | Files: `packages/frontend/src/objects/` |
| `frontend-scene` | Frontend: SceneManager, CameraController, NarrativeFlow | local | `../worktrees/frontend-scene` | `feat/frontend-scene` | Files: `packages/frontend/src/scene/` |
| `frontend-ui` | Frontend: ParameterPanel, ExportPanel, LoreInput, Workers | local | `../worktrees/frontend-ui` | `feat/frontend-ui` | Files: `packages/frontend/src/ui/`, `workers/` |
| `studio-api` | Studio API: FastAPI, LoreParser, ParameterExtractor, ExportService | local | `../worktrees/studio-api` | `feat/studio-api` | Files: `packages/studio-api/` |
| `desktop-tauri` | Desktop: Tauri v2, commands, build config | local | `../worktrees/desktop-tauri` | `feat/desktop-tauri` | Files: `packages/desktop/` |
| `ci-cd` | CI/CD: GitHub Actions, Vercel, Railway, Tauri build | local | `../worktrees/ci-cd` | `feat/ci-cd` | Files: `.github/workflows/`, `turbo.json` |

**Dependency Graph:**
```
core-schemas → generators, frontend-*, studio-api, desktop-tauri
generators → frontend-objects, studio-api (SceneGenerator)
frontend-render → frontend-objects, frontend-scene, frontend-ui
studio-api → frontend-ui (WS hot-reload), frontend-objects (params)
ci-cd → all (final integration)
```

**Merge Strategy:** PR por sub-agente → `develop` → integration PR → `main`

---

## Risks & Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Three.js r185 WebGPU breaking changes | Media | Alto | Lock version `three@0.185.0`, pin `three/webgpu` import, test WebGL2 fallback |
| TSL API inestable (post-processing nodes) | Media | Alto | Usar solo nodes estables (`bloom`, `ao`, `ssgi`, `traa`, `lensflare`), evitar experimentales |
| VolumeNodeMaterial + post-processing MRT conflict | Alta | Alto | Separar en layers: clouds en render pass aparte, compose via `RenderPipeline` |
| WebGPU no disponible en Safari/Firefox | Media | Medio | WebGL2 fallback automático (detect `navigator.gpu`), degradar calidad |
| Generadores CPU bloquean main thread > 16ms | Alta | Alto | Workers obligatorios (`generation.worker.ts`, `export.worker.ts`) |
| Hot-reload WS latencia > 100ms | Baja | Medio | Optimizar payload (solo params changed), binary WS (MessagePack) |
| Export MP4 memoria/tiempo alto | Media | Medio | FFmpeg.wasm en worker, chunked encoding, progress events |
| Tauri v2 API breaking changes | Baja | Medio | Lock `@tauri-apps/api@2.0.0`, `@tauri-apps/cli@2.0.0` |
| Lore parser conceptos ambiguos | Media | Medio | Lookup tables + LLM-assisted (OpenRouter free tier) para conceptos abstractos |
| Visual regression flakiness | Media | Medio | Fixed camera angles, deterministic seeds, threshold 0.1%, retry 3x |

---

## Follow-ups (Fase 2+)
- [ ] **Multi-user Studio**: Yjs/Automerge para colaboración tiempo real
- [ ] **WebXR**: Meta Quest / Vision Pro export path
- [ ] **Mobile**: Touch controls + quality presets
- [ ] **Asset Library**: HDRIs, textures, models curados + CDN
- [ ] **Audio Engine**: 432Hz Web Audio synthesis + stem layering
- [ ] **AI-Assisted Generation**: LLM para sugerir params desde lore libre
- [ ] **Marketplace**: Community scenes, params, shaders
- [ ] **Plugin System**: Custom generators via WASM plugins