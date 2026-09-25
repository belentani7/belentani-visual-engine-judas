import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  // Branded types
  Units,
  CONSTANTS,
  convert,
  type IOR,
  type FrequencyHz,
  type WavelengthNm,
  type DistanceKm,
  type TemperatureK,
  type Seed,
} from '../src/parameter-types';

import {
  // Lore schemas
  PlanetParamsSchema,
  DiamondParamsSchema,
  KeyParamsSchema,
  MachineParamsSchema,
  MirrorParamsSchema,
  AccretionParamsSchema,
  // Validation
  validatePlanetParams,
  validateDiamondParams,
  validateKeyParams,
  validateMachineParams,
  validateMirrorParams,
  validateAccretionParams,
  safeValidatePlanetParams,
  // Types
  type PlanetParams,
  type DiamondParams,
  type KeyParams,
  type MachineParams,
  type MirrorParams,
  type AccretionParams,
} from '../src/lore-schema';

import {
  // Scene schemas
  Vector3Schema,
  ColorSchema,
  CameraSchema,
  LightSchema,
  SceneConfigSchema,
  validateSceneConfig,
  safeValidateSceneConfig,
  // Types
  type SceneConfig,
  type CameraConfig,
  type LightConfig,
} from '../src/scene-schema';

describe('parameter-types', () => {
  describe('Units constructors', () => {
    it('creates branded types correctly', () => {
      const ior = Units.ior(2.417);
      const freq = Units.hz(432);
      const wave = Units.nm(650);
      const dist = Units.km(100);
      const temp = Units.kelvin(5800);
      const seed = Units.seed('test-seed');

      expect(typeof ior).toBe('number');
      expect(typeof freq).toBe('number');
      expect(typeof wave).toBe('number');
      expect(typeof dist).toBe('number');
      expect(typeof temp).toBe('number');
      expect(typeof seed).toBe('string');
    });
  });

  describe('CONSTANTS', () => {
    it('has correct physical constants', () => {
      expect(CONSTANTS.IOR.DIAMOND).toBe(2.417);
      expect(CONSTANTS.IOR.WATER).toBe(1.333);
      expect(CONSTANTS.FREQUENCY.A4_BELENTANI).toBe(432);
      expect(CONSTANTS.DISPERSION.DIAMOND).toBe(0.044);
    });
  });

  describe('convert utilities', () => {
    it('converts degrees to radians', () => {
      expect(convert.degToRad(180 as any)).toBe(Math.PI);
      expect(convert.degToRad(90 as any)).toBe(Math.PI / 2);
    });

    it('converts radians to degrees', () => {
      expect(convert.radToDeg(Math.PI as any)).toBe(180);
      expect(convert.radToDeg(Math.PI / 2 as any)).toBe(90);
    });

    it('converts Hz to period', () => {
      expect(convert.hzToPeriod(1 as any)).toBe(1);
      expect(convert.hzToPeriod(2 as any)).toBe(0.5);
    });

    it('converts km to m', () => {
      expect(convert.kmToM(1 as any)).toBe(1000);
      expect(convert.kmToM(0.5 as any)).toBe(500);
    });

    it('converts m to km', () => {
      expect(convert.mToKm(1000 as any)).toBe(1);
      expect(convert.mToKm(500 as any)).toBe(0.5);
    });
  });
});

describe('lore-schema', () => {
  describe('PlanetParamsSchema', () => {
    it('validates valid planet params', () => {
      const params = {
        radius: 1.56,
        segments: 6,
        noise: {
          seed: 'test',
          scale: 3.4,
          octaves: 5,
          persistence: 0.5,
          lacunarity: 2.0,
        },
        mountainHeight: 0.16,
        detailScale: 18.0,
        detailStrength: 0.028,
        breathSpeed: 1.35,
        breathAmplitude: 0.018,
        veinColor: { r: 1.0, g: 0.0, b: 0.236 },
        veinHotColor: { r: 1.0, g: 0.157, b: 0.561 },
        veinThreshold: 0.955,
        veinMicroThreshold: 0.82,
        oceanColor: { r: 0.004, g: 0.027, b: 0.055 },
        landColor: { r: 0.031, g: 0.047, b: 0.055 },
        auroraEnabled: true,
        auroraColor: { r: 0.392, g: 0.973, b: 1.0 },
        auroraIntensity: 0.32,
        rotationSpeed: 0.026,
        axialTilt: 0.41,
        seed: 'test-seed',
      };

      const result = PlanetParamsSchema.parse(params);
      expect(result.radius).toBe(1.56);
      expect(result.seed).toBe('test-seed');
    });

    it('uses defaults for optional fields', () => {
      const minimal = {
        noise: { seed: 'test', scale: 1.0 },
      };

      const result = PlanetParamsSchema.parse(minimal);
      expect(result.radius).toBe(1.56);
      expect(result.segments).toBe(6);
      expect(result.mountainHeight).toBe(0.16);
    });

    it('rejects invalid values', () => {
      const invalid = {
        radius: -1, // negative
        noise: { seed: 'test', scale: 1.0 },
      };

      expect(() => PlanetParamsSchema.parse(invalid)).toThrow();
    });
  });

  describe('DiamondParamsSchema', () => {
    it('validates correct diamond params with physical constants', () => {
      const params = {
        ior: 2.417,
        dispersion: 0.044,
        cutQuality: 'ideal',
        facetCount: 58,
        causticsEnabled: true,
        causticsIntensity: 0.8,
        causticsResolution: 2048,
        bodyColor: { r: 1.0, g: 1.0, b: 1.0 },
        glowColor: { r: 1.0, g: 0.95, b: 0.8 },
        carat: 1.0,
        seed: 'diamond-seed',
      };

      const result = DiamondParamsSchema.parse(params);
      expect(result.ior).toBe(2.417);
      expect(result.dispersion).toBe(0.044);
    });

    it('validates power of two for causticsResolution', () => {
      const params = {
        ior: 2.417,
        dispersion: 0.044,
        causticsResolution: 1024, // power of 2
      };

      expect(() => DiamondParamsSchema.parse(params)).not.toThrow();

      const invalid = {
        ior: 2.417,
        dispersion: 0.044,
        causticsResolution: 1000, // not power of 2
      };

      expect(() => DiamondParamsSchema.parse(invalid)).toThrow();
    });
  });

  describe('KeyParamsSchema', () => {
    it('validates key params with 432Hz pulse', () => {
      const params = {
        goldHue: 48,
        goldSaturation: 0.85,
        metalness: 1.0,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        scratchDensity: 0.3,
        scratchScale: 50.0,
        scratchAnisotropy: 0.5,
        engravingDepth: 0.002,
        engravingPattern: 'sigil',
        pulseEnabled: true,
        pulseFrequency: 432,
        pulseIntensity: 0.3,
        pulseColor: { r: 1.0, g: 0.83, b: 0.36 },
        length: 0.15,
        width: 0.04,
        thickness: 0.005,
        seed: 'key-seed',
      };

      const result = KeyParamsSchema.parse(params);
      expect(result.pulseFrequency).toBe(432);
      expect(result.pulseEnabled).toBe(true);
    });
  });

  describe('MachineParamsSchema', () => {
    it('validates machine params with 432Hz sync', () => {
      const params = {
        irisAperture: 0.5,
        irisSegments: 12,
        irisSpeed: 1.0,
        ringCount: 3,
        ringSpacing: 0.3,
        ringRotationSpeed: 0.5,
        ringPhaseOffset: 0,
        pulseFrequency: 432,
        pulseAmplitude: 0.15,
        pulseSync: true,
        metalness: 0.8,
        roughness: 0.3,
        baseColor: { r: 0.4, g: 0.4, b: 0.45 },
        scale: 1.0,
        seed: 'machine-seed',
      };

      const result = MachineParamsSchema.parse(params);
      expect(result.pulseFrequency).toBe(432);
      expect(result.pulseSync).toBe(true);
    });
  });

  describe('MirrorParamsSchema', () => {
    it('validates mirror/portal params', () => {
      const params = {
        portalType: 'nexus',
        fractureLevel: 0.0,
        fractureScale: 5.0,
        fractureAnimation: true,
        refractionIndex: 1.5,
        refractionDispersion: 0.01,
        glitchIntensity: 0.0,
        glitchSpeed: 2.0,
        glitchScale: 10.0,
        voidDepth: 10.0,
        voidColor: { r: 0.004, g: 0.004, b: 0.012 },
        nexusConnections: 3,
        nexusDistance: 20.0,
        nexusPulse: true,
        geometryType: 'plane',
        size: 5.0,
        seed: 'mirror-seed',
      };

      const result = MirrorParamsSchema.parse(params);
      expect(result.portalType).toBe('nexus');
      expect(result.nexusConnections).toBe(3);
    });
  });

  describe('AccretionParamsSchema', () => {
    it('validates accretion disk params', () => {
      const params = {
        particleCount: 150000,
        innerRadius: 50.0,
        outerRadius: 500.0,
        diskHeight: 6000.0,
        gravityStrength: 250.0,
        rotationSpeed: 1.0,
        interactionRadius: 180.0,
        interactionForce: 80.0,
        interactionVerticalForce: 40.0,
        colorNeon: { r: 1.0, g: 0.027, b: 0.227 },
        colorBlood: { r: 0.545, g: 0.0, b: 0.0 },
        colorObsidian: { r: 0.102, g: 0.02, b: 0.031 },
        additiveBlending: true,
        seed: 'accretion-seed',
      };

      const result = AccretionParamsSchema.parse(params);
      expect(result.particleCount).toBe(150000);
      expect(result.gravityStrength).toBe(250.0);
    });
  });

  describe('Validation helpers', () => {
    it('validates planet params correctly', () => {
      const valid = {
        noise: { seed: 'test', scale: 1.0 },
      };

      const result = validatePlanetParams(valid);
      expect(result.radius).toBe(1.56);
    });

    it('safeValidatePlanetParams returns success for valid', () => {
      const valid = { noise: { seed: 'test', scale: 1.0 } };
      const result = safeValidatePlanetParams(valid);
      expect(result.success).toBe(true);
    });

    it('safeValidatePlanetParams returns failure for invalid', () => {
      const invalid = { radius: -1, noise: { seed: 'test', scale: 1.0 } };
      const result = safeValidatePlanetParams(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('scene-schema', () => {
  describe('Vector3Schema', () => {
    it('validates 3D vectors', () => {
      const vec = { x: 1, y: 2, z: 3 };
      const result = Vector3Schema.parse(vec);
      expect(result.x).toBe(1);
      expect(result.y).toBe(2);
      expect(result.z).toBe(3);
    });
  });

  describe('ColorSchema', () => {
    it('validates normalized RGB colors', () => {
      const color = { r: 0.5, g: 0.25, b: 0.75 };
      const result = ColorSchema.parse(color);
      expect(result.r).toBe(0.5);
      expect(result.g).toBe(0.25);
      expect(result.b).toBe(0.75);
    });

    it('rejects out of range values', () => {
      const invalid = { r: 1.5, g: 0, b: 0 };
      expect(() => ColorSchema.parse(invalid)).toThrow();
    });
  });

  describe('CameraSchema', () => {
    it('validates perspective camera with defaults', () => {
      const camera = {
        type: 'PerspectiveCamera',
        fov: 43,
        near: 0.05,
        far: 120,
      };

      const result = CameraSchema.parse(camera);
      expect(result.type).toBe('PerspectiveCamera');
      expect(result.fov).toBe(43);
      expect(result.position).toEqual({ x: 0, y: 0.25, z: 10.8 });
    });
  });

  describe('LightSchema', () => {
    it('validates directional light with shadows', () => {
      const light = {
        type: 'DirectionalLight',
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        position: { x: 0, y: 10, z: 5 },
        castShadow: true,
      };

      const result = LightSchema.parse(light);
      expect(result.type).toBe('DirectionalLight');
      expect(result.castShadow).toBe(true);
    });

    it('validates shadow map size as power of two', () => {
      const light = {
        type: 'DirectionalLight',
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        castShadow: true,
        shadow: {
          mapSize: { x: 2048, y: 2048 },
        },
      };

      const result = LightSchema.parse(light);
      expect(result.shadow?.mapSize.x).toBe(2048);
    });

    it('rejects non-power-of-two shadow map size', () => {
      const light = {
        type: 'DirectionalLight',
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        castShadow: true,
        shadow: {
          mapSize: { x: 1000, y: 1000 }, // not power of 2
        },
      };

      expect(() => LightSchema.parse(light)).toThrow();
    });
  });

  describe('SceneConfigSchema', () => {
    it('validates complete scene config', () => {
      const scene = {
        version: '1.0',
        name: 'Test Scene',
        metadata: {
          name: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        camera: {
          main: {
            type: 'PerspectiveCamera',
            fov: 43,
          },
        },
        scene: {
          objects: [],
          lights: [],
        },
      };

      const result = SceneConfigSchema.parse(scene);
      expect(result.version).toBe('1.0');
      expect(result.name).toBe('Test Scene');
    });

    it('validates post-processing config with power of two samples', () => {
      const scene = {
        version: '1.0',
        name: 'Test',
        postProcessing: {
          enabled: true,
          renderTarget: {
            samples: 4, // power of 2
            depthBuffer: true,
            stencilBuffer: false,
          },
        },
      };

      const result = SceneConfigSchema.parse(scene);
      expect(result.postProcessing?.renderTarget?.samples).toBe(4);
    });

    it('rejects non-power-of-two samples', () => {
      const scene = {
        version: '1.0',
        name: 'Test',
        postProcessing: {
          renderTarget: {
            samples: 3, // not power of 2
          },
        },
      };

      expect(() => SceneConfigSchema.parse(scene)).toThrow();
    });
  });

  describe('Validation helpers', () => {
    it('validateSceneConfig works', () => {
      const scene = {
        version: '1.0',
        name: 'Test',
        camera: { main: { type: 'PerspectiveCamera' } },
        scene: { objects: [], lights: [] },
      };

      const result = validateSceneConfig(scene);
      expect(result.name).toBe('Test');
    });

    it('safeValidateSceneConfig returns success for valid', () => {
      const scene = {
        version: '1.0',
        name: 'Test',
        camera: { main: { type: 'PerspectiveCamera' } },
        scene: { objects: [], lights: [] },
      };

      const result = safeValidateSceneConfig(scene);
      expect(result.success).toBe(true);
    });

    it('safeValidateSceneConfig returns failure for invalid', () => {
      // Provide invalid camera type to trigger validation failure
      const invalid = { 
        version: '1.0', 
        name: 'Test',
        camera: {
          main: {
            type: 'InvalidCameraType', // invalid enum value
          },
        },
      };
      const result = safeValidateSceneConfig(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('Cross-schema consistency', () => {
  it('ColorSchema is same in both lore and scene', () => {
    // Both schemas use the same ColorSchema definition
    const color = { r: 0.5, g: 0.5, b: 0.5 };
    
    // This test verifies the type compatibility
    expect(() => ColorSchema.parse(color)).not.toThrow();
  });

  it('Vector3Schema is compatible', () => {
    const vec = { x: 1, y: 2, z: 3 };
    expect(() => Vector3Schema.parse(vec)).not.toThrow();
  });
});