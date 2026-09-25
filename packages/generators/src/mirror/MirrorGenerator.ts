/**
 * Mirror Generator - Nexus/Void/Portal Effects
 *
 * Generates mirror/portal surfaces with:
 * - Refraction with dispersion
 * - Glitch/fracture effects
 * - Void depth rendering
 * - Nexus connections (portal network)
 * - Render targets for reflection/refraction
 */

import type {
  MirrorEffectsParams,
  MirrorGeometryOutput,
  MirrorMaterialParams,
  MirrorOutput,
  MirrorParams,
  MirrorPortalParams,
} from '@belentani/core';
import type { SimplexNoise } from '../noise';
import { createSimplexNoise } from '../noise';

export class MirrorGenerator {
  private noise: SimplexNoise;

  constructor(seed: string | number = 'belentani-mirror') {
    this.noise = createSimplexNoise(seed);
  }

  generate(params: MirrorParams): MirrorOutput {
    const {
      portalType = 'mirror',
      fractureLevel = 0.0,
      refractionIndex = 1.5,
      refractionDispersion = 0.01,
      glitchIntensity = 0.0,
      nexusConnections = 3,
      nexusDistance = 20.0,
      nexusPulse = true,
      geometryType = 'plane',
      size = 5.0,
      seed = 'belentani-mirror',
      // Unused but kept for type completeness
      fractureScale,
      fractureAnimation,
      glitchSpeed,
      glitchScale,
      voidDepth,
      voidColor,
    } = params;

    const geometry = this.generateGeometry(geometryType, size, fractureLevel);
    const material = this.generateMaterialParams(refractionIndex, refractionDispersion);
    const portal = this.generatePortalParams(
      portalType,
      nexusConnections,
      nexusDistance,
      nexusPulse
    );
    const effects = this.generateEffectsParams(fractureLevel, glitchIntensity, portalType);

    return {
      geometry,
      material,
      portal,
      effects,
      metadata: {
        seed,
        generator: 'MirrorGenerator',
        version: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private generateGeometry(
    type: string,
    size: number,
    fractureLevel: number
  ): MirrorGeometryOutput {
    let vertices = 0;
    let renderTargets = 2; // Reflection + Refraction

    switch (type) {
      case 'plane':
        vertices = 4; // Quad
        break;
      case 'sphere':
        vertices = 64 * 64; // Sphere
        renderTargets = 6; // Cube map for sphere
        break;
      case 'torus':
        vertices = 32 * 32; // Torus
        break;
      case 'fractal':
        vertices = 128 * 128; // Displaced plane
        break;
    }

    // Fracture adds extra vertices for shards
    if (fractureLevel > 0) {
      vertices = Math.floor(vertices * (1 + fractureLevel * 3));
    }

    return {
      type,
      vertices,
      renderTargets,
    };
  }

  private generateMaterialParams(
    refractionIndex: number,
    refractionDispersion: number
  ): MirrorMaterialParams {
    return {
      refractionIndex,
      dispersion: refractionDispersion,
      transmission: 0.9,
      thickness: 0.1,
    };
  }

  private generatePortalParams(
    type: string,
    connections: number,
    distance: number,
    pulse: boolean
  ): MirrorPortalParams | undefined {
    if (type === 'mirror' && connections === 0) return undefined;

    return {
      type,
      connections,
      pulseEnabled: pulse,
    };
  }

  private generateEffectsParams(
    fractureLevel: number,
    glitchIntensity: number,
    type: string
  ): MirrorEffectsParams {
    return {
      glitch: glitchIntensity > 0,
      fracture: fractureLevel > 0,
      renderTargetReflection: type !== 'void', // Void doesn't reflect
    };
  }

  // Generate fracture pattern for shattered mirror
  generateFracturePattern(
    size: number,
    fractureLevel: number,
    seed: string | number
  ): Float32Array {
    const noise = createSimplexNoise(seed);
    const resolution = 256;
    const data = new Float32Array(resolution * resolution);

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const nx = (x / resolution) * size;
        const ny = (y / resolution) * size;

        // Voronoi-like fracture pattern using noise
        const n = noise.noise2D(nx * 0.1, ny * 0.1);
        const fracture = Math.max(0, n - (1 - fractureLevel));

        data[y * resolution + x] = fracture;
      }
    }

    return data;
  }

  // Generate glitch offset for UV distortion
  generateGlitchOffset(
    time: number,
    intensity: number,
    speed: number,
    scale: number
  ): { x: number; y: number } {
    if (intensity <= 0) return { x: 0, y: 0 };

    const noise = createSimplexNoise('glitch');
    const t = time * speed;

    // Block glitch - discrete jumps
    const blockX = Math.floor(noise.noise2D(t, 0) * 10) / 10;
    const blockY = Math.floor(noise.noise2D(0, t) * 10) / 10;

    // Line glitch - horizontal tears
    const lineY = Math.floor(noise.noise2D(t * 2, 100) * 20) / 20;

    return {
      x: ((blockX + noise.noise2D(t * 3, 200) * 0.1) * intensity) / scale,
      y: ((blockY + lineY * 0.05) * intensity) / scale,
    };
  }
}
