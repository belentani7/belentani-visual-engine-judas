/**
 * @belentani/core - Shared Types, Schemas, and Utilities
 *
 * Canonical TypeScript types come from `generator-types` (they match what
 * the generators actually produce). Zod schemas and validators come from
 * `lore-schema` and `scene-schema`.
 */

// Parameter Types (Branded types para unidades físicas)
export * from './parameter-types';

// Zod schemas + validators (lore entities)
export {
  AccretionOutputSchema,
  AccretionParamsSchema,
  AtmosphereConfigSchema,
  BiomeConfigSchema,
  DiamondOutputSchema,
  DiamondParamsSchema,
  KeyOutputSchema,
  KeyParamsSchema,
  MachineOutputSchema,
  MachineParamsSchema,
  MirrorOutputSchema,
  MirrorParamsSchema,
  NoiseConfigSchema,
  PlanetOutputSchema,
  PlanetParamsSchema,
  RangeSchema,
  safeValidateAccretionParams,
  safeValidateDiamondParams,
  safeValidateKeyParams,
  safeValidateMachineParams,
  safeValidateMirrorParams,
  safeValidatePlanetParams,
  validateAccretionParams,
  validateDiamondParams,
  validateKeyParams,
  validateMachineParams,
  validateMirrorParams,
  validatePlanetParams,
  ColorSchema as LoreColorSchema,
  Vector3Schema as LoreVector3Schema,
} from './lore-schema';

// Zod schemas + validators (serializable Three.js scene)
export {
  CameraSchema,
  ColorSchema,
  GeometrySchema,
  LightSchema,
  MaterialSchema,
  Object3DSchema,
  PostProcessingSchema,
  QuaternionSchema,
  RendererSettingsSchema,
  SceneConfigSchema,
  TransformSchema,
  Vector2Schema,
  Vector3Schema,
  powerOfTwoSchema,
  safeValidateSceneConfig,
  validateCameraConfig,
  validateLightConfig,
  validateMaterialConfig,
  validateObject3DConfig,
  validateRendererSettings,
  validateSceneConfig,
  type AnimationConfig,
  type AudioConfig as SerializableAudioConfig,
  type CameraConfig as SerializableCameraConfig,
  type GeometryConfig,
  type LightConfig as SerializableLightConfig,
  type MaterialConfig,
  type Object3DConfig,
  type PhysicsConfig,
  type PostProcessingConfig,
  type RendererSettings,
  type SceneConfig as SerializableSceneConfig,
} from './scene-schema';

// Canonical types (generator input/output, composed scene)
export * from './generator-types';

// Zod re-export
export { z } from 'zod';

// Version
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@belentani/core';
