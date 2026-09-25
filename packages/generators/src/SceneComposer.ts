/**
 * Scene Composer - Combines all generators into a complete scene
 *
 * Takes outputs from all 6 generators and creates a unified SceneConfig
 * ready for the Three.js frontend renderer.
 */

import { PlanetGenerator } from './planet/PlanetGenerator';
import { DiamondGenerator } from './diamond/DiamondGenerator';
import { KeyGenerator } from './key/KeyGenerator';
import { MachineGenerator } from './machine/MachineGenerator';
import { MirrorGenerator } from './mirror/MirrorGenerator';
import { AccretionGenerator } from './accretion/AccretionGenerator';
import type {
  AccretionOutput,
  AccretionParams,
  AudioConfig,
  CameraConfig,
  DiamondOutput,
  DiamondParams,
  GeneratorName,
  KeyOutput,
  KeyParams,
  LightConfig,
  MachineOutput,
  MachineParams,
  MirrorOutput,
  MirrorParams,
  NarrativeFlowConfig,
  PlanetOutput,
  PlanetParams,
  PostProcessConfig,
  SceneConfig,
} from '@belentani/core';

export interface GeneratorOutput {
  planet?: PlanetOutput;
  diamond?: DiamondOutput;
  key?: KeyOutput;
  machine?: MachineOutput;
  mirror?: MirrorOutput;
  accretion?: AccretionOutput;
}

export interface SceneComposerOptions {
  camera?: Partial<CameraConfig>;
  lights?: LightConfig[];
  postProcessing?: Partial<PostProcessConfig>;
  narrative?: NarrativeFlowConfig;
  audio?: Partial<AudioConfig>;
  seed?: string | number;
}

export class SceneComposer {
  private seed: string | number;

  constructor(seed: string | number = 'belentani-scene') {
    this.seed = seed;
  }

  generateAll(): GeneratorOutput {
    return {
      planet: new PlanetGenerator(this.seed).generate({
        radius: 1.0,
        segments: 64,
        noise: { seed: this.seed, scale: 2.0, octaves: 6, persistence: 0.5, lacunarity: 2.0 },
        mountainHeight: 0.5,
        detailScale: 1.0,
        detailStrength: 0.3,
        breathSpeed: 0.5,
        breathAmplitude: 0.02,
        veinColor: { r: 0.1, g: 0.9, b: 0.4 },
        oceanColor: { r: 0.02, g: 0.08, b: 0.3 },
        landColor: { r: 0.15, g: 0.35, b: 0.1 },
      } as any),
      diamond: new DiamondGenerator(this.seed).generate({
        ior: 2.417,
        dispersion: 0.044,
        cutQuality: 'ideal',
        facetCount: 58,
        causticsEnabled: true,
        causticsIntensity: 0.8,
        causticsResolution: 2048,
      } as any),
      key: new KeyGenerator(this.seed).generate({
        goldHue: 45,
        goldSaturation: 0.9,
        metalness: 1.0,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        scratchDensity: 0.3,
        scratchScale: 1.0,
        scratchAnisotropy: 0.5,
        engravingDepth: 0.02,
        engravingPattern: 'geometric',
        pulseEnabled: true,
        pulseFrequency: 4.32,
        pulseIntensity: 0.5,
        pulseColor: { r: 1.0, g: 0.8, b: 0.2 },
        length: 0.08,
        width: 0.015,
        thickness: 0.005,
      } as any),
      machine: new MachineGenerator(this.seed).generate({
        irisAperture: 0.5,
        irisSegments: 12,
        irisSpeed: 0.3,
        ringCount: 3,
        ringSpacing: 0.15,
        ringRotationSpeed: 0.5,
        ringPhaseOffset: 0,
        pulseFrequency: 432,
        pulseAmplitude: 0.3,
        pulseSync: true,
        metalness: 0.9,
        roughness: 0.2,
        baseColor: { r: 0.2, g: 0.2, b: 0.25 },
        scale: 1.0,
      } as any),
      mirror: new MirrorGenerator(this.seed).generate({
        portalType: 'nexus',
        fractureLevel: 0.3,
        fractureScale: 1.0,
        fractureAnimation: true,
        refractionIndex: 1.5,
        refractionDispersion: 0.02,
        glitchIntensity: 0.1,
        glitchSpeed: 0.5,
        glitchScale: 0.2,
        voidDepth: 2.0,
        voidColor: { r: 0.0, g: 0.0, b: 0.02 },
        nexusConnections: 4,
        nexusDistance: 3.0,
        nexusPulse: true,
        geometryType: 'sphere',
        size: 1.0,
      } as any),
      accretion: new AccretionGenerator(this.seed).generate({
        particleCount: 50000,
        innerRadius: 1.5,
        outerRadius: 4.0,
        diskHeight: 0.1,
        gravityStrength: 0.5,
        rotationSpeed: 0.3,
        interactionRadius: 0.5,
        interactionForce: 1.0,
        interactionVerticalForce: 0.1,
        colorNeon: { r: 0.4, g: 0.1, b: 0.9 },
        colorBlood: { r: 0.9, g: 0.1, b: 0.1 },
        colorObsidian: { r: 0.05, g: 0.05, b: 0.08 },
        additiveBlending: true,
      } as any),
    };
  }

  compose(generators: GeneratorOutput, options: SceneComposerOptions = {}): SceneConfig {
    const {
      camera = {},
      lights = this.getDefaultLights(),
      postProcessing = this.getDefaultPostProcessing(),
      narrative,
      audio,
      seed = this.seed,
    } = options;

    const sceneConfig: SceneConfig = {
      version: '1.0',
      name: `Belentani Scene - ${new Date().toISOString().split('T')[0]}`,
      description: 'Procedural visual experience generated from lore',

      // Generated entities
      planet: generators.planet,
      diamond: generators.diamond,
      key: generators.key,
      machine: generators.machine,
      mirror: generators.mirror,
      accretion: generators.accretion,

      // Camera
      camera: this.getDefaultCamera(camera),

      // Lights
      lights,

      // Post-processing
      postProcessing: this.getDefaultPostProcessingConfig(postProcessing),

      // Narrative
      narrative,

      // Audio
      audio: this.getDefaultAudioConfig(audio),

      // Metadata
      metadata: {
        seed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatorVersions: this.getGeneratorVersions(generators),
      },
    };

    return sceneConfig;
  }

  private getDefaultCamera(overrides: Partial<CameraConfig> = {}): CameraConfig {
    return {
      type: 'PerspectiveCamera',
      fov: 43,
      aspect: undefined, // Auto
      near: 0.05,
      far: 120,
      position: { x: 0, y: 0.25, z: 10.8 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
      ...overrides,
    };
  }

  private getDefaultLights(): LightConfig[] {
    return [
      {
        type: 'DirectionalLight',
        color: { r: 1.0, g: 0.95, b: 0.9 },
        intensity: 1.2,
        position: { x: 5, y: 10, z: 7.5 },
        target: { x: 0, y: 0, z: 0 },
        castShadow: true,
        shadow: {
          mapSize: { x: 2048, y: 2048 },
          cameraNear: 0.1,
          cameraFar: 50,
          cameraLeft: -10,
          cameraRight: 10,
          cameraTop: 10,
          cameraBottom: -10,
          bias: -0.0001,
          normalBias: 0.02,
        },
      },
      {
        type: 'HemisphereLight',
        color: { r: 0.6, g: 0.7, b: 1.0 },
        skyColor: { r: 0.6, g: 0.7, b: 1.0 },
        groundColor: { r: 0.1, g: 0.05, b: 0.02 },
        intensity: 0.5,
        position: { x: 0, y: 100, z: 0 },
      },
      {
        type: 'PointLight',
        color: { r: 1.0, g: 0.3, b: 0.1 },
        intensity: 0.8,
        position: { x: 0, y: 2, z: 0 },
        distance: 20,
        decay: 2,
      },
    ];
  }

  private getDefaultPostProcessing(overrides: Partial<PostProcessConfig> = {}): PostProcessConfig {
    return {
      bloom: {
        enabled: true,
        threshold: 0.0,
        strength: 1.0,
        radius: 0.0,
        emissiveOnly: true,
        ...overrides.bloom,
      },
      gtao: {
        enabled: true,
        resolutionScale: 0.5,
        samples: 16,
        radius: 0.25,
        temporalFiltering: true,
        ...overrides.gtao,
      },
      ssgi: {
        enabled: true,
        sliceCount: 2,
        stepCount: 8,
        radius: 1.0,
        thickness: 1.0,
        ...overrides.ssgi,
      },
      traa: {
        enabled: true,
        subpixelCorrection: false,
        ...overrides.traa,
      },
      lensflare: {
        enabled: true,
        threshold: 0.5,
        ghostAttenuation: 25,
        ghostSpacing: 0.25,
        ...overrides.lensflare,
      },
      toneMapping: {
        type: 'ACESFilmic',
        exposure: 1.18,
        ...overrides.toneMapping,
      },
    };
  }

  private getDefaultPostProcessingConfig(
    overrides: Partial<PostProcessConfig> = {}
  ): PostProcessConfig {
    return this.getDefaultPostProcessing(overrides);
  }

  private getDefaultAudioConfig(overrides: Partial<AudioConfig> = {}): AudioConfig | undefined {
    const hasEnabled = overrides.enabled === true;
    const tracks = overrides.tracks;
    const hasTracks = Array.isArray(tracks) && tracks.length > 0;
    if (!hasEnabled && !hasTracks) return undefined;

    const masterVolume = overrides.masterVolume ?? 0.7;
    const enabled = overrides.enabled ?? true;
    const tracksResult = tracks ?? [
      {
        id: 'ambient',
        url: '/audio/ambient-432hz.ogg',
        volume: 0.5,
        loop: true,
        spatial: false,
      },
      {
        id: 'pulse',
        url: '/audio/pulse-432hz.ogg',
        volume: 0.3,
        loop: true,
        spatial: true,
      },
    ];

    return {
      enabled,
      masterVolume,
      tracks: tracksResult,
      ...overrides,
    };
  }

  private getGeneratorVersions(generators: GeneratorOutput): Record<string, string> {
    const versions: Record<string, string> = {};
    if (generators.planet) versions.planet = generators.planet.metadata.version;
    if (generators.diamond) versions.diamond = generators.diamond.metadata.version;
    if (generators.key) versions.key = generators.key.metadata.version;
    if (generators.machine) versions.machine = generators.machine.metadata.version;
    if (generators.mirror) versions.mirror = generators.mirror.metadata.version;
    if (generators.accretion) versions.accretion = generators.accretion.metadata.version;
    return versions;
  }

  // Validate that all required generators are present
  validate(generators: GeneratorOutput): { valid: boolean; missing: GeneratorName[] } {
    const required: GeneratorName[] = [
      'planet',
      'diamond',
      'key',
      'machine',
      'mirror',
      'accretion',
    ];
    const missing: GeneratorName[] = [];

    for (const req of required) {
      if (!generators[req]) {
        missing.push(req);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  // Create scene from lore markdown (integrates with LoreParser)
  async composeFromLore(
    loreMarkdown: string,
    loreParser: {
      parse: (markdown: string) => Promise<{
        planet?: { seed?: string | number; [key: string]: unknown };
        diamond?: { seed?: string | number; [key: string]: unknown };
        key?: { seed?: string | number; [key: string]: unknown };
        machine?: { seed?: string | number; [key: string]: unknown };
        mirror?: { seed?: string | number; [key: string]: unknown };
        accretion?: { seed?: string | number; [key: string]: unknown };
        seed?: string | number;
      }>;
      extract: (entities: {
        planet?: { seed?: string | number; [key: string]: unknown };
        diamond?: { seed?: string | number; [key: string]: unknown };
        key?: { seed?: string | number; [key: string]: unknown };
        machine?: { seed?: string | number; [key: string]: unknown };
        mirror?: { seed?: string | number; [key: string]: unknown };
        accretion?: { seed?: string | number; [key: string]: unknown };
        seed?: string | number;
      }) => Promise<{
        planet?: PlanetParams;
        diamond?: DiamondParams;
        key?: KeyParams;
        machine?: MachineParams;
        mirror?: MirrorParams;
        accretion?: AccretionParams;
        seed?: string | number;
      }>;
    }
  ): Promise<SceneConfig> {
    // Parse lore to structured entities
    const entities = await loreParser.parse(loreMarkdown);

    // Extract parameters for each generator
    const params = await loreParser.extract(entities);

    // Generate all entities
    const generators: GeneratorOutput = {};

    if (params.planet) {
      const { PlanetGenerator } = await import('./planet/PlanetGenerator');
      generators.planet = new PlanetGenerator(params.planet.seed ?? this.seed).generate(
        params.planet
      );
    }
    if (params.diamond) {
      const { DiamondGenerator } = await import('./diamond/DiamondGenerator');
      generators.diamond = new DiamondGenerator(params.diamond.seed ?? this.seed).generate(
        params.diamond
      );
    }
    if (params.key) {
      const { KeyGenerator } = await import('./key/KeyGenerator');
      generators.key = new KeyGenerator(params.key.seed ?? this.seed).generate(params.key);
    }
    if (params.machine) {
      const { MachineGenerator } = await import('./machine/MachineGenerator');
      generators.machine = new MachineGenerator(params.machine.seed ?? this.seed).generate(
        params.machine
      );
    }
    if (params.mirror) {
      const { MirrorGenerator } = await import('./mirror/MirrorGenerator');
      generators.mirror = new MirrorGenerator(params.mirror.seed ?? this.seed).generate(
        params.mirror
      );
    }
    if (params.accretion) {
      const { AccretionGenerator } = await import('./accretion/AccretionGenerator');
      generators.accretion = new AccretionGenerator(params.accretion.seed ?? this.seed).generate(
        params.accretion
      );
    }

    return this.compose(generators, { seed: params.seed ?? this.seed });
  }
}
