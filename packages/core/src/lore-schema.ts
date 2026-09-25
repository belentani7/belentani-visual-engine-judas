/**
 * Lore Schema - Zod Schemas for Belentani Lore Entities
 *
 * Define la estructura de datos que el Lore Parser extrae del markdown.
 * Cada entidad corresponde a un generador procedural.
 *
 * NOTA: Scene composition schemas (Camera, Light, PostProcess, Narrative, SceneConfig)
 * están en scene-schema.ts para evitar duplicados.
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/** Coordenadas 3D */
export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/** Color RGB normalizado 0-1 */
export const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

/** Rango numérico con min/max */
export const RangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

/** Configuración de ruido procedural */
export const NoiseConfigSchema = z.object({
  seed: z.union([z.string(), z.number()]),
  scale: z.number().positive(),
  octaves: z.number().int().min(1).max(8).default(5),
  persistence: z.number().min(0).max(1).default(0.5),
  lacunarity: z.number().min(1).max(4).default(2.0),
  offset: Vector3Schema.optional(),
});

// Helper para power of two validation
const powerOfTwoSchema = z
  .number()
  .int()
  .positive()
  .refine((n) => (n & (n - 1)) === 0, { message: 'Must be a power of two' });

// ============================================================================
// Planet Entity
// ============================================================================

/** Configuración de biomas */
export const BiomeConfigSchema = z.object({
  name: z.string(),
  heightRange: RangeSchema,
  moistureRange: RangeSchema,
  temperatureRange: RangeSchema,
  color: ColorSchema,
  vegetationDensity: z.number().min(0).max(1).default(0),
  metadata: z.record(z.unknown()).optional(),
});

/** Configuración de atmósfera */
export const AtmosphereConfigSchema = z.object({
  enabled: z.boolean().default(true),
  density: z.number().min(0).max(1).default(0.3),
  rayleighCoefficient: z.number().positive().default(2.5),
  mieCoefficient: z.number().positive().default(0.1),
  sunIntensity: z.number().positive().default(1.0),
  groundAlbedo: ColorSchema.default({ r: 0.3, g: 0.3, b: 0.3 }),
  clouds: z
    .object({
      enabled: z.boolean().default(true),
      coverage: z.number().min(0).max(1).default(0.4),
      height: z.number().positive().default(10),
      density: z.number().min(0).max(1).default(0.5),
    })
    .optional(),
});

/** Parámetros de entrada para generador de planeta */
export const PlanetParamsSchema = z.object({
  // Geometría base
  radius: z.number().positive().default(1.56),
  segments: z.number().int().min(3).max(8).default(6),

  // Ruido de terreno
  noise: NoiseConfigSchema.extend({
    scale: z.number().positive().default(3.4),
  }),

  // Desplazamiento
  mountainHeight: z.number().min(0).max(1).default(0.16),
  detailScale: z.number().positive().default(18.0),
  detailStrength: z.number().min(0).max(1).default(0.028),

  // Respiración (animación)
  breathSpeed: z.number().positive().default(1.35),
  breathAmplitude: z.number().min(0).max(0.1).default(0.018),

  // Venas/brillo
  veinColor: ColorSchema.default({ r: 1.0, g: 0.0, b: 0.236 }),
  veinHotColor: ColorSchema.default({ r: 1.0, g: 0.157, b: 0.561 }),
  veinThreshold: z.number().min(0).max(1).default(0.955),
  veinMicroThreshold: z.number().min(0).max(1).default(0.82),

  // Colores base
  oceanColor: ColorSchema.default({ r: 0.004, g: 0.027, b: 0.055 }),
  landColor: ColorSchema.default({ r: 0.031, g: 0.047, b: 0.055 }),

  // Aurora polar
  auroraEnabled: z.boolean().default(true),
  auroraColor: ColorSchema.default({ r: 0.392, g: 0.973, b: 1.0 }),
  auroraIntensity: z.number().min(0).max(1).default(0.32),

  // Atmósfera
  atmosphere: AtmosphereConfigSchema.optional(),

  // Biomas
  biomes: z.array(BiomeConfigSchema).optional(),

  // Rotación
  rotationSpeed: z.number().default(0.026),
  axialTilt: z.number().default(0.41),

  // Semilla para reproducibilidad
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de planeta */
export const PlanetOutputSchema = z.object({
  geometry: z.object({
    radius: z.number().positive(),
    heightField: z.any(), // Float32Array<ArrayBufferLike> | Float32Array<ArrayBuffer>
    segments: z.number().int(),
    vertices: z.number().int(),
    faces: z.number().int(),
  }),
  material: z.object({
    noiseScale: z.number().positive(),
    mountainHeight: z.number(),
    detailScale: z.number().positive().optional(),
    detailStrength: z.number().optional(),
    breathSpeed: z.number(),
    breathAmplitude: z.number().optional(),
    veinColor: ColorSchema,
    veinHotColor: ColorSchema,
    veinThreshold: z.number().optional(),
    veinMicroThreshold: z.number().optional(),
    oceanColor: ColorSchema,
    landColor: ColorSchema,
    biomes: z.any().nullable().optional(),
    auroraEnabled: z.boolean().optional(),
    auroraColor: ColorSchema.optional(),
    auroraIntensity: z.number().optional(),
  }),
  atmosphere: z
    .object({
      enabled: z.boolean().optional(),
      density: z.number().optional(),
      rayleigh: z.number().optional(),
      mie: z.number().optional(),
      clouds: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]).nullable().optional(),
    generator: z.literal('PlanetGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Diamond Entity
// ============================================================================

/** Parámetros de entrada para generador de diamante */
export const DiamondParamsSchema = z.object({
  // Óptica física (valores reales del diamante)
  ior: z.number().positive().default(2.417),
  dispersion: z.number().min(0).max(0.1).default(0.044),

  // Geometría
  cutQuality: z.enum(['ideal', 'excellent', 'very-good', 'good', 'fair']).default('ideal'),
  facetCount: z.number().int().min(57).max(100).default(58),

  // Caustics
  causticsEnabled: z.boolean().default(true),
  causticsIntensity: z.number().min(0).max(1).default(0.8),
  causticsResolution: powerOfTwoSchema.default(2048),

  // Color/brillo
  bodyColor: ColorSchema.default({ r: 1.0, g: 1.0, b: 1.0 }),
  glowColor: ColorSchema.default({ r: 1.0, g: 0.95, b: 0.8 }),

  // Tamaño
  carat: z.number().positive().default(1.0),

  // Semilla
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de diamante */
export const DiamondOutputSchema = z.object({
  geometry: z.object({
    vertices: z.number().int(),
    faces: z.number().int(),
    uvs: z.boolean(),
    normals: z.boolean(),
    tangent: z.boolean(),
  }),
  material: z.object({
    ior: z.number(),
    dispersion: z.number(),
    transmission: z.number().min(0).max(1).default(1.0),
    thickness: z.number().positive().default(0.5),
    clearcoat: z.number().min(0).max(1).default(1.0),
    clearcoatRoughness: z.number().min(0).max(1).default(0.0),
    metalness: z.number().min(0).max(1).default(0.0),
    roughness: z.number().min(0).max(1).default(0.05),
  }),
  caustics: z
    .object({
      enabled: z.boolean(),
      intensity: z.number(),
      resolution: z.number().int(),
      worldRadius: z.number().positive(),
      color: ColorSchema,
    })
    .optional(),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]),
    generator: z.literal('DiamondGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Key Entity
// ============================================================================

/** Parámetros de entrada para generador de llave dorada */
export const KeyParamsSchema = z.object({
  // Material oro PBR
  goldHue: z.number().min(0).max(360).default(48),
  goldSaturation: z.number().min(0).max(1).default(0.85),
  metalness: z.number().min(0).max(1).default(1.0),
  roughness: z.number().min(0).max(1).default(0.1),

  // Clearcoat (brillo ceremonial)
  clearcoat: z.number().min(0).max(1).default(1.0),
  clearcoatRoughness: z.number().min(0).max(1).default(0.05),

  // Micro-scratches procedurales
  scratchDensity: z.number().min(0).max(1).default(0.3),
  scratchScale: z.number().positive().default(50.0),
  scratchAnisotropy: z.number().min(-1).max(1).default(0.5),

  // Grabado/ritual
  engravingDepth: z.number().min(0).max(0.01).default(0.002),
  engravingPattern: z.enum(['geometric', 'organic', 'sigil', 'none']).default('sigil'),

  // Pulso ritual (432Hz)
  pulseEnabled: z.boolean().default(true),
  pulseFrequency: z.number().positive().default(432),
  pulseIntensity: z.number().min(0).max(1).default(0.3),
  pulseColor: ColorSchema.default({ r: 1.0, g: 0.83, b: 0.36 }),

  // Geometría
  length: z.number().positive().default(0.15),
  width: z.number().positive().default(0.04),
  thickness: z.number().positive().default(0.005),

  // Semilla
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de llave */
export const KeyOutputSchema = z.object({
  geometry: z.object({
    vertices: z.number().int(),
    faces: z.number().int(),
    hasMorphTargets: z.boolean().default(false),
  }),
  material: z.object({
    color: ColorSchema,
    metalness: z.number(),
    roughness: z.number(),
    clearcoat: z.number(),
    clearcoatRoughness: z.number(),
    emissive: ColorSchema,
    emissiveIntensity: z.number(),
  }),
  animation: z
    .object({
      pulseFrequency: z.number(),
      pulsePhase: z.number().default(0),
    })
    .optional(),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]),
    generator: z.literal('KeyGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Machine Entity
// ============================================================================

/** Parámetros de entrada para generador de máquina orgánica */
export const MachineParamsSchema = z.object({
  // Iris/apertura
  irisAperture: z.number().min(0).max(1).default(0.5),
  irisSegments: z.number().int().min(6).max(32).default(12),
  irisSpeed: z.number().positive().default(1.0),

  // Anillos
  ringCount: z.number().int().min(1).max(10).default(3),
  ringSpacing: z.number().positive().default(0.3),
  ringRotationSpeed: z.number().default(0.5),
  ringPhaseOffset: z.number().default(0),

  // Pulso biológico (432Hz)
  pulseFrequency: z.number().positive().default(432),
  pulseAmplitude: z.number().min(0).max(0.5).default(0.15),
  pulseSync: z.boolean().default(true),

  // Ruido biológico
  biologicalNoise: z
    .object({
      scale: z.number().positive().default(10.0),
      speed: z.number().positive().default(0.5),
      amplitude: z.number().min(0).max(1).default(0.1),
    })
    .optional(),

  // Material metálico
  metalness: z.number().min(0).max(1).default(0.8),
  roughness: z.number().min(0).max(1).default(0.3),
  baseColor: ColorSchema.default({ r: 0.4, g: 0.4, b: 0.45 }),

  // Tamaño
  scale: z.number().positive().default(1.0),

  // Semilla
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de máquina */
export const MachineOutputSchema = z.object({
  geometry: z.object({
    parts: z.number().int(),
    vertices: z.number().int(),
    hasMorphTargets: z.boolean().default(true),
  }),
  material: z.object({
    metalness: z.number(),
    roughness: z.number(),
    color: ColorSchema,
    emissive: ColorSchema,
    emissiveIntensity: z.number(),
  }),
  animation: z.object({
    irisMorphTargets: z.array(z.string()),
    ringRotationSpeeds: z.array(z.number()),
    pulseFrequency: z.number(),
    biologicalNoise: z.boolean(),
  }),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]),
    generator: z.literal('MachineGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Mirror Entity (Nexus/Void/Mirror)
// ============================================================================

/** Parámetros de entrada para generador de espejo/portal */
export const MirrorParamsSchema = z.object({
  // Tipo de portal
  portalType: z.enum(['nexus', 'void', 'mirror', 'fractured']).default('mirror'),

  // Fractura/glitch
  fractureLevel: z.number().min(0).max(1).default(0.0),
  fractureScale: z.number().positive().default(5.0),
  fractureAnimation: z.boolean().default(true),

  // Refracción
  refractionIndex: z.number().positive().default(1.5),
  refractionDispersion: z.number().min(0).max(0.1).default(0.01),

  // Glitch
  glitchIntensity: z.number().min(0).max(1).default(0.0),
  glitchSpeed: z.number().positive().default(2.0),
  glitchScale: z.number().positive().default(10.0),

  // Void depth
  voidDepth: z.number().min(0).max(100).default(10.0),
  voidColor: ColorSchema.default({ r: 0.004, g: 0.004, b: 0.012 }),

  // Conexiones Nexus
  nexusConnections: z.number().int().min(0).max(8).default(3),
  nexusDistance: z.number().positive().default(20.0),
  nexusPulse: z.boolean().default(true),

  // Geometría base
  geometryType: z.enum(['plane', 'sphere', 'torus', 'fractal']).default('plane'),
  size: z.number().positive().default(5.0),

  // Semilla
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de espejo */
export const MirrorOutputSchema = z.object({
  geometry: z.object({
    type: z.string(),
    vertices: z.number().int(),
    renderTargets: z.number().int().default(2),
  }),
  material: z.object({
    refractionIndex: z.number(),
    dispersion: z.number(),
    transmission: z.number().min(0).max(1).default(0.9),
    thickness: z.number().positive().default(0.1),
  }),
  portal: z
    .object({
      type: z.string(),
      connections: z.number().int(),
      pulseEnabled: z.boolean(),
    })
    .optional(),
  effects: z.object({
    glitch: z.boolean(),
    fracture: z.boolean(),
    renderTargetReflection: z.boolean(),
  }),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]),
    generator: z.literal('MirrorGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Accretion Disk Entity
// ============================================================================

/** Parámetros de entrada para generador de disco de acreción */
export const AccretionParamsSchema = z.object({
  // Partículas GPU
  particleCount: z.number().int().min(10000).max(1000000).default(150000),

  // Geometría del disco
  innerRadius: z.number().positive().default(50.0),
  outerRadius: z.number().positive().default(500.0),
  diskHeight: z.number().positive().default(6000.0),

  // Física orbital (Kepler simplificado)
  gravityStrength: z.number().positive().default(250.0),
  rotationSpeed: z.number().positive().default(1.0),

  // Temperatura/color (black body radiation)
  temperatureGradient: z
    .object({
      inner: z.number().positive().default(10000).describe('Kelvin - blue/white'),
      outer: z.number().positive().default(3000).describe('Kelvin - red/orange'),
    })
    .optional(),

  // Interacción mouse/gravedad
  interactionRadius: z.number().positive().default(180.0),
  interactionForce: z.number().positive().default(80.0),
  interactionVerticalForce: z.number().positive().default(40.0),

  // Colores
  colorNeon: ColorSchema.default({ r: 1.0, g: 0.027, b: 0.227 }),
  colorBlood: ColorSchema.default({ r: 0.545, g: 0.0, b: 0.0 }),
  colorObsidian: ColorSchema.default({ r: 0.102, g: 0.02, b: 0.031 }),

  // Rendering
  additiveBlending: z.boolean().default(true),
  pointSizeRange: z
    .object({
      min: z.number().positive().default(0.5),
      max: z.number().positive().default(4.6),
    })
    .optional(),

  // Semilla
  seed: z.union([z.string(), z.number()]).optional(),
});

/** Output del generador de disco de acreción */
export const AccretionOutputSchema = z.object({
  geometry: z.object({
    particleCount: z.number().int(),
    attributes: z.array(z.string()),
  }),
  material: z.object({
    uniforms: z.record(z.unknown()),
    vertexShader: z.string(),
    fragmentShader: z.string(),
    transparent: z.boolean().default(true),
    depthWrite: z.boolean().default(false),
    blending: z.string().default('AdditiveBlending'),
  }),
  physics: z.object({
    gravityStrength: z.number(),
    innerRadius: z.number(),
    outerRadius: z.number(),
  }),
  metadata: z.object({
    seed: z.union([z.string(), z.number()]),
    generator: z.literal('AccretionGenerator'),
    version: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type PlanetParams = z.infer<typeof PlanetParamsSchema>;
export type PlanetOutput = z.infer<typeof PlanetOutputSchema>;
export type DiamondParams = z.infer<typeof DiamondParamsSchema>;
export type DiamondOutput = z.infer<typeof DiamondOutputSchema>;
export type KeyParams = z.infer<typeof KeyParamsSchema>;
export type KeyOutput = z.infer<typeof KeyOutputSchema>;
export type MachineParams = z.infer<typeof MachineParamsSchema>;
export type MachineOutput = z.infer<typeof MachineOutputSchema>;
export type MirrorParams = z.infer<typeof MirrorParamsSchema>;
export type MirrorOutput = z.infer<typeof MirrorOutputSchema>;
export type AccretionParams = z.infer<typeof AccretionParamsSchema>;
export type AccretionOutput = z.infer<typeof AccretionOutputSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validatePlanetParams(data: unknown): PlanetParams {
  return PlanetParamsSchema.parse(data);
}

export function validateDiamondParams(data: unknown): DiamondParams {
  return DiamondParamsSchema.parse(data);
}

export function validateKeyParams(data: unknown): KeyParams {
  return KeyParamsSchema.parse(data);
}

export function validateMachineParams(data: unknown): MachineParams {
  return MachineParamsSchema.parse(data);
}

export function validateMirrorParams(data: unknown): MirrorParams {
  return MirrorParamsSchema.parse(data);
}

export function validateAccretionParams(data: unknown): AccretionParams {
  return AccretionParamsSchema.parse(data);
}

export function safeValidatePlanetParams(data: unknown) {
  return PlanetParamsSchema.safeParse(data);
}

export function safeValidateDiamondParams(data: unknown) {
  return DiamondParamsSchema.safeParse(data);
}

export function safeValidateKeyParams(data: unknown) {
  return KeyParamsSchema.safeParse(data);
}

export function safeValidateMachineParams(data: unknown) {
  return MachineParamsSchema.safeParse(data);
}

export function safeValidateMirrorParams(data: unknown) {
  return MirrorParamsSchema.safeParse(data);
}

export function safeValidateAccretionParams(data: unknown) {
  return AccretionParamsSchema.safeParse(data);
}
