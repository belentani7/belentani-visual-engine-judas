/**
 * Generator Types - Input/Output Types for All Procedural Generators
 *
 * Tipos TypeScript inferidos de los Zod schemas para uso en código.
 * Separados de lore-schema.ts para evitar dependencias circulares.
 */

// ============================================================================
// Base Types
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface NoiseConfig {
  seed: string | number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  offset?: Vector3;
}

export interface BiomeConfig {
  name: string;
  heightRange: Range;
  moistureRange: Range;
  temperatureRange: Range;
  color: { r: number; g: number; b: number };
  vegetationDensity: number;
  metadata?: Record<string, unknown>;
}

export interface AtmosphereConfig {
  enabled: boolean;
  density: number;
  rayleighCoefficient: number;
  mieCoefficient: number;
  sunIntensity: number;
  groundAlbedo: { r: number; g: number; b: number };
  clouds?: {
    enabled: boolean;
    coverage: number;
    height: number;
    density: number;
  };
}

// ============================================================================
// Planet Generator Types
// ============================================================================

export interface PlanetParams {
  // Geometría base
  radius: number;
  segments: number;

  // Ruido de terreno
  noise: NoiseConfig & { scale: number };

  // Desplazamiento
  mountainHeight: number;
  detailScale: number;
  detailStrength: number;

  // Respiración
  breathSpeed: number;
  breathAmplitude: number;

  // Venas/brillo
  veinColor: { r: number; g: number; b: number };
  veinHotColor?: { r: number; g: number; b: number };
  veinThreshold?: number;
  veinMicroThreshold?: number;

  // Colores base
  oceanColor: { r: number; g: number; b: number };
  landColor: { r: number; g: number; b: number };

  // Aurora polar
  auroraEnabled?: boolean;
  auroraColor?: { r: number; g: number; b: number };
  auroraIntensity?: number;

  // Atmósfera
  atmosphere?: AtmosphereConfig | null;

  // Biomas
  biomes?: BiomeConfig[] | null;

  // Rotación
  rotationSpeed?: number;
  axialTilt?: number;

  // Semilla
  seed?: string | number | null;
}

export interface PlanetGeometryOutput {
  radius: number;
  heightField: Float32Array<ArrayBufferLike> | Float32Array<ArrayBuffer>;
  segments: number;
  vertices: number;
  faces: number;
}

export interface PlanetMaterialParams {
  noiseScale: number;
  mountainHeight: number;
  detailScale?: number;
  detailStrength?: number;
  breathSpeed: number;
  breathAmplitude?: number;
  veinColor: { r: number; g: number; b: number };
  veinHotColor?: { r: number; g: number; b: number };
  veinThreshold?: number;
  veinMicroThreshold?: number;
  oceanColor: { r: number; g: number; b: number };
  landColor: { r: number; g: number; b: number };
  biomes?: BiomeConfig[] | Uint16Array;
  auroraEnabled?: boolean;
  auroraColor?: { r: number; g: number; b: number };
  auroraIntensity?: number;
}

export interface PlanetAtmosphereParams {
  enabled?: boolean;
  density?: number;
  rayleighCoefficient?: number;
  rayleigh?: number;
  mieCoefficient?: number;
  mie?: number;
  sunIntensity?: number;
  groundAlbedo?: { r: number; g: number; b: number };
  clouds?: boolean | { enabled: boolean; density?: number; coverage?: number; height?: number };
}

export interface PlanetOutput {
  geometry: PlanetGeometryOutput;
  material: PlanetMaterialParams;
  atmosphere?: PlanetAtmosphereParams | null;
  metadata: {
    seed?: string | number;
    generator: 'PlanetGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Diamond Generator Types
// ============================================================================

export interface DiamondParams {
  ior: number;
  dispersion: number;
  cutQuality: 'ideal' | 'excellent' | 'very-good' | 'good' | 'fair';
  facetCount: number;
  causticsEnabled: boolean;
  causticsIntensity: number;
  causticsResolution: number;
  bodyColor: { r: number; g: number; b: number };
  glowColor: { r: number; g: number; b: number };
  carat: number;
  seed?: string | number;
}

export interface DiamondGeometryOutput {
  vertices: number;
  faces: number;
  uvs: boolean;
  normals: boolean;
  tangent: boolean;
}

export interface DiamondMaterialParams {
  ior: number;
  dispersion: number;
  transmission: number;
  thickness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  metalness: number;
  roughness: number;
}

export interface DiamondCausticsParams {
  enabled: boolean;
  intensity: number;
  resolution: number;
  worldRadius: number;
  color: { r: number; g: number; b: number };
}

export interface DiamondOutput {
  geometry: DiamondGeometryOutput;
  material: DiamondMaterialParams;
  caustics?: DiamondCausticsParams;
  metadata: {
    seed: string | number;
    generator: 'DiamondGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Key Generator Types
// ============================================================================

export interface KeyParams {
  goldHue: number;
  goldSaturation: number;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  scratchDensity: number;
  scratchScale: number;
  scratchAnisotropy: number;
  engravingDepth: number;
  engravingPattern: 'geometric' | 'organic' | 'sigil' | 'none';
  pulseEnabled: boolean;
  pulseFrequency: number;
  pulseIntensity: number;
  pulseColor: { r: number; g: number; b: number };
  length: number;
  width: number;
  thickness: number;
  seed?: string | number;
}

export interface KeyGeometryOutput {
  vertices: number;
  faces: number;
  hasMorphTargets: boolean;
}

export interface KeyMaterialParams {
  color: { r: number; g: number; b: number };
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  emissive: { r: number; g: number; b: number };
  emissiveIntensity: number;
}

export interface KeyAnimationParams {
  pulseFrequency: number;
  pulsePhase: number;
}

export interface KeyOutput {
  geometry: KeyGeometryOutput;
  material: KeyMaterialParams;
  animation?: KeyAnimationParams;
  metadata: {
    seed: string | number;
    generator: 'KeyGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Machine Generator Types
// ============================================================================

export interface MachineParams {
  irisAperture: number;
  irisSegments: number;
  irisSpeed: number;
  ringCount: number;
  ringSpacing: number;
  ringRotationSpeed: number;
  ringPhaseOffset: number;
  pulseFrequency: number;
  pulseAmplitude: number;
  pulseSync: boolean;
  biologicalNoise?: {
    scale: number;
    speed: number;
    amplitude: number;
  };
  metalness: number;
  roughness: number;
  baseColor: { r: number; g: number; b: number };
  scale: number;
  seed?: string | number;
}

export interface MachineGeometryOutput {
  parts: number;
  vertices: number;
  hasMorphTargets: boolean;
}

export interface MachineMaterialParams {
  metalness: number;
  roughness: number;
  color: { r: number; g: number; b: number };
  emissive: { r: number; g: number; b: number };
  emissiveIntensity: number;
}

export interface MachineAnimationParams {
  irisMorphTargets: string[];
  ringRotationSpeeds: number[];
  pulseFrequency: number;
  biologicalNoise: boolean;
}

export interface MachineOutput {
  geometry: MachineGeometryOutput;
  material: MachineMaterialParams;
  animation: MachineAnimationParams;
  metadata: {
    seed: string | number;
    generator: 'MachineGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Mirror Generator Types
// ============================================================================

export interface MirrorParams {
  portalType: 'nexus' | 'void' | 'mirror' | 'fractured';
  fractureLevel: number;
  fractureScale: number;
  fractureAnimation: boolean;
  refractionIndex: number;
  refractionDispersion: number;
  glitchIntensity: number;
  glitchSpeed: number;
  glitchScale: number;
  voidDepth: number;
  voidColor: { r: number; g: number; b: number };
  nexusConnections: number;
  nexusDistance: number;
  nexusPulse: boolean;
  geometryType: 'plane' | 'sphere' | 'torus' | 'fractal';
  size: number;
  seed?: string | number;
}

export interface MirrorGeometryOutput {
  type: string;
  vertices: number;
  renderTargets: number;
}

export interface MirrorMaterialParams {
  refractionIndex: number;
  dispersion: number;
  transmission: number;
  thickness: number;
}

export interface MirrorPortalParams {
  type: string;
  connections: number;
  pulseEnabled: boolean;
}

export interface MirrorEffectsParams {
  glitch: boolean;
  fracture: boolean;
  renderTargetReflection: boolean;
}

export interface MirrorOutput {
  geometry: MirrorGeometryOutput;
  material: MirrorMaterialParams;
  portal?: MirrorPortalParams;
  effects: MirrorEffectsParams;
  metadata: {
    seed: string | number;
    generator: 'MirrorGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Accretion Disk Generator Types
// ============================================================================

export interface AccretionParams {
  particleCount: number;
  innerRadius: number;
  outerRadius: number;
  diskHeight: number;
  gravityStrength: number;
  rotationSpeed: number;
  temperatureGradient?: {
    inner: number;
    outer: number;
  };
  interactionRadius: number;
  interactionForce: number;
  interactionVerticalForce: number;
  colorNeon: { r: number; g: number; b: number };
  colorBlood: { r: number; g: number; b: number };
  colorObsidian: { r: number; g: number; b: number };
  additiveBlending: boolean;
  pointSizeRange?: {
    min: number;
    max: number;
  };
  seed?: string | number;
}

export interface AccretionGeometryOutput {
  particleCount: number;
  attributes: string[];
}

export interface AccretionMaterialParams {
  uniforms: Record<string, unknown>;
  vertexShader: string;
  fragmentShader: string;
  transparent: boolean;
  depthWrite: boolean;
  blending: string;
}

export interface AccretionPhysicsParams {
  gravityStrength: number;
  innerRadius: number;
  outerRadius: number;
}

export interface AccretionOutput {
  geometry: AccretionGeometryOutput;
  material: AccretionMaterialParams;
  physics: AccretionPhysicsParams;
  metadata: {
    seed: string | number;
    generator: 'AccretionGenerator';
    version: string;
    generatedAt: string;
  };
}

// ============================================================================
// Scene Composer Types
// ============================================================================

export interface GeneratorOutput {
  planet?: PlanetOutput;
  diamond?: DiamondOutput;
  key?: KeyOutput;
  machine?: MachineOutput;
  mirror?: MirrorOutput;
  accretion?: AccretionOutput;
}

export interface SceneComposerInput {
  generators: GeneratorOutput;
  camera?: CameraConfig;
  lights?: LightConfig[];
  postProcessing?: PostProcessConfig;
  narrative?: NarrativeFlowConfig;
  audio?: AudioConfig;
}

export interface CameraConfig {
  type: 'PerspectiveCamera' | 'OrthographicCamera';
  fov: number;
  aspect?: number;
  near: number;
  far: number;
  position: Vector3;
  target: Vector3;
  zoom: number;
}

export interface LightConfig {
  type:
    | 'AmbientLight'
    | 'DirectionalLight'
    | 'PointLight'
    | 'SpotLight'
    | 'HemisphereLight'
    | 'RectAreaLight';
  color: { r: number; g: number; b: number };
  intensity: number;
  position?: Vector3;
  target?: Vector3;
  castShadow?: boolean;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  /** HemisphereLight only */
  skyColor?: { r: number; g: number; b: number };
  /** HemisphereLight only */
  groundColor?: { r: number; g: number; b: number };
  /** DirectionalLight shadow tuning */
  shadow?: {
    mapSize: { x: number; y: number };
    cameraNear: number;
    cameraFar: number;
    cameraLeft: number;
    cameraRight: number;
    cameraTop: number;
    cameraBottom: number;
    bias: number;
    normalBias: number;
  };
}

export interface PostProcessConfig {
  bloom?: {
    enabled: boolean;
    threshold: number;
    strength: number;
    radius: number;
    emissiveOnly: boolean;
  };
  gtao?: {
    enabled: boolean;
    resolutionScale: number;
    samples: number;
    radius: number;
    temporalFiltering: boolean;
  };
  ssgi?: {
    enabled: boolean;
    sliceCount: number;
    stepCount: number;
    radius: number;
    thickness: number;
  };
  traa?: {
    enabled: boolean;
    subpixelCorrection: boolean;
  };
  lensflare?: {
    enabled: boolean;
    threshold: number;
    ghostAttenuation: number;
    ghostSpacing: number;
  };
  toneMapping?: {
    type: 'ACESFilmic' | 'Reinhard' | 'Neutral' | 'AgX';
    exposure: number;
  };
}

export interface NarrativeStepConfig {
  id: string;
  name: string;
  duration: number;
  camera?: CameraConfig;
  params?: Record<string, unknown>;
  audio?: string;
  trigger: 'auto' | 'user' | 'condition';
}

export interface NarrativeFlowConfig {
  steps: NarrativeStepConfig[];
  loop: boolean;
  currentStep: number;
}

export interface AudioConfig {
  enabled: boolean;
  masterVolume: number;
  tracks: Array<{
    id: string;
    url: string;
    volume: number;
    loop: boolean;
    spatial: boolean;
  }>;
}

export interface SceneConfig {
  version: string;
  name: string;
  description?: string;
  planet?: PlanetOutput;
  diamond?: DiamondOutput;
  key?: KeyOutput;
  machine?: MachineOutput;
  mirror?: MirrorOutput;
  accretion?: AccretionOutput;
  camera: CameraConfig;
  lights: LightConfig[];
  postProcessing: PostProcessConfig;
  narrative?: NarrativeFlowConfig;
  audio?: AudioConfig;
  metadata: {
    seed?: string | number;
    createdAt: string;
    updatedAt: string;
    loreSource?: string;
    generatorVersions: Record<string, string>;
  };
}

// ============================================================================
// Generator Interface
// ============================================================================

export interface Generator<TParams, TOutput> {
  readonly name: string;
  readonly version: string;
  generate(params: TParams): TOutput;
  validate(params: unknown): TParams;
  getDefaultParams(): TParams;
}

export interface GeneratorRegistry {
  planet: Generator<PlanetParams, PlanetOutput>;
  diamond: Generator<DiamondParams, DiamondOutput>;
  key: Generator<KeyParams, KeyOutput>;
  machine: Generator<MachineParams, MachineOutput>;
  mirror: Generator<MirrorParams, MirrorOutput>;
  accretion: Generator<AccretionParams, AccretionOutput>;
}

// ============================================================================
// Type Guards
// ============================================================================

interface GeneratorOutputBase {
  generator: string;
}

function hasGenerator(obj: unknown, expectedGenerator: string): obj is GeneratorOutputBase {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'generator' in obj &&
    (obj as GeneratorOutputBase).generator === expectedGenerator
  );
}

export function isPlanetOutput(obj: unknown): obj is PlanetOutput {
  return hasGenerator(obj, 'PlanetGenerator');
}

export function isDiamondOutput(obj: unknown): obj is DiamondOutput {
  return hasGenerator(obj, 'DiamondGenerator');
}

export function isKeyOutput(obj: unknown): obj is KeyOutput {
  return hasGenerator(obj, 'KeyGenerator');
}

export function isMachineOutput(obj: unknown): obj is MachineOutput {
  return hasGenerator(obj, 'MachineGenerator');
}

export function isMirrorOutput(obj: unknown): obj is MirrorOutput {
  return hasGenerator(obj, 'MirrorGenerator');
}

export function isAccretionOutput(obj: unknown): obj is AccretionOutput {
  return hasGenerator(obj, 'AccretionGenerator');
}

// ============================================================================
// Utility Types
// ============================================================================

export type GeneratorName = 'planet' | 'diamond' | 'key' | 'machine' | 'mirror' | 'accretion';
export type GeneratorParamsMap = {
  planet: PlanetParams;
  diamond: DiamondParams;
  key: KeyParams;
  machine: MachineParams;
  mirror: MirrorParams;
  accretion: AccretionParams;
};
export type GeneratorOutputMap = {
  planet: PlanetOutput;
  diamond: DiamondOutput;
  key: KeyOutput;
  machine: MachineOutput;
  mirror: MirrorOutput;
  accretion: AccretionOutput;
};
