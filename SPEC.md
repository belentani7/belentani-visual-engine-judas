# SPEC: belentani-visual-engine — Lore/Code → Three.js Visual Experiences

## Objective
Motor que **parsea lore Belentani (markdown) + código** → **genera escenas Three.js procedurales** (planeta vivo, diamante IOR 2.417, llave dorada PBR, máquina orgánica, espejo/nexus/void) con **narrative flow**, **Studio CMS** para editar parámetros en tiempo real, y **exports** (GLTF/USDZ/MP4/WebM). Calidad **videojuego profesional** (60fps, WebGPU/TSL, post-processing completo).

**Usuario**: Artista/creador que escribe lore → ve experiencia visual generada → ajusta parámetros → exporta
**Éxito**: Parse lore < 500ms, generate scene < 2s, 60fps sustained, hot-reload < 100ms, exports valid

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Core** | Vite + Three.js | r185+ (WebGPU build) | Render engine |
| **Language** | TypeScript | 5.5+ | Type safety |
| **Shaders** | TSL (Three Shading Language) | Built-in | Node materials, post-processing |
| **Post-Processing** | `RenderPipeline` + `bloom` + `ao` (GTAO) + `ssgi` + `traa` | Three.js addons | Pro quality |
| **Volumetric** | `VolumeNodeMaterial` + 3D noise compute | Three.js WebGPU | Clouds, atmosphere |
| **UI Framework** | Vanilla TS + Web Components | — | Zero-deps, fast |
| **State** | Signals (preact/signals) | 2.0+ | Reactive params |
| **Backend (Studio)** | FastAPI + SQLModel + PostgreSQL | 0.115+ / 3.21+ | CMS API, auth |
| **Auth (Studio)** | JWT + OAuth (GitHub/Google) | python-jose | Solo Studio |
| **Queue** | BullMQ + Redis | 5.0+ | Heavy generation jobs |
| **Storage** | S3/Cloudflare R2 | — | Assets, exports |
| **Deploy Web** | Vercel | — | Static + Edge |
| **Deploy API** | Railway / Fly.io | — | Container |
| **Deploy Desktop** | Tauri v2 | 2.0+ | Native binaries |
| **CI/CD** | GitHub Actions | — | Lint, typecheck, test, build, deploy |

---

## Commands

```bash
# Development
npm run dev              # Vite dev server (frontend)
npm run dev:api          # FastAPI dev server (studio backend)
npm run dev:all          # Concurrently both

# Quality
npm run lint             # ESLint + Prettier
npm run typecheck        # tsc --noEmit
npm run test             # Vitest (unit) + Playwright (E2E)
npm run test:visual      # Playwright visual regression
npm run test:perf        # Lighthouse CI budgets

# Build
npm run build            # Vite production build
npm run build:api        # Docker build API
npm run build:desktop    # Tauri build (Windows/macOS/Linux)

# Deploy
npm run deploy:preview   # Vercel preview
npm run deploy:prod      # Vercel production + Railway deploy

# Studio CMS
npm run studio:dev       # Studio UI dev
npm run studio:build     # Studio production build

# Generators
npm run generate:planet  # CLI test planet generator
npm run generate:diamond # CLI test diamond generator
```

---

## Project Structure

```
belentani-visual-engine/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, typecheck, test, build, visual regression
│       ├── deploy-preview.yml  # Vercel preview on PR
│       └── deploy-prod.yml     # Vercel + Railway on main
├── .vscode/
│   └── settings.json           # Editor config
├── docs/
│   ├── architecture.md         # Technical architecture
│   ├── generators.md           # Generator APIs
│   └── lore-schema.md          # Lore JSON Schema
├── packages/
│   ├── core/                   # Shared types, schemas (Zod), branded types
│   ├── generators/             # Pure TS generators (no Three.js deps)
│   ├── frontend/               # Three.js WebGPU/TSL Renderer
│   ├── studio-api/             # FastAPI backend
│   └── desktop/                # Tauri v2 app
├── SPEC.md
├── PROTOCOLO-SDD-MAESTRO.md
├── turbo.json
├── package.json                  # Root workspace (npm workspaces)
├── tsconfig.base.json
├── .eslintrc.json
├── .prettierrc
├── vitest.config.ts
├── playwright.config.ts
├── lighthouse-budget.json
└── README.md
```

---

## Code Style

- **TypeScript**: Strict mode, no `any`, explicit returns
- **Naming**: PascalCase classes, camelCase functions/vars, UPPER_SNAKE constants
- **Three.js**: TSL node materials (`MeshPhysicalNodeMaterial`), no `ShaderMaterial` raw GLSL unless compute
- **React**: None (vanilla TS + Web Components + Signals)
- **Async**: `async/await`, no `.then()` chains
- **Errors**: Result types (`Ok<T> | Err<E>`), never throw in generators
- **Testing**: Vitest (unit), Playwright (E2E + visual regression)
- **Commits**: Conventional (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`)

**Example — Planet Generator (Pure TS, no Three.js):**
```typescript
// packages/generators/src/planet/PlanetGenerator.ts
import { SimplexNoise } from './noise';
import { BiomeMap } from './biomes';
import type { PlanetParams, PlanetOutput } from '../types';

export class PlanetGenerator {
  private noise: SimplexNoise;
  private biomes: BiomeMap;

  constructor(seed: string) {
    this.noise = new SimplexNoise(seed);
    this.biomes = new BiomeMap();
  }

  generate(params: PlanetParams): PlanetOutput {
    const { radius, noiseScale, mountainHeight, breathSpeed, veinColor } = params;
    
    // Height field (CPU for geometry, GPU for material)
    const heightField = this.computeHeightField(radius, noiseScale, mountainHeight);
    
    // Biome mapping
    const biomeMap = this.biomes.map(heightField);
    
    // Vein/glow parameters
    const veinParams = this.computeVeinParams(veinColor, breathSpeed);
    
    // Atmosphere parameters
    const atmosphere = this.computeAtmosphere(params);
    
    return {
      geometry: { radius, heightField, segments: this.calcSegments(radius) },
      material: { biomeMap, veinParams, atmosphere },
      metadata: { seed: this.noise.seed, generator: 'PlanetGenerator', version: '1.0' }
    };
  }

  private computeHeightField(radius: number, scale: number, height: number): Float32Array {
    // Simplex noise FBM on icosphere vertices
  }
}
```

**Example — Three.js TSL Planet Material:**
```typescript
// packages/frontend/src/objects/Planet.ts
import * as THREE from 'three/webgpu';
import { Fn, vec3, float, texture, positionLocal, normalLocal, mix, smoothstep, sin, time } from 'three/tsl';
import { SimplexNoise } from 'three/tsl';

export function createPlanetMaterial(params: PlanetMaterialParams): THREE.NodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.side = THREE.DoubleSide;
  
  // Vertex displacement (FBM noise)
  const pos = positionLocal;
  const noise = SimplexNoise(pos.mul(params.noiseScale).add(time.mul(params.breathSpeed)));
  const displacement = noise.mul(params.mountainHeight).add(
    sin(time.mul(params.breathSpeed).add(noise.mul(8))).mul(0.018)
  );
  material.positionNode = pos.add(normalLocal.mul(displacement));
  
  // Fragment: biome color + veins + emission
  const biomeColor = mix(params.oceanColor, params.landColor, smoothstep(0.48, 0.60, noise));
  const veins = smoothstep(0.955, 0.997, sin(noise.mul(27).add(time.mul(0.13)))).mul(
    smoothstep(0.43, 0.68, noise)
  );
  const emission = params.veinColor.mul(veins).mul(
    float(0.55).add(float(0.45).mul(sin(time.mul(2.15).add(noise.mul(18)))))
  );
  
  material.colorNode = biomeColor.add(emission);
  material.emissiveNode = emission;
  material.metalnessNode = float(0.0);
  material.roughnessNode = mix(float(0.8), float(0.3), noise);
  
  return material;
}
```

---

## Testing Strategy

| Level | Tool | Scope | Target |
|-------|------|-------|--------|
| **Unit** | Vitest | Generators (pure TS), parameter extraction, lore parsing | 100% coverage on generators |
| **Integration** | Vitest + MSW | Studio API (FastAPI), parameter versioning, export jobs | All API routes |
| **E2E** | Playwright | Frontend: load, interact, generate, export, hot-reload | Critical user flows |
| **Visual Regression** | Playwright + pixelmatch | Scene renders at fixed camera angles | Threshold 0.1% |
| **Performance** | Lighthouse CI | LCP < 2.5s, CLS < 0.1, TBT < 200ms, 60fps | Budgets enforced in CI |
| **Accessibility** | axe-core | WCAG 2.1 AA | 0 violations |
| **Shader Validation** | Custom | GLSL/WGSL syntax, performance hints | All shaders |

---

## Boundaries (Always / Ask First / Never)

### Always
- Run `npm run lint && npm run typecheck && npm run test` before commit
- Use TSL node materials over raw `ShaderMaterial` (WebGPU compat)
- Branded types for physical units: `IOR`, `FrequencyHz`, `WavelengthNm`, `DistanceKm`
- Deterministic seeds for all generators (reproducible scenes)
- Hot-reload via WebSocket for Studio param changes (< 100ms)
- Export validation: GLTF valid, USDZ valid, MP4 playable
- Commits convencionales + PR required for main

### Ask First
- Change Three.js version (r185+ lock)
- Add new generator (affects SceneComposer, schema, UI)
- Modify lore schema (breaking for existing scenes)
- Change post-processing chain (bloom → GTAO → SSGI → TRAA order)
- Add WebGPU-only feature without WebGL2 fallback
- Modify Tauri capabilities (file system, shell, etc.)

### Never
- Commit secrets, API keys, JWT secrets
- Hardcode magic numbers (use branded constants)
- Block main thread > 16ms (use workers for generation/export)
- Use `Math.random()` in generators (use seeded LCG/Simplex)
- Skip visual regression tests
- Deploy without health endpoint check
- Use `any` in TypeScript

---

## Success Criteria (EARS Notation)

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | **WHEN** user pastes lore markdown **THEN** parser returns structured JSON < 500ms | Vitest benchmark |
| SC-02 | **WHEN** structured JSON parsed **THEN** parameter extractor returns numeric params for all 6 generators | Unit tests |
| SC-03 | **WHEN** params fed to generators **THEN** scene config generated < 2s | Integration test |
| SC-04 | **WHEN** scene config loaded **THEN** Three.js renders 60fps sustained (frame < 16.67ms) | Lighthouse CI + Playwright metrics |
| SC-05 | **WHEN** user adjusts param in Studio **THEN** frontend hot-reloads < 100ms | Playwright + WS timing |
| SC-06 | **WHEN** user exports GLTF **THEN** file validates (gltf-validator) + loads in Three.js | Export test |
| SC-07 | **WHEN** user exports MP4 **THEN** video plays, duration matches, 60fps | Export test |
| SC-08 | **WHEN** CI runs **THEN** all quality gates pass (lint, typecheck, test, visual, perf, a11y) | GitHub Actions |
| SC-09 | **WHEN** deployed to Vercel **THEN** URL live 200 + health endpoint 200 | Post-deploy check |
| SC-10 | **WHEN** Tauri build runs **THEN** `.exe`/`.app`/`.AppImage` launches, renders scene | CI artifact test |
| SC-11 | **WHEN** lore references "planeta vivo" **THEN** generator produces breathing displacement + veins + aurora | Visual regression |
| SC-12 | **WHEN** lore references "diamante IOR 2.417" **THEN** material shows dispersion 0.044 + caustics | Visual regression |
| SC-13 | **WHEN** lore references "llave dorada PBR" **THEN** material shows gold clearcoat + micro-scratches + pulse | Visual regression |
| SC-14 | **WHEN** lore references "máquina orgánica 432Hz" **THEN** iris aperture + ring pulse sync at 432Hz | Visual regression |
| SC-15 | **WHEN** lore references "espejo/nexus/void" **THEN** portal shader + glitch + refraction | Visual regression |

---

## Open Questions

- [ ] **WebGPU fallback**: Full WebGL2 fallback for all TSL effects? (Bloom, GTAO, SSGI have WebGL2 equivalents)
- [ ] **Audio**: 432Hz synthesis via Web Audio API vs pre-rendered stems?
- [ ] **Multi-user Studio**: Real-time collaboration (Yjs/Automerge) or single-user?
- [ ] **Asset Library**: Curated HDRIs, textures, models bundled or fetched?
- [ ] **Mobile**: Touch controls + reduced quality preset for < 30fps devices?
- [ ] **WebXR**: VR/AR export path for Meta Quest / Vision Pro?

---

## Constitution-Grade Checklist (P1-P5)

| Principle | Verification | Status |
|-----------|--------------|--------|
| **P1 ISTQB-FIRST** | Spec includes: equivalence partitions (lore concepts), boundary values (params min/max), decision table (generator combos), state machine (load→parse→generate→render→export) | ✅ |
| **P2 ZERO HAPPY-PATH** | 4 categories: válido (lore completo), límite (params extremos), inválido (lore malformed), error sistema (OOM, GPU crash) | ✅ |
| **P3 STATES EXPLICIT** | Estados: `idle` → `parsing` → `generating` → `rendering` → `exporting` \| `error` (parse fail, gen fail, export fail) \| `cancelled`. Transiciones prohibidas: `rendering→parsing`, `exporting→generating` sin cancel | ✅ |
| **P4 ERROR LEAKAGE** | Usuario ve: "Error generando planeta" (genérico). Logs internos: stack trace, params, seed, GPU memory | ✅ |
| **P5 GATEKEEPING** | Spec aprobada antes de código; checklist constitution-grade firmada antes de deploy | ✅ |

---

**SPEC APROBADA** — Proceder a E2 PLAN (`tasks/plan.md`)