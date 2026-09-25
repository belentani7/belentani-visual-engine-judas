import { describe, it, expect } from 'vitest';
import { SimplexNoise, createSimplexNoise } from '../src/noise';
import { BiomeMap } from '../src/biomes';
import { PlanetGenerator } from '../src/planet/PlanetGenerator';
import { DiamondGenerator } from '../src/diamond/DiamondGenerator';
import { KeyGenerator } from '../src/key/KeyGenerator';
import { MachineGenerator } from '../src/machine/MachineGenerator';
import { MirrorGenerator } from '../src/mirror/MirrorGenerator';
import { AccretionGenerator } from '../src/accretion/AccretionGenerator';
import { SceneComposer } from '../src/SceneComposer';

import type { PlanetParams, DiamondParams, KeyParams, MachineParams, MirrorParams, AccretionParams } from '@belentani/core';

describe('noise', () => {
  describe('SimplexNoise', () => {
    it('creates deterministic noise with same seed', () => {
      const noise1 = new SimplexNoise('test-seed');
      const noise2 = new SimplexNoise('test-seed');
      
      expect(noise1.noise2D(0.5, 0.5)).toBe(noise2.noise2D(0.5, 0.5));
      expect(noise1.noise3D(1, 2, 3)).toBe(noise2.noise3D(1, 2, 3));
    });

    it('produces different noise with different seeds', () => {
      const noise1 = new SimplexNoise('seed-1');
      const noise2 = new SimplexNoise('seed-2');
      
      expect(noise1.noise2D(0.5, 0.5)).not.toBe(noise2.noise2D(0.5, 0.5));
    });

    it('noise2D returns values in [-1, 1]', () => {
      const noise = new SimplexNoise('test');
      for (let i = 0; i < 100; i++) {
        const val = noise.noise2D(Math.random() * 10, Math.random() * 10);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('noise3D returns values in [-1, 1]', () => {
      const noise = new SimplexNoise('test');
      for (let i = 0; i < 100; i++) {
        const val = noise.noise3D(Math.random() * 10, Math.random() * 10, Math.random() * 10);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('fbm produces smoother values', () => {
      const noise = new SimplexNoise('test');
      const val = noise.fbm(0.5, 0.5, 4);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    });

    it('fbm3D works', () => {
      const noise = new SimplexNoise('test');
      const val = noise.fbm3D(0.5, 0.5, 0.5, 4);
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  describe('createSimplexNoise', () => {
    it('returns SimplexNoise instance', () => {
      const noise = createSimplexNoise('test');
      expect(noise).toBeInstanceOf(SimplexNoise);
    });
  });
});

describe('BiomeMap', () => {
  it('creates with default biomes', () => {
    const biomes = new BiomeMap('test-seed');
    expect(biomes.biomes.length).toBeGreaterThan(0);
  });

  it('maps height to biome', () => {
    const biomes = new BiomeMap('test-seed');
    const oceanBiome = biomes.getBiomeAtHeight(-0.5);
    expect(oceanBiome.name).toContain('ocean');
    
    const peakBiome = biomes.getBiomeAtHeight(0.9);
    expect(peakBiome.name).toContain('peak');
  });

  it('generates moisture map', () => {
    const biomes = new BiomeMap('test-seed');
    const moisture = biomes.generateMoistureMap(10, 10);
    expect(moisture.length).toBe(100);
    expect(moisture[0]).toBeGreaterThanOrEqual(0);
    expect(moisture[0]).toBeLessThanOrEqual(1);
  });

  it('generates temperature map', () => {
    const biomes = new BiomeMap('test-seed');
    const temp = biomes.generateTemperatureMap(10, 10);
    expect(temp.length).toBe(100);
    expect(temp[0]).toBeGreaterThanOrEqual(0);
    expect(temp[0]).toBeLessThanOrEqual(1);
  });
});

describe('PlanetGenerator', () => {
  it('generates planet with default params', () => {
    const generator = new PlanetGenerator('test-planet');
    const params: PlanetParams = {
      noise: { seed: 'test', scale: 3.4, octaves: 5, persistence: 0.5, lacunarity: 2.0 },
    };
    const output = generator.generate(params);
    
    expect(output.geometry).toBeDefined();
    expect(output.geometry.radius).toBeGreaterThan(0);
    expect(output.geometry.heightField).toBeInstanceOf(Float32Array);
    expect(output.material).toBeDefined();
    expect(output.metadata.generator).toBe('PlanetGenerator');
  });

  it('generates reproducible output with same seed', () => {
    const gen1 = new PlanetGenerator('same-seed');
    const gen2 = new PlanetGenerator('same-seed');
    const params: PlanetParams = { noise: { seed: 'test', scale: 1 } };
    
    const out1 = gen1.generate(params);
    const out2 = gen2.generate(params);
    
    expect(out1.geometry.heightField[0]).toBe(out2.geometry.heightField[0]);
  });

  it('generates icosphere geometry', () => {
    const generator = new PlanetGenerator('test');
    // Access private method via generate
    const params: PlanetParams = { noise: { seed: 'test', scale: 1 } };
    const output = generator.generate(params);
    
    expect(output.geometry.vertices).toBeGreaterThan(0);
    expect(output.geometry.faces).toBeGreaterThan(0);
  });
});

describe('DiamondGenerator', () => {
  it('generates diamond with physical constants', () => {
    const generator = new DiamondGenerator();
    const params: DiamondParams = {
      ior: 2.417,
      dispersion: 0.044,
      cutQuality: 'ideal',
    };
    const output = generator.generate(params);
    
    expect(output.material.ior).toBe(2.417);
    expect(output.material.dispersion).toBe(0.044);
    expect(output.material.transmission).toBe(1.0);
    expect(output.metadata.generator).toBe('DiamondGenerator');
  });

  it('validates caustics resolution power of two', () => {
    const generator = new DiamondGenerator();
    const params: DiamondParams = {
      ior: 2.417,
      dispersion: 0.044,
      causticsResolution: 2048,
    };
    const output = generator.generate(params);
    expect(output.caustics?.resolution).toBe(2048);
  });
});

describe('KeyGenerator', () => {
  it('generates key with 432Hz pulse', () => {
    const generator = new KeyGenerator('test-key');
    const params: KeyParams = {
      pulseFrequency: 432,
      pulseEnabled: true,
      goldHue: 48,
    };
    const output = generator.generate(params);
    
    expect(output.animation?.pulseFrequency).toBe(432);
    expect(output.material.metalness).toBe(1.0);
    expect(output.metadata.generator).toBe('KeyGenerator');
  });

  it('generates scratch map', () => {
    const generator = new KeyGenerator('test');
    const params: KeyParams = {
      scratchDensity: 0.3,
      scratchScale: 50,
    };
    const scratchMap = generator.generateScratchMap(64, 64, params);
    expect(scratchMap.length).toBe(64 * 64 * 3);
  });
});

describe('MachineGenerator', () => {
  it('generates machine with 432Hz sync', () => {
    const generator = new MachineGenerator('test-machine');
    const params: MachineParams = {
      pulseFrequency: 432,
      pulseSync: true,
      ringCount: 3,
    };
    const output = generator.generate(params);
    
    expect(output.animation?.pulseFrequency).toBe(432);
    expect(output.animation?.ringRotationSpeeds.length).toBe(3);
    expect(output.metadata.generator).toBe('MachineGenerator');
  });

  it('calculates iris weights', () => {
    const generator = new MachineGenerator('test');
    const weights = generator.calculateIrisWeights(0.5, 12);
    expect(weights.length).toBe(13);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe('MirrorGenerator', () => {
  it('generates mirror with portal types', () => {
    const generator = new MirrorGenerator('test-mirror');
    const params: MirrorParams = {
      portalType: 'nexus',
      fractureLevel: 0.0,
      nexusConnections: 3,
    };
    const output = generator.generate(params);
    
    expect(output.portal?.type).toBe('nexus');
    expect(output.portal?.connections).toBe(3);
    expect(output.metadata.generator).toBe('MirrorGenerator');
  });

  it('generates fracture pattern', () => {
    const generator = new MirrorGenerator('test');
    const pattern = generator.generateFracturePattern(100, 0.5, 'test');
    expect(pattern.length).toBe(256 * 256);
  });
});

describe('AccretionGenerator', () => {
  it('generates accretion disk with GPU params', () => {
    const generator = new AccretionGenerator('test-accretion');
    const params: AccretionParams = {
      particleCount: 10000,
      innerRadius: 50,
      outerRadius: 500,
    };
    const output = generator.generate(params);
    
    expect(output.geometry.particleCount).toBe(10000);
    expect(output.material.uniforms).toBeDefined();
    expect(output.material.vertexShader).toContain('computeOrbit');
    expect(output.metadata.generator).toBe('AccretionGenerator');
  });

  it('generates particle data', () => {
    const generator = new AccretionGenerator('test');
    const params: AccretionParams = {
      particleCount: 1000,
    };
    const data = generator.generateParticleData(params);
    
    expect(data.positions.length).toBe(1000 * 3);
    expect(data.basePositions.length).toBe(1000 * 3);
    expect(data.orbitParams.length).toBe(1000 * 4);
  });
});

describe('SceneComposer', () => {
  it('composes scene from all generators', () => {
    const composer = new SceneComposer('test-scene');
    
    // Minimal mock generators
    const generators = {
      planet: {
        metadata: { version: '1.0', generator: 'PlanetGenerator' },
        geometry: { radius: 1.56, heightField: new Float32Array([0.5]), segments: 6, vertices: 12, faces: 20 },
        material: { noiseScale: 3.4, mountainHeight: 0.16, breathSpeed: 1.35, veinColor: { r: 1, g: 0, b: 0.236 }, veinHotColor: { r: 1, g: 0.157, b: 0.561 }, oceanColor: { r: 0.004, g: 0.027, b: 0.055 }, landColor: { r: 0.031, g: 0.047, b: 0.055 } },
      },
      diamond: {
        metadata: { version: '1.0', generator: 'DiamondGenerator' },
        geometry: { vertices: 60, faces: 100, uvs: true, normals: true, tangent: true },
        material: { ior: 2.417, dispersion: 0.044, transmission: 1.0, thickness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.0, metalness: 0.0, roughness: 0.02 },
      },
      key: {
        metadata: { version: '1.0', generator: 'KeyGenerator' },
        geometry: { vertices: 500, faces: 900, hasMorphTargets: false },
        material: { color: { r: 1, g: 0.83, b: 0.36 }, metalness: 1.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, emissive: { r: 1, g: 0.83, b: 0.36 }, emissiveIntensity: 0.3 },
        animation: { pulseFrequency: 432, pulsePhase: 0 },
      },
      machine: {
        metadata: { version: '1.0', generator: 'MachineGenerator' },
        geometry: { parts: 5, vertices: 500, hasMorphTargets: true },
        material: { metalness: 0.8, roughness: 0.3, color: { r: 0.4, g: 0.4, b: 0.45 }, emissive: { r: 0, g: 0, b: 0 }, emissiveIntensity: 0 },
        animation: { irisMorphTargets: [], ringRotationSpeeds: [0.5, 0.6, 0.7], pulseFrequency: 432, biologicalNoise: true },
      },
      mirror: {
        metadata: { version: '1.0', generator: 'MirrorGenerator' },
        geometry: { type: 'plane', vertices: 4, renderTargets: 2 },
        material: { refractionIndex: 1.5, dispersion: 0.01, transmission: 0.9, thickness: 0.1 },
        portal: { type: 'nexus', connections: 3, pulseEnabled: true },
        effects: { glitch: false, fracture: false, renderTargetReflection: true },
      },
      accretion: {
        metadata: { version: '1.0', generator: 'AccretionGenerator' },
        geometry: { particleCount: 150000, attributes: ['position', 'aBasePos', 'aColor', 'aSize', 'aRandom', 'aOrbitParams'] },
        material: { uniforms: {}, vertexShader: '', fragmentShader: '', transparent: true, depthWrite: false, blending: 'AdditiveBlending' },
        physics: { gravityStrength: 250, innerRadius: 50, outerRadius: 500 },
      },
    };

    const scene = composer.compose(generators);
    
    expect(scene.version).toBe('1.0');
    expect(scene.planet).toBeDefined();
    expect(scene.diamond).toBeDefined();
    expect(scene.key).toBeDefined();
    expect(scene.machine).toBeDefined();
    expect(scene.mirror).toBeDefined();
    expect(scene.accretion).toBeDefined();
    expect(scene.camera).toBeDefined();
    expect(scene.lights.length).toBeGreaterThan(0);
    expect(scene.postProcessing.bloom.enabled).toBe(true);
    expect(scene.metadata.generatorVersions.planet).toBe('1.0');
  });

  it('validates required generators', () => {
    const composer = new SceneComposer('test');
    const incomplete = { planet: undefined as any };
    const result = composer.validate(incomplete);
    
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('applies custom camera and lights', () => {
    const composer = new SceneComposer('test');
    const generators: any = {}; // All required
    
    const scene = composer.compose(generators, {
      camera: { fov: 60, position: { x: 5, y: 5, z: 5 } },
      lights: [{ type: 'PointLight', color: { r: 1, g: 1, b: 1 }, intensity: 2, position: { x: 0, y: 5, z: 0 } }],
    });
    
    expect(scene.camera.fov).toBe(60);
    expect(scene.lights[0].type).toBe('PointLight');
  });
});

describe('Cross-generator integration', () => {
  it('all generators produce compatible outputs for SceneComposer', () => {
    const composer = new SceneComposer('integration-test');
    
    const seed = 'integration-seed';
    const planetGen = new PlanetGenerator(seed);
    const diamondGen = new DiamondGenerator(seed);
    const keyGen = new KeyGenerator(seed);
    const machineGen = new MachineGenerator(seed);
    const mirrorGen = new MirrorGenerator(seed);
    const accretionGen = new AccretionGenerator(seed);

    const planetParams: PlanetParams = { noise: { seed, scale: 1 } };
    const diamondParams: DiamondParams = { ior: 2.417, dispersion: 0.044 };
    const keyParams: KeyParams = { pulseFrequency: 432 };
    const machineParams: MachineParams = { pulseFrequency: 432 };
    const mirrorParams: MirrorParams = { portalType: 'mirror' };
    const accretionParams: AccretionParams = { particleCount: 1000 };

    const generators = {
      planet: planetGen.generate(planetParams),
      diamond: diamondGen.generate(diamondParams),
      key: keyGen.generate(keyParams),
      machine: machineGen.generate(machineParams),
      mirror: mirrorGen.generate(mirrorParams),
      accretion: accretionGen.generate(accretionParams),
    };

    const composer2 = new SceneComposer(seed);
    const scene = composer2.compose(generators);

    expect(scene.planet).toBeDefined();
    expect(scene.diamond).toBeDefined();
    expect(scene.key).toBeDefined();
    expect(scene.machine).toBeDefined();
    expect(scene.mirror).toBeDefined();
    expect(scene.accretion).toBeDefined();
    
    // All use same seed for reproducibility
    expect(scene.metadata.seed).toBe(seed);
  });
});