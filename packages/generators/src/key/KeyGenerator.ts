/**
 * Key Generator - Ceremonial Golden Key with PBR Material
 *
 * Generates a golden key with:
 * - Gold PBR material (metalness=1, roughness=0.1)
 * - Clearcoat for ceremonial shine
 * - Procedural micro-scratches (normal map)
 * - Engraving patterns (sigil, geometric, organic)
 * - 432Hz ritual pulse emission
 */

import type {
  Color,
  KeyGeometryOutput,
  KeyMaterialParams,
  KeyOutput,
  KeyParams,
} from '@belentani/core';
import type { SimplexNoise } from '../noise';
import { createSimplexNoise } from '../noise';

export class KeyGenerator {
  private noise: SimplexNoise;

  constructor(seed: string | number = 'belentani-key') {
    this.noise = createSimplexNoise(seed);
  }

  generate(params: KeyParams): KeyOutput {
    const {
      goldHue = 48,
      goldSaturation = 0.85,
      metalness = 1.0,
      roughness = 0.1,
      clearcoat = 1.0,
      clearcoatRoughness = 0.05,
      scratchDensity = 0.3,
      scratchScale = 50.0,
      scratchAnisotropy = 0.5,
      pulseEnabled = true,
      pulseFrequency = 432,
      pulseColor = { r: 1.0, g: 0.83, b: 0.36 },
      length = 0.15,
      width = 0.04,
      thickness = 0.005,
      seed = 'belentani-key',
      // Unused but kept for type completeness
      engravingDepth,
      engravingPattern,
      pulseIntensity,
    } = params;

    const geometry = this.generateGeometry(length, width, thickness);
    const material = this.generateMaterialParams(
      goldHue,
      goldSaturation,
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      scratchDensity,
      scratchScale,
      scratchAnisotropy,
      pulseColor
    );
    const animation = pulseEnabled
      ? {
          pulseFrequency,
          pulsePhase: 0,
        }
      : undefined;

    return {
      geometry,
      material,
      animation,
      metadata: {
        seed,
        generator: 'KeyGenerator',
        version: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private generateGeometry(length: number, width: number, _thickness: number): KeyGeometryOutput {
    // Key proportions: bow (head) + shank + bit
    const _bowRadius = width * 1.5;
    const _shankLength = length * 0.6;
    const _bitLength = length * 0.3;

    // Estimate vertices for a detailed key mesh
    const vertices = 500; // bow (128) + shank (200) + bit (172)
    const faces = 900;
    const hasMorphTargets = false; // Key doesn't typically morph

    return {
      vertices,
      faces,
      hasMorphTargets,
    };
  }

  private generateMaterialParams(
    goldHue: number,
    goldSaturation: number,
    metalness: number,
    roughness: number,
    clearcoat: number,
    clearcoatRoughness: number,
    scratchDensity: number,
    scratchScale: number,
    scratchAnisotropy: number,
    pulseColor: Color
  ): KeyMaterialParams {
    // Convert HSL to RGB for gold color
    const goldColor = this.hslToRgb(goldHue / 360, goldSaturation, 0.55);

    return {
      color: goldColor,
      metalness,
      roughness,
      clearcoat,
      clearcoatRoughness,
      emissive: pulseColor,
      emissiveIntensity: 0.0, // Controlled by animation
    };
  }

  private hslToRgb(h: number, s: number, l: number): Color {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
  }

  // Generate scratch normal map data
  generateScratchMap(width: number, height: number, params: KeyParams): Float32Array {
    const { scratchDensity = 0.3, scratchScale = 50.0, scratchAnisotropy = 0.5 } = params;
    const noise = createSimplexNoise(params.seed || 'key-scratch');
    const data = new Float32Array(width * height * 3); // RGB normal map

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width - 0.5) * scratchScale;
        const ny = (y / height - 0.5) * scratchScale;

        // Anisotropic scratches - elongated in one direction
        const scratchX = noise.noise2D(nx * scratchAnisotropy, ny / scratchAnisotropy);
        const scratchY = noise.noise2D(nx / scratchAnisotropy, ny * scratchAnisotropy);

        // Combine for scratch pattern
        const scratch = Math.max(0, (scratchX + scratchY) * 0.5);
        const threshold = 1 - scratchDensity;
        const hasScratch = scratch > threshold ? (scratch - threshold) / (1 - threshold) : 0;

        // Normal perturbation
        const normalX = hasScratch * 0.1;
        const normalY = hasScratch * 0.05;
        const normalZ = Math.sqrt(1 - normalX * normalX - normalY * normalY);

        const idx = (y * width + x) * 3;
        data[idx] = (normalX + 1) * 0.5;
        data[idx + 1] = (normalY + 1) * 0.5;
        data[idx + 2] = (normalZ + 1) * 0.5;
      }
    }

    return data;
  }

  // Generate engraving pattern
  generateEngraving(params: KeyParams): { pattern: string; depth: number } {
    const { engravingPattern = 'sigil', engravingDepth = 0.002 } = params;

    const patterns = {
      sigil: 'belentani-sigil',
      geometric: 'geometric-border',
      organic: 'vine-pattern',
      none: 'none',
    };

    return {
      pattern: patterns[engravingPattern] || 'none',
      depth: engravingDepth,
    };
  }
}
