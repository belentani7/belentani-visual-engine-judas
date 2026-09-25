# Belentani Visual Engine

> **Lore/Code → Three.js Procedural Visual Experiences**
> 
> Motor que parsea lore Belentani (markdown) + código → genera escenas Three.js procedurales de calidad videojuego profesional: planeta vivo, diamante IOR 2.417, llave dorada PBR, máquina orgánica 432Hz, espejo/nexus/void, disco de acreción.

[![CI](https://github.com/belentani7/belentani-visual-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/belentani7/belentani-visual-engine/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Railway%20%2B%20Tauri-000?logo=vercel)](https://belentani-visual-engine.vercel.app)
[![Spec-Driven](https://img.shields.io/badge/SDD-Spec%20Driven-purple)](SPEC.md)
[![Three.js](https://img.shields.io/badge/Three.js-r185%20WebGPU-black?logo=three.js)](https://threejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌐 Live Demo

| Platform | URL | Status |
|----------|-----|--------|
| **Web (Vercel)** | https://belentani-visual-engine.vercel.app | ![Vercel](https://img.shields.io/badge/Production-Ready-brightgreen) |
| **Studio API (Railway)** | https://belentani-visual-engine-api.railway.app/docs | ![Railway](https://img.shields.io/badge/API-Live-brightgreen) |
| **Desktop (GitHub Releases)** | [Latest Release](https://github.com/belentani7/belentani-visual-engine/releases/latest) | ![Tauri](https://img.shields.io/badge/Tauri-v2-blue) |

---

## 📋 Especificación (SDD)

Este proyecto sigue **Spec-Driven Development (SDD)** con protocolo maestro E0-E7:

- 📄 **[SPEC.md](SPEC.md)** — Especificación completa con success criteria (EARS notation)
- 📋 **[tasks/plan.md](tasks/plan.md)** — Plan técnico con arquitectura, riesgos, parallelización
- ✅ **[tasks/todo.md](tasks/todo.md)** — Task list atómica con acceptance criteria
- 🏛️ **[PROTOCOLO-SDD-MAESTRO.md](PROTOCOLO-SDD-MAESTRO.md)** — Protocolo completo E0-E7 + Constitution

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/belentani7/belentani-visual-engine.git
cd belentani-visual-engine

# Install dependencies (npm workspaces + Turborepo)
npm ci

# Development servers
npm run dev:all    # Frontend (Vite) + Studio API (FastAPI) concurrent

# Or separately:
npm run dev        # Frontend only (http://localhost:3000)
npm run dev:api    # Studio API only (http://localhost:8000/docs)

# Quality checks
npm run lint
npm run typecheck
npm run test
npm run test:visual
npm run test:perf

# Spec-Driven Development
npm run validate:spec          # Validar SPEC.md
npm run validate:shaders       # Validar shaders GLSL/WGSL
npm run validate:convergence   # Spec-code convergence

# Production audit
npm run audit                  # 30-criteria Level 2 checklist

# Build
npm run build                  # All packages
npm run build:desktop          # Tauri binaries (Windows/macOS/Linux)

# Deploy
npm run deploy:preview         # Vercel Preview (PRs)
npm run deploy:prod            # Vercel Production + Railway (main branch)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Core** | Vite + Three.js r185 WebGPU/TSL | Render engine |
| **Language** | TypeScript 5.5+ (strict) | Type safety |
| **Shaders** | TSL (Three Shading Language) | Node materials, post-processing |
| **Post-Processing** | `RenderPipeline` + Bloom + GTAO + SSGI + TRAA + Lensflare | Pro quality |
| **Volumetric** | `VolumeNodeMaterial` + 3D noise compute (WGSL) | Clouds, atmosphere |
| **State** | Signals (preact/signals) | Reactive params |
| **Backend** | FastAPI + SQLModel + PostgreSQL | Studio CMS API |
| **Auth** | JWT + OAuth (GitHub/Google) | Studio only |
| **Queue** | BullMQ + Redis | Heavy generation jobs |
| **Storage** | Cloudflare R2 / S3 | Assets, exports |
| **Deploy Web** | Vercel (Static + Edge) | Global CDN |
| **Deploy API** | Railway / Fly.io | Container |
| **Deploy Desktop** | Tauri v2 | Native binaries |
| **CI/CD** | GitHub Actions + Turborepo | Monorepo pipeline |

---

## 📁 Monorepo Structure

```
belentani-visual-engine/
├── .github/workflows/          # CI/CD pipelines
├── packages/
│   ├── core/                   # Shared types, Zod schemas, branded types
│   ├── generators/             # Pure TS procedural generators (CPU)
│   ├── frontend/               # Three.js WebGPU/TSL Renderer
│   ├── studio-api/             # FastAPI Backend (Studio CMS)
│   └── desktop/                # Tauri v2 Desktop App
├── tools/                      # Validation & audit scripts
├── SPEC.md                     # Spec SDD
├── PROTOCOLO-SDD-MAESTRO.md    # Protocolo maestro
├── turbo.json                  # Turborepo config
└── package.json                # Root workspace
```

---

## ✨ Generadores Procedurales

| Generador | Parámetros Clave | Técnica |
|-----------|------------------|---------|
| **Planet** | radius, noiseScale, mountainHeight, breathSpeed, veinColor, atmosphereDensity, biomes | Simplex FBM (CPU geometry) + TSL displacement (GPU material) |
| **Diamond** | ior: 2.417, dispersion: 0.044, caustics, cutQuality | MeshPhysicalNodeMaterial + transmission + dispersion + Caustics node |
| **Key** | goldHue, scratchDensity, ritualGlow, pulseFrequency | Clearcoat + procedural normalMap + emissive pulse |
| **Machine** | irisAperture, ringCount, pulseFrequency: 432Hz, biologicalNoise | Morph targets (iris) + InstancedMesh (rings) + 432Hz uniform |
| **Mirror** | fractureLevel, refractionIndex, glitchIntensity, voidDepth | RenderTarget reflection + GlitchPass + portal stencil |
| **Accretion** | particleCount, gravityStrength, temperatureGradient, interactionRadius | GPU Points + ShaderMaterial + gravity uniform |

---

## 🎬 Render Pipeline (WebGPU/TSL)

```
RenderPipeline
├── PrePass (MRT: normalView, velocity, depth)     → GTAO, SSGI, TRAA
├── ScenePass (beauty + emissive MRT)              → Selective Bloom
├── VolumetricCloudsPass (VolumeNodeMaterial)      → Clouds/Atmosphere
├── PostProcessing Chain:
│   ├── GTAO (half-res, temporal filtering)
│   ├── SSGI (2 slices, 8 steps)
│   ├── Bloom (emissive-only, threshold/strength/radius)
│   ├── Lensflare (ghosts + gaussian blur)
│   ├── TRAA (temporal anti-aliasing)
│   └── ToneMapping (ACESFilmic, exposure control)
└── Output (sRGB, colorSpace conversion)
```

**Fallback WebGL2**: Bloom, GTAO, SSGI tienen equivalentes WebGL2; Volumetric clouds → mesh cluster fallback.

---

## 🎯 Success Criteria (EARS)

| ID | Criterion | Target | Verification |
|----|-----------|--------|--------------|
| SC-01 | Parse lore markdown → JSON | < 500ms | Vitest benchmark |
| SC-02 | Extract params (6 generators) | All numeric | Unit tests |
| SC-03 | Generate scene config | < 2s | Integration test |
| SC-04 | Render 60fps sustained | frame < 16.67ms | Lighthouse CI + Playwright |
| SC-05 | Hot-reload param change | < 100ms | Playwright WS timing |
| SC-06 | Export GLTF valid | gltf-validator | Export test |
| SC-07 | Export MP4 plays | duration + 60fps | Export test |
| SC-08 | CI quality gates pass | All green | GitHub Actions |
| SC-09 | Deploy URL 200 + health | curl -I | Post-deploy check |
| SC-10 | Tauri binary launches | Windows/macOS/Linux | CI artifact test |

---

## 🏛️ Constitution (Immutable)

| Principle | Description |
|-----------|-------------|
| **P1 ISTQB-FIRST** | 4 técnicas: equivalence, boundary, decision table, state machine |
| **P2 ZERO HAPPY-PATH** | 4 categorías: válido, límite, inválido, error sistema |
| **P3 STATES EXPLICIT** | `idle` → `parsing` → `generating` → `rendering` → `exporting` \| `error` \| `cancelled` |
| **P4 ERROR LEAKAGE** | Usuario: genérico. Logs: stack, params, seed, GPU memory |
| **P5 GATEKEEPING** | Spec aprobada antes de código; checklist antes de deploy |

---

## 🌍 Idiomas (PT > ES > EN > CA)

Orden fijo en todo contenido multilingüe: `["pt", "es", "en", "ca"]`

- Meta tags Open Graph/Twitter en 4 idiomas
- Lore texts preparados para i18n
- Interface respeta `Accept-Language` header

---

## 🤝 Contribuyendo

1. Fork → Feature branch (`feat/nueva-funcionalidad`)
2. **Escribe/actualiza `SPEC.md` primero** (SDD)
3. Implementa siguiendo `tasks/todo.md`
4. `npm run audit` debe pasar (Level 2)
5. PR → CI pasa → Deploy preview → Review → Merge → Auto-deploy production

---

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE)

---

## 🔗 Links Relacionados

- **Protocolo SDD Maestro:** [PROTOCOLO-SDD-MAESTRO.md](PROTOCOLO-SDD-MAESTRO.md)
- **Workspace Belentani:** https://github.com/belentani7/belentani-workspace
- **Judas Experience:** https://github.com/belentani7/judas-experience-web
- **Secure T University:** https://github.com/belentani7/secure-t-university
- **Belentani Unified:** https://github.com/belentani7/belentani-unified-master

---

*Generado siguiendo Protocolo SDD E0→E7 • Deploy verificado en producción • Spec-code convergence validada • Constitution-grade checklist firmada*