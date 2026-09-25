/**
 * Machine Generator - Organic Machine with 432Hz Pulse
 *
 * Generates an organic machine with:
 * - Iris aperture with morph targets
 * - Rotating concentric rings
 * - 432Hz synchronized pulse emission
 * - Biological noise displacement
 * - Metallic PBR material
 */

import type {
  Color,
  MachineAnimationParams,
  MachineGeometryOutput,
  MachineMaterialParams,
  MachineOutput,
  MachineParams,
} from '@belentani/core';
import type { SimplexNoise } from '../noise';
import { createSimplexNoise } from '../noise';

export class MachineGenerator {
  private noise: SimplexNoise;

  constructor(seed: string | number = 'belentani-machine') {
    this.noise = createSimplexNoise(seed);
  }

  generate(params: MachineParams): MachineOutput {
    const {
      irisSegments = 12,
      ringCount = 3,
      ringRotationSpeed = 0.5,
      ringPhaseOffset = 0,
      pulseFrequency = 432,
      metalness = 0.8,
      roughness = 0.3,
      baseColor = { r: 0.4, g: 0.4, b: 0.45 },
      seed = 'belentani-machine',
      // Unused but kept for type completeness
      irisAperture,
      irisSpeed,
      ringSpacing,
      pulseAmplitude,
      pulseSync,
      biologicalNoise,
      scale,
    } = params;

    const geometry = this.generateGeometry(irisSegments, ringCount, params.scale ?? 1.0);
    const material = this.generateMaterialParams(metalness, roughness, baseColor);
    const animation = this.generateAnimationParams(
      irisSegments,
      ringCount,
      ringRotationSpeed,
      ringPhaseOffset,
      pulseFrequency,
      params.pulseAmplitude ?? 0.15,
      params.pulseSync ?? true,
      params.biologicalNoise ?? { scale: 10.0, speed: 0.5, amplitude: 0.1 }
    );

    return {
      geometry,
      material,
      animation,
      metadata: {
        seed,
        generator: 'MachineGenerator',
        version: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private generateGeometry(
    irisSegments: number,
    ringCount: number,
    _scale: number
  ): MachineGeometryOutput {
    // Iris: morph targets for aperture animation
    const irisVertices = irisSegments * 2; // inner + outer ring
    // Rings: instanced geometry
    const ringVertices = 64; // per ring
    const baseVertices = 200; // central body

    const totalVertices = irisVertices + ringCount * ringVertices + baseVertices;
    const totalFaces = totalVertices * 2;

    return {
      parts: 2 + ringCount, // iris + base + rings
      vertices: totalVertices,
      hasMorphTargets: true, // For iris aperture
    };
  }

  private generateMaterialParams(
    metalness: number,
    roughness: number,
    baseColor: Color
  ): MachineMaterialParams {
    return {
      metalness,
      roughness,
      color: baseColor,
      emissive: { r: 0.0, g: 0.0, b: 0.0 }, // Set by animation
      emissiveIntensity: 0.0, // Controlled by pulse
    };
  }

  private generateAnimationParams(
    irisSegments: number,
    ringCount: number,
    ringRotationSpeed: number,
    ringPhaseOffset: number,
    pulseFrequency: number,
    _pulseAmplitude: number,
    _pulseSync: boolean,
    _biologicalNoise: { scale: number; speed: number; amplitude: number }
  ): MachineAnimationParams {
    const irisMorphTargets: string[] = [];
    for (let i = 0; i <= irisSegments; i++) {
      irisMorphTargets.push(`irisAperture_${i}`);
    }

    const ringRotationSpeeds: number[] = [];
    for (let i = 0; i < ringCount; i++) {
      const speed = ringRotationSpeed * (1 + i * 0.2); // Each ring slightly different
      ringRotationSpeeds.push(speed);
    }

    return {
      irisMorphTargets,
      ringRotationSpeeds,
      pulseFrequency,
      biologicalNoise: true,
    };
  }

  // Generate biological noise displacement for organic feel
  generateBiologicalDisplacement(
    position: { x: number; y: number; z: number },
    time: number,
    params: MachineParams
  ): { x: number; y: number; z: number } {
    const { biologicalNoise = { scale: 10.0, speed: 0.5, amplitude: 0.1 } } = params;
    const noise = createSimplexNoise(params.seed || 'machine-bio');

    const scale = biologicalNoise.scale;
    const speed = biologicalNoise.speed;
    const amplitude = biologicalNoise.amplitude;

    const nx = position.x * scale + time * speed;
    const ny = position.y * scale + time * speed * 0.7;
    const nz = position.z * scale + time * speed * 1.3;

    return {
      x: noise.noise3D(nx, ny, nz) * amplitude,
      y: noise.noise3D(nx + 100, ny + 100, nz + 100) * amplitude,
      z: noise.noise3D(nx + 200, ny + 200, nz + 200) * amplitude,
    };
  }

  // Calculate iris morph target weights for given aperture
  calculateIrisWeights(aperture: number, segments: number): number[] {
    const weights = new Array(segments + 1).fill(0);
    const normalizedAperture = Math.max(0, Math.min(1, aperture));

    for (let i = 0; i <= segments; i++) {
      const targetAperture = i / segments;
      // Smooth transition between morph targets
      const diff = Math.abs(normalizedAperture - targetAperture);
      weights[i] = Math.max(0, 1 - diff * segments * 2);
    }

    // Normalize
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < weights.length; i++) {
        weights[i] /= sum;
      }
    }

    return weights;
  }
}
