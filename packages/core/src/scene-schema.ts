/**
 * Scene Schema - Three.js Scene Configuration
 *
 * Schema completo para configuración de escena Three.js serializable.
 * Compatible con SceneManager para instanciación automática.
 */

import { z } from 'zod';

// ============================================================================
// Three.js Core Types
// ============================================================================

/** Vector 3D */
export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/** Vector 2D */
export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

/** Color RGB normalizado 0-1 */
export const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

/** Cuaternión */
export const QuaternionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number(),
});

/** Transform (position, rotation, scale) */
export const TransformSchema = z.object({
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
  rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
  scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 1, y: 1, z: 1 }),
});

// Helper para validar power of two
export const powerOfTwoSchema = z
  .number()
  .int()
  .positive()
  .refine((n) => (n & (n - 1)) === 0, { message: 'Must be a power of two' });

// ============================================================================
// Camera
// ============================================================================

export const CameraSchema = z.object({
  type: z.enum(['PerspectiveCamera', 'OrthographicCamera']).default('PerspectiveCamera'),
  fov: z.number().min(1).max(179).default(43),
  aspect: z.number().positive().optional(),
  near: z.number().positive().default(0.05),
  far: z.number().positive().default(120),
  position: z
    .object({ x: z.number(), y: z.number(), z: z.number() })
    .default({ x: 0, y: 0.25, z: 10.8 }),
  target: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
  zoom: z.number().positive().default(1),
});

// ============================================================================
// Lights
// ============================================================================

export const LightSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AmbientLight'),
    color: ColorSchema.default({ r: 1, g: 1, b: 1 }),
    intensity: z.number().default(1),
  }),
  z.object({
    type: z.literal('DirectionalLight'),
    color: ColorSchema.default({ r: 1, g: 1, b: 1 }),
    intensity: z.number().default(1),
    position: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .default({ x: 0, y: 10, z: 5 }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
    castShadow: z.boolean().default(true),
    shadow: z
      .object({
        mapSize: z
          .object({
            x: powerOfTwoSchema.default(2048),
            y: powerOfTwoSchema.default(2048),
          })
          .default({ x: 2048, y: 2048 }),
        cameraNear: z.number().default(0.1),
        cameraFar: z.number().default(50),
        cameraLeft: z.number().default(-10),
        cameraRight: z.number().default(10),
        cameraTop: z.number().default(10),
        cameraBottom: z.number().default(-10),
        bias: z.number().default(-0.0001),
        normalBias: z.number().default(0.02),
      })
      .optional(),
  }),
  z.object({
    type: z.literal('PointLight'),
    color: ColorSchema.default({ r: 1, g: 1, b: 1 }),
    intensity: z.number().default(1),
    position: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .default({ x: 0, y: 0, z: 0 }),
    distance: z.number().default(0),
    decay: z.number().default(2),
    castShadow: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('SpotLight'),
    color: ColorSchema.default({ r: 1, g: 1, b: 1 }),
    intensity: z.number().default(1),
    position: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .default({ x: 0, y: 10, z: 0 }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
    angle: z
      .number()
      .min(0)
      .max(Math.PI / 2)
      .default(Math.PI / 3),
    penumbra: z.number().min(0).max(1).default(0),
    decay: z.number().default(2),
    distance: z.number().default(0),
    castShadow: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('HemisphereLight'),
    skyColor: ColorSchema.default({ r: 0.6, g: 0.7, b: 1.0 }),
    groundColor: ColorSchema.default({ r: 0.4, g: 0.3, b: 0.2 }),
    intensity: z.number().default(1),
    position: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .default({ x: 0, y: 100, z: 0 }),
  }),
  z.object({
    type: z.literal('RectAreaLight'),
    color: ColorSchema.default({ r: 1, g: 1, b: 1 }),
    intensity: z.number().default(1),
    position: z
      .object({ x: z.number(), y: z.number(), z: z.number() })
      .default({ x: 0, y: 5, z: 0 }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }).default({ x: 0, y: 0, z: 0 }),
    width: z.number().positive().default(10),
    height: z.number().positive().default(10),
  }),
]);

// ============================================================================
// Materials (TSL Node Materials)
// ============================================================================

export const MaterialSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('MeshPhysicalNodeMaterial'),
    color: ColorSchema.optional(),
    metalness: z.number().min(0).max(1).default(0),
    roughness: z.number().min(0).max(1).default(1),
    transmission: z.number().min(0).max(1).default(0),
    thickness: z.number().min(0).default(0),
    ior: z.number().positive().default(1.5),
    dispersion: z.number().min(0).max(0.1).default(0),
    clearcoat: z.number().min(0).max(1).default(0),
    clearcoatRoughness: z.number().min(0).max(1).default(0),
    sheen: z.number().min(0).max(1).default(0),
    sheenRoughness: z.number().min(0).max(1).default(0),
    iridescence: z.number().min(0).max(1).default(0),
    iridescenceIOR: z.number().positive().default(1.3),
    iridescenceThicknessRange: z
      .object({ min: z.number(), max: z.number() })
      .default({ min: 100, max: 400 }),
    specularIntensity: z.number().min(0).max(1).default(1),
    specularColor: ColorSchema.optional(),
    emissive: ColorSchema.optional(),
    emissiveIntensity: z.number().default(1),
    alphaTest: z.number().min(0).max(1).default(0),
    transparent: z.boolean().default(false),
    opacity: z.number().min(0).max(1).default(1),
    side: z.enum(['FrontSide', 'BackSide', 'DoubleSide']).default('FrontSide'),
    flatShading: z.boolean().default(false),
    vertexColors: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('MeshStandardNodeMaterial'),
    color: ColorSchema.optional(),
    metalness: z.number().min(0).max(1).default(0),
    roughness: z.number().min(0).max(1).default(1),
    emissive: ColorSchema.optional(),
    emissiveIntensity: z.number().default(1),
    transparent: z.boolean().default(false),
    opacity: z.number().min(0).max(1).default(1),
  }),
  z.object({
    type: z.literal('MeshBasicNodeMaterial'),
    color: ColorSchema.optional(),
    map: z.string().optional(),
    transparent: z.boolean().default(false),
    opacity: z.number().min(0).max(1).default(1),
  }),
  z.object({
    type: z.literal('PointsNodeMaterial'),
    color: ColorSchema.optional(),
    size: z.number().positive().default(1),
    sizeAttenuation: z.boolean().default(true),
    transparent: z.boolean().default(true),
    opacity: z.number().min(0).max(1).default(1),
    blending: z
      .enum(['NormalBlending', 'AdditiveBlending', 'SubtractiveBlending', 'MultiplyBlending'])
      .default('AdditiveBlending'),
    depthWrite: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('VolumeNodeMaterial'),
    density: z.number().min(0).max(1).default(0.5),
    color: ColorSchema.optional(),
    emission: ColorSchema.optional(),
    emissionIntensity: z.number().default(1),
    anisotropy: z.number().min(0).max(1).default(0.5),
    stepSize: z.number().positive().default(0.1),
    maxSteps: z.number().int().positive().default(100),
  }),
]);

// ============================================================================
// Geometry
// ============================================================================

export const GeometrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('BoxGeometry'),
    width: z.number().positive().default(1),
    height: z.number().positive().default(1),
    depth: z.number().positive().default(1),
    widthSegments: z.number().int().positive().default(1),
    heightSegments: z.number().int().positive().default(1),
    depthSegments: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal('SphereGeometry'),
    radius: z.number().positive().default(1),
    widthSegments: z.number().int().min(3).default(32),
    heightSegments: z.number().int().min(2).default(16),
    phiStart: z.number().default(0),
    phiLength: z.number().default(Math.PI * 2),
    thetaStart: z.number().default(0),
    thetaLength: z.number().default(Math.PI),
  }),
  z.object({
    type: z.literal('IcosahedronGeometry'),
    radius: z.number().positive().default(1),
    detail: z.number().int().min(0).max(8).default(6),
  }),
  z.object({
    type: z.literal('PlaneGeometry'),
    width: z.number().positive().default(1),
    height: z.number().positive().default(1),
    widthSegments: z.number().int().positive().default(1),
    heightSegments: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal('BufferGeometry'),
    attributes: z.record(
      z.object({
        itemSize: z.number().int().positive(),
        array: z.string(),
        normalized: z.boolean().default(false),
      })
    ),
    index: z.string().optional(),
    boundingBox: z
      .object({
        min: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        max: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      })
      .optional(),
    boundingSphere: z
      .object({
        center: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        radius: z.number().positive(),
      })
      .optional(),
  }),
]);

// ============================================================================
// Objects / Meshes
// ============================================================================

// Forward declare for recursive type
export interface Object3DConfig {
  uuid?: string;
  name?: string;
  type?: 'Mesh' | 'Points' | 'InstancedMesh' | 'Group' | 'Line' | 'LineSegments' | 'LineLoop';
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    quaternion?: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
  };
  geometry?: string;
  material?: string;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;
  renderOrder: number;
  userData?: Record<string, unknown>;
  children?: Object3DConfig[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Object3DSchema: any = z.object({
  uuid: z.string().uuid().optional(),
  name: z.string().optional(),
  type: z
    .enum(['Mesh', 'Points', 'InstancedMesh', 'Group', 'Line', 'LineSegments', 'LineLoop'])
    .default('Mesh'),
  transform: z
    .object({
      position: z
        .object({ x: z.number(), y: z.number(), z: z.number() })
        .default({ x: 0, y: 0, z: 0 }),
      rotation: z
        .object({ x: z.number(), y: z.number(), z: z.number() })
        .default({ x: 0, y: 0, z: 0 }),
      quaternion: z
        .object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() })
        .optional(),
      scale: z
        .object({ x: z.number(), y: z.number(), z: z.number() })
        .default({ x: 1, y: 1, z: 1 }),
    })
    .default({}),
  geometry: z.string().optional(),
  material: z.string().optional(),
  visible: z.boolean().default(true),
  castShadow: z.boolean().default(false),
  receiveShadow: z.boolean().default(true),
  frustumCulled: z.boolean().default(true),
  renderOrder: z.number().default(0),
  userData: z.record(z.unknown()).optional(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  children: z
    .array(z.lazy(() => Object3DSchema) as z.ZodType<Object3DConfig, z.ZodTypeDef, Object3DConfig>)
    .optional(),
});

// ============================================================================
// Post-Processing
// ============================================================================

export const PostProcessingSchema = z.object({
  enabled: z.boolean().default(true),
  renderTarget: z
    .object({
      samples: powerOfTwoSchema.default(1),
      depthBuffer: z.boolean().default(true),
      stencilBuffer: z.boolean().default(false),
    })
    .optional(),
  passes: z
    .array(
      z.object({
        type: z.string(),
        enabled: z.boolean().default(true),
        params: z.record(z.unknown()).default({}),
        input: z.string().optional(),
        output: z.string().optional(),
      })
    )
    .default([]),
});

// ============================================================================
// Renderer Settings
// ============================================================================

export const RendererSettingsSchema = z.object({
  antialias: z.boolean().default(true),
  alpha: z.boolean().default(false),
  powerPreference: z.enum(['default', 'high-performance', 'low-power']).default('high-performance'),
  stencil: z.boolean().default(false),
  depth: z.boolean().default(true),
  logarithmicDepthBuffer: z.boolean().default(false),
  preserveDrawingBuffer: z.boolean().default(false),
  failIfMajorPerformanceCaveat: z.boolean().default(false),
  pixelRatio: z
    .number()
    .positive()
    .max(2)
    .default(() => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      return Math.min(dpr || 1, 2);
    }),
  toneMapping: z
    .enum([
      'NoToneMapping',
      'LinearToneMapping',
      'ReinhardToneMapping',
      'CineonToneMapping',
      'ACESFilmicToneMapping',
      'AgXToneMapping',
      'NeutralToneMapping',
    ])
    .default('ACESFilmicToneMapping'),
  toneMappingExposure: z.number().positive().default(1.18),
  outputColorSpace: z
    .enum(['LinearSRGBColorSpace', 'SRGBColorSpace', 'DisplayP3ColorSpace'])
    .default('SRGBColorSpace'),
  physicallyCorrectLights: z.boolean().default(true),
  shadowMap: z
    .object({
      enabled: z.boolean().default(true),
      type: z
        .enum(['BasicShadowMap', 'PCFShadowMap', 'PCFSoftShadowMap', 'VSMShadowMap'])
        .default('PCFSoftShadowMap'),
      autoUpdate: z.boolean().default(true),
      needsUpdate: z.boolean().default(false),
    })
    .optional(),
  info: z
    .object({
      autoReset: z.boolean().default(true),
    })
    .optional(),
});

// ============================================================================
// Scene Config (Root)
// ============================================================================

export const SceneConfigSchema = z.object({
  version: z.string().default('1.0'),
  name: z.string().optional(),
  metadata: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      author: z.string().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      generator: z.string().optional(),
      generatorVersion: z.string().optional(),
    })
    .optional(),
  renderer: RendererSettingsSchema.default({}),
  camera: z
    .object({
      main: CameraSchema.default({}),
      cameras: z.record(CameraSchema).optional(),
    })
    .default({}),
  scene: z
    .object({
      background: z.union([ColorSchema, z.string()]).optional(),
      environment: z.string().optional(),
      fog: z
        .object({
          type: z.enum(['Fog', 'FogExp2']).default('FogExp2'),
          color: ColorSchema.default({ r: 0.01, g: 0.01, b: 0.02 }),
          near: z.number().default(1),
          far: z.number().default(100),
          density: z.number().default(0.014),
        })
        .optional(),
      objects: z.array(Object3DSchema).default([]),
      geometries: z.record(GeometrySchema).optional(),
      materials: z.record(MaterialSchema).optional(),
      lights: z.array(LightSchema).default([]),
    })
    .default({}),
  postProcessing: PostProcessingSchema.default({}),
  animation: z
    .object({
      enabled: z.boolean().default(true),
      clips: z
        .array(
          z.object({
            name: z.string(),
            duration: z.number().positive(),
            tracks: z.array(
              z.object({
                property: z.string(),
                times: z.array(z.number()),
                values: z.array(z.number()),
                interpolation: z.enum(['Discrete', 'Linear', 'Cubic']).default('Linear'),
              })
            ),
          })
        )
        .optional(),
    })
    .optional(),
  physics: z
    .object({
      enabled: z.boolean().default(false),
      gravity: z
        .object({ x: z.number(), y: z.number(), z: z.number() })
        .default({ x: 0, y: -9.81, z: 0 }),
      timeStep: z
        .number()
        .positive()
        .default(1 / 60),
      maxSubSteps: z.number().int().positive().default(3),
    })
    .optional(),
  audio: z
    .object({
      enabled: z.boolean().default(false),
      listener: z
        .object({
          position: z
            .object({ x: z.number(), y: z.number(), z: z.number() })
            .default({ x: 0, y: 0, z: 0 }),
          forward: z
            .object({ x: z.number(), y: z.number(), z: z.number() })
            .default({ x: 0, y: 0, z: -1 }),
          up: z
            .object({ x: z.number(), y: z.number(), z: z.number() })
            .default({ x: 0, y: 1, z: 0 }),
        })
        .optional(),
      sources: z
        .array(
          z.object({
            id: z.string(),
            type: z.enum([
              'AudioBufferSource',
              'MediaElementSource',
              'MediaStreamSource',
              'OscillatorSource',
            ]),
            buffer: z.string().optional(),
            mediaElement: z.string().optional(),
            loop: z.boolean().default(false),
            volume: z.number().min(0).max(1).default(1),
            playbackRate: z.number().positive().default(1),
            position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
            spatial: z.boolean().default(false),
            panningModel: z.enum(['HRTF', 'equalpower']).default('HRTF'),
            distanceModel: z.enum(['linear', 'inverse', 'exponential']).default('inverse'),
            refDistance: z.number().positive().default(1),
            maxDistance: z.number().positive().default(10000),
            rolloffFactor: z.number().positive().default(1),
            coneInnerAngle: z.number().default(360),
            coneOuterAngle: z.number().default(360),
            coneOuterGain: z.number().default(0),
          })
        )
        .optional(),
    })
    .optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type SceneConfig = z.infer<typeof SceneConfigSchema>;
export type RendererSettings = z.infer<typeof RendererSettingsSchema>;
export type CameraConfig = z.infer<typeof CameraSchema>;
export type LightConfig = z.infer<typeof LightSchema>;
export type MaterialConfig = z.infer<typeof MaterialSchema>;
export type GeometryConfig = z.infer<typeof GeometrySchema>;
export type PostProcessingConfig = z.infer<typeof PostProcessingSchema>;
export type AnimationConfig = z.infer<typeof SceneConfigSchema.shape.animation>;
export type PhysicsConfig = z.infer<typeof SceneConfigSchema.shape.physics>;
export type AudioConfig = z.infer<typeof SceneConfigSchema.shape.audio>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateSceneConfig(data: unknown) {
  return SceneConfigSchema.parse(data);
}

export function safeValidateSceneConfig(data: unknown) {
  return SceneConfigSchema.safeParse(data);
}

export function validateRendererSettings(data: unknown) {
  return RendererSettingsSchema.parse(data);
}

export function validateCameraConfig(data: unknown) {
  return CameraSchema.parse(data);
}

export function validateLightConfig(data: unknown) {
  return LightSchema.parse(data);
}

export function validateMaterialConfig(data: unknown) {
  return MaterialSchema.parse(data);
}

export function validateObject3DConfig(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return Object3DSchema.parse(data);
}
