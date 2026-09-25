# TASK LIST: belentani-visual-engine

## Phase 0: Repository Setup (PR #1)

- [ ] **Task**: Inicializar monorepo con Turborepo + npm workspaces
  - Acceptance: `turbo run build` ejecuta sin errores en root
  - Verify: `cat turbo.json` + `cat package.json` muestran workspaces
  - Files: `package.json`, `turbo.json`, `tsconfig.base.json`, `.eslintrc.json`, `.prettierrc`

- [ ] **Task**: Configurar GitHub repo `belentani7/belentani-visual-engine` (privado)
  - Acceptance: `git remote -v` muestra origin → GitHub
  - Verify: `git push -u origin main` exit 0
  - Files: `.git/`, `.gitignore`

- [ ] **Task**: Configurar branch protection + required status checks (ci)
  - Acceptance: GitHub Branch Protection activada
  - Verify: Settings → Branches → main protegida
  - Files: Ninguno (GitHub UI)

- [ ] **Task**: Commit inicial convencional
  - Acceptance: Mensaje `chore: initial monorepo setup - Turborepo + workspaces`
  - Verify: `git log --oneline -1` muestra commit convencional
  - Files: All project files

## Phase 1: Core Package — Shared Schemas (PR #2)

- [ ] **Task**: Crear `packages/core` con package.json + tsconfig
  - Acceptance: `npm run build` en core compila sin errores
  - Verify: `dist/` generado con types
  - Files: `packages/core/package.json`, `packages/core/tsconfig.json`

- [ ] **Task**: Implementar `lore-schema.ts` (Zod schemas para lore JSON)
  - Acceptance: Schemas para Planet, Diamond, Key, Machine, Mirror, Accretion, SceneConfig
  - Verify: `npm run test` en core pasa (Zod parse tests)
  - Files: `packages/core/src/lore-schema.ts`

- [ ] **Task**: Implementar `parameter-types.ts` (Branded types físicos)
  - Acceptance: Types `IOR`, `FrequencyHz`, `WavelengthNm`, `DistanceKm`, `TemperatureK`, `Seed`
  - Verify: TypeScript compile sin `any`, branded type tests pasan
  - Files: `packages/core/src/parameter-types.ts`

- [ ] **Task**: Implementar `scene-schema.ts` (Three.js scene config schema)
  - Acceptance: Schema valida cameras, objects, materials, lights, animation, narrative
  - Verify: Zod parse test con scene config válido/inválido
  - Files: `packages/core/src/scene-schema.ts`

- [ ] **Task**: Implementar `generator-types.ts` (Input/output cada generador)
  - Acceptance: Types `PlanetParams`, `PlanetOutput`, `DiamondParams`, etc.
  - Verify: Import works en generators package
  - Files: `packages/core/src/generator-types.ts`

- [ ] **Task**: Tests unitarios core (Vitest)
  - Acceptance: 100% coverage en schemas, branded types
  - Verify: `npm run test` en core → 100%
  - Files: `packages/core/src/**/*.test.ts`

## Phase 2: Generators Package — Pure TS (PR #3)

- [ ] **Task**: Crear `packages/generators` con package.json + tsconfig
  - Acceptance: Build pasa, exporta types
  - Verify: `npm run build` en generators
  - Files: `packages/generators/package.json`, `packages/generators/tsconfig.json`

- [ ] **Task**: Implementar `noise.ts` (Simplex/FBM noise determinístico)
  - Acceptance: `SimplexNoise(seed)` reproducible, `fbm(p, octaves)` funciona
  - Verify: Tests con seeds conocidos → outputs exactos
  - Files: `packages/generators/src/noise.ts`

- [ ] **Task**: Implementar `biomes.ts` (Biome mapping por height/moisture)
  - Acceptance: `BiomeMap.map(heightField)` retorna biome por vértice
  - Verify: Tests con height fields conocidos
  - Files: `packages/generators/src/biomes.ts`

- [ ] **Task**: Implementar `PlanetGenerator.ts`
  - Acceptance: `generate(PlanetParams)` → `PlanetOutput { geometry, material, atmosphere }`
  - Verify: Tests con params lore (radius, noiseScale, breathSpeed, veinColor)
  - Files: `packages/generators/src/planet/PlanetGenerator.ts`

- [ ] **Task**: Implementar `DiamondGenerator.ts` (IOR 2.417, dispersion 0.044)
  - Acceptance: `generate(DiamondParams)` → `DiamondOutput { geometry, material, caustics }`
  - Verify: Tests validan IOR/dispersion exactos
  - Files: `packages/generators/src/diamond/DiamondGenerator.ts`

- [ ] **Task**: Implementar `KeyGenerator.ts` (Gold PBR, micro-scratches, pulse)
  - Acceptance: `generate(KeyParams)` → `KeyOutput { geometry, material }`
  - Verify: Tests con goldHue, scratchDensity, ritualGlow
  - Files: `packages/generators/src/key/KeyGenerator.ts`

- [ ] **Task**: Implementar `MachineGenerator.ts` (432Hz pulse, iris, rings)
  - Acceptance: `generate(MachineParams)` → `MachineOutput { geometry, material, animation }`
  - Verify: Tests validan pulseFrequency = 432Hz exacto
  - Files: `packages/generators/src/machine/MachineGenerator.ts`

- [ ] **Task**: Implementar `MirrorGenerator.ts` (Portal, glitch, refraction)
  - Acceptance: `generate(MirrorParams)` → `MirrorOutput { geometry, material, portal }`
  - Verify: Tests con fractureLevel, glitchIntensity, voidDepth
  - Files: `packages/generators/src/mirror/MirrorGenerator.ts`

- [ ] **Task**: Implementar `AccretionGenerator.ts` (GPU particles, gravity)
  - Acceptance: `generate(AccretionParams)` → `AccretionOutput { geometry, material, physics }`
  - Verify: Tests con particleCount, gravityStrength, temperatureGradient
  - Files: `packages/generators/src/accretion/AccretionGenerator.ts`

- [ ] **Task**: Implementar `SceneComposer.ts` (Combina todos → SceneConfig)
  - Acceptance: `compose(allOutputs)` → valida contra `scene-schema.ts`
  - Verify: Integration test con outputs de todos generadores
  - Files: `packages/generators/src/SceneComposer.ts`

- [ ] **Task**: Tests unitarios generators (100% coverage)
  - Acceptance: `npm run test` en generators → 100% coverage
  - Verify: Vitest report
  - Files: `packages/generators/src/**/*.test.ts`

## Phase 3: Frontend — Render Engine (PR #4)

- [ ] **Task**: Crear `packages/frontend` con Vite + Three.js r185 WebGPU
  - Acceptance: `npm run dev` levanta servidor, Three.js carga
  - Verify: Browser muestra canvas WebGPU
  - Files: `packages/frontend/package.json`, `packages/frontend/vite.config.ts`

- [ ] **Task**: Implementar `RenderEngine.ts` (WebGPURenderer + RenderPipeline + MRT)
  - Acceptance: RenderPipeline con prePass (normal, velocity, depth) + scenePass (beauty, emissive)
  - Verify: Inspector muestra passes, MRT configurado
  - Files: `packages/frontend/src/render/RenderEngine.ts`

- [ ] **Task**: Implementar `PostProcessing.ts` (Bloom, GTAO, SSGI, TRAA, Lensflare)
  - Acceptance: Chain: GTAO(half-res,temporal) → SSGI(2slices,8steps) → Bloom(emissive) → Lensflare → TRAA
  - Verify: Cada pass activable/desactivable via UI, Inspector muestra output
  - Files: `packages/frontend/src/render/PostProcessing.ts`

- [ ] **Task**: Implementar `VolumetricClouds.ts` (VolumeNodeMaterial + 3D noise compute)
  - Acceptance: Clouds renderizadas, animadas (wind), temporal reprojection
  - Verify: WebGPU detectado → clouds, WebGL2 → fallback mesh/billboard
  - Files: `packages/frontend/src/render/VolumetricClouds.ts`

- [ ] **Task**: Implementar `Atmosphere.ts` (MetaverseSky / SebH-TSL-Sky)
  - Acceptance: Rayleigh/Mie scattering, sun disc, aerial perspective haze
  - Verify: Time-of-day changes, sun position correcta
  - Files: `packages/frontend/src/render/Atmosphere.ts`

## Phase 4: Frontend — Objects (PR #5)

- [ ] **Task**: Implementar `Planet.ts` (TSL material: displacement FBM, veins, aurora, breath)
  - Acceptance: Material usa `positionNode` (vertex displacement) + `colorNode`/`emissiveNode` (fragment)
  - Verify: Visual regression test (pixelmatch 0.1%) contra reference
  - Files: `packages/frontend/src/objects/Planet.ts`

- [ ] **Task**: Implementar `Diamond.ts` (TSL material: transmission, dispersion, caustics)
  - Acceptance: `MeshPhysicalNodeMaterial` con `dispersion: 0.044`, `ior: 2.417`, caustics via `Caustics` node
  - Verify: Visual regression + dispersion visible en bordes
  - Files: `packages/frontend/src/objects/Diamond.ts`

- [ ] **Task**: Implementar `Key.ts` (TSL material: gold clearcoat, micro-scratches, pulse)
  - Acceptance: `clearcoat: 1.0`, `clearcoatRoughness` procedural, `emissive` pulse 432Hz
  - Verify: Visual regression + pulse sync
  - Files: `packages/frontend/src/objects/Key.ts`

- [ ] **Task**: Implementar `Machine.ts` (TSL material: iris aperture, rings, 432Hz pulse)
  - Acceptance: Morph targets iris, instanced rings, pulse uniform 432Hz
  - Verify: Visual regression + animation sync
  - Files: `packages/frontend/src/objects/Machine.ts`

- [ ] **Task**: Implementar `Mirror.ts` (Portal shader, glitch, refraction)
  - Acceptance: `RenderTarget` reflection + `GlitchPass` + portal stencil
  - Verify: Visual regression
  - Files: `packages/frontend/src/objects/Mirror.ts`

- [ ] **Task**: Implementar `AccretionDisk.ts` (GPU particles, gravity interaction)
  - Acceptance: `Points` + `ShaderMaterial` con gravity uniform, mouse interaction
  - Verify: Visual regression + interaction test
  - Files: `packages/frontend/src/objects/AccretionDisk.ts`

## Phase 5: Frontend — Scene & Narrative (PR #6)

- [ ] **Task**: Implementar `SceneManager.ts` (Load SceneConfig → instantiate Three.js objects)
  - Acceptance: `load(config)` crea objetos, `dispose()` limpia memoria
  - Verify: Memory leak test (heap snapshot before/after 10 loads)
  - Files: `packages/frontend/src/scene/SceneManager.ts`

- [ ] **Task**: Implementar `CameraController.ts` (Orbit + cinematic + floating origin)
  - Acceptance: `setMode('orbit'|'cinematic'|'free')`, floating origin para large worlds
  - Verify: Playwright test camera transitions
  - Files: `packages/frontend/src/scene/CameraController.ts`

- [ ] **Task**: Implementar `NarrativeFlow.ts` (Camera paths, triggers, audio sync)
  - Acceptance: `start()` → sequence de camera moves + param changes + audio cues
  - Verify: Playwright test narrative sequence
  - Files: `packages/frontend/src/scene/NarrativeFlow.ts`

## Phase 6: Frontend — UI & Workers (PR #7)

- [ ] **Task**: Implementar `ParameterPanel.ts` (Signals-based real-time editing)
  - Acceptance: Cambio param → WS send < 100ms → hot-reload frontend
  - Verify: Playwright test param change → render update
  - Files: `packages/frontend/src/ui/ParameterPanel.ts`

- [ ] **Task**: Implementar `ExportPanel.ts` (GLTF/USDZ/MP4/WebM export)
  - Acceptance: Botones export → worker → download file válido
  - Verify: Export test cada formato
  - Files: `packages/frontend/src/ui/ExportPanel.ts`

- [ ] **Task**: Implementar `LoreInput.ts` (Markdown paste → parse → preview)
  - Acceptance: Textarea + "Parse" → llama API → muestra structured JSON + preview params
  - Verify: Integration test con studio-api
  - Files: `packages/frontend/src/ui/LoreInput.ts`

- [ ] **Task**: Implementar `generation.worker.ts` (Offload generadores)
  - Acceptance: `worker.postMessage({type:'generate', params})` → `postMessage({type:'result', config})`
  - Verify: Main thread no bloquea > 16ms durante generación
  - Files: `packages/frontend/src/workers/generation.worker.ts`

- [ ] **Task**: Implementar `export.worker.ts` (GLTF/USDZ/MP4 encoding)
  - Acceptance: GLTFExporter, USDZExporter (usdz-cli), MP4 (FFmpeg.wasm)
  - Verify: Export test cada formato en worker
  - Files: `packages/frontend/src/workers/export.worker.ts`

## Phase 7: Studio API — FastAPI Backend (PR #8)

- [ ] **Task**: Crear `packages/studio-api` con FastAPI + SQLModel + PostgreSQL
  - Acceptance: `uvicorn main:app --reload` levanta, `/docs` accesible
  - Verify: `npm run dev:api` funciona
  - Files: `packages/studio-api/pyproject.toml`, `packages/studio-api/src/main.py`

- [ ] **Task**: Implementar modelos SQLModel (Scene, Parameter, Export, User)
  - Acceptance: Alembic migration genera tablas, relationships correctas
  - Verify: `alembic upgrade head` + `pytest` models
  - Files: `packages/studio-api/src/models/*.py`

- [ ] **Task**: Implementar `LoreParser` (Markdown → structured JSON)
  - Acceptance: `parse(loreMarkdown)` → `LoreEntities` (Zod validated)
  - Verify: Tests con lore samples (planet, diamond, key, machine, mirror)
  - Files: `packages/studio-api/src/services/lore_parser.py`

- [ ] **Task**: Implementar `ParameterExtractor` (Conceptos → numeric params)
  - Acceptance: `extract(entities)` → `GeneratorParams` (todos 6 generadores)
  - Verify: Tests con entities conocidos → params exactos
  - Files: `packages/studio-api/src/services/parameter_extractor.py`

- [ ] **Task**: Implementar endpoints API (parse, extract, scenes CRUD, exports, WS)
  - Acceptance: Todos endpoints responden 200/400/401 correctos, OpenAPI docs
  - Verify: `pytest` API tests + manual `curl`
  - Files: `packages/studio-api/src/api/routes/*.py`

- [ ] **Task**: Implementar BullMQ workers (generation, export queues)
  - Acceptance: Job enqueued → worker procesa → resultado en DB + signed URL
  - Verify: Integration test full pipeline
  - Files: `packages/studio-api/src/workers/generation_worker.py`, `export_worker.py`

- [ ] **Task**: Auth JWT + OAuth (GitHub/Google) — solo Studio
  - Acceptance: Login → JWT → `/api/scenes` protegido, OAuth flow funciona
  - Verify: `pytest` auth tests
  - Files: `packages/studio-api/src/core/security.py`

## Phase 8: Desktop — Tauri v2 (PR #9)

- [ ] **Task**: Crear `packages/desktop` con Tauri v2 + Rust
  - Acceptance: `cargo tauri dev` levanta app nativa
  - Verify: Ventana nativa abre, muestra frontend
  - Files: `packages/desktop/Cargo.toml`, `packages/desktop/tauri.conf.json`

- [ ] **Task**: Implementar comandos Tauri (generate, export, save/load project)
  - Acceptance: `invoke('generate_scene')` → llama generadores TS (via Node.js sidecar)
  - Verify: App genera escena, exporta GLTF local
  - Files: `packages/desktop/src/commands.rs`

- [ ] **Task**: Configurar build multiplataforma (Windows .exe, macOS .app, Linux AppImage)
  - Acceptance: `cargo tauri build` genera binarios 3 plataformas
  - Verify: CI artifacts subidos a GitHub Releases
  - Files: `.github/workflows/tauri-build.yml`

## Phase 9: CI/CD + Deploy (PR #10)

- [ ] **Task**: GitHub Actions CI (lint, typecheck, test, build, visual, perf, a11y)
  - Acceptance: PR → todos checks pasan, required status checks
  - Verify: PR de prueba pasa completo
  - Files: `.github/workflows/ci.yml`

- [ ] **Task**: Deploy Preview (Vercel en PR)
  - Acceptance: PR → comment con preview URL
  - Verify: Preview URL accesible
  - Files: `.github/workflows/deploy-preview.yml`

- [ ] **Task**: Deploy Production (Vercel + Railway en merge main)
  - Acceptance: Push main → Vercel prod + Railway deploy → URLs vivas
  - Verify: `curl -I` ambas URLs → 200
  - Files: `.github/workflows/deploy-prod.yml`

- [ ] **Task**: Tauri build + GitHub Release (tags v*)
  - Acceptance: Tag `v1.0.0` → Release con 3 binarios + changelog
  - Verify: Release page muestra assets
  - Files: `.github/workflows/tauri-release.yml`

## Phase 10: Final Verification & Ship (PR #11 - merge to main)

- [ ] **Task**: Auditoría producción completa (30 criterios Level 2)
  - Acceptance: `python tools/audit-production-readiness.py --repo . --level 2` → 30/30 ✅
  - Verify: Script output
  - Files: `tools/audit-production-readiness.py`

- [ ] **Task**: Spec-code convergence validation
  - Acceptance: `python tools/check-spec-convergence.py --spec SPEC.md --diff HEAD~1..HEAD` → 0 drift
  - Verify: Script output
  - Files: `tools/check-spec-convergence.py`

- [ ] **Task**: Visual regression suite completa (todos generadores)
  - Acceptance: Playwright visual tests pasan (threshold 0.1%)
  - Verify: CI artifacts muestran screenshots
  - Files: `playwright.config.ts`, `e2e/visual/*.spec.ts`

- [ ] **Task**: Performance budgets (LCP<2.5s, CLS<0.1, TBT<200ms, 60fps)
  - Acceptance: Lighthouse CI budgets pasan
  - Verify: Lighthouse report en CI
  - Files: `lighthouse-budget.json`

- [ ] **Task**: Accessibility audit (axe-core WCAG 2.1 AA)
  - Acceptance: 0 violations en CI
  - Verify: axe-results artifact
  - Files: `e2e/a11y.spec.ts`

- [ ] **Task**: Merge a main + tag `v1.0.0` + GitHub Release
  - Acceptance: PR aprobado, mergeado, tag pushed, release creada
  - Verify: GitHub releases muestra v1.0.0 con binarios
  - Files: Git tags

- [ ] **Task**: Verificación post-deploy final (URLs vivas, health, exports)
  - Acceptance: Web URL 200, API health 200, export GLTF/MP4 funcionan
  - Verify: Checklist manual
  - Files: Ninguno (runtime)

---

## Estado Actual
- **Proyecto**: belentani-visual-engine
- **Fase actual**: E3 TASKS (esta lista)
- **Próximo gate**: Human aprueba task list → E4 IMPLEMENT
- **Repositorio destino**: `github.com/belentani7/belentani-visual-engine`
- **Deploy targets**: Vercel (web) + Railway (API) + GitHub Releases (desktop)