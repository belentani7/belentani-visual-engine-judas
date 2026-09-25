/**
 * Biome Mapping System for Planetary Generation
 *
 * Maps height and moisture values to biome types with associated properties.
 */

import type { BiomeConfig, Color } from '@belentani/core';
import type { SimplexNoise } from './noise';
import { createSimplexNoise } from './noise';

export interface BiomeProperties {
  name: string;
  color: Color;
  temperature: number; // 0-1
  moisture: number; // 0-1
  vegetation: number; // 0-1
  roughness: number; // 0-1
  metalness: number; // 0-1
  emissive?: Color;
  emissiveIntensity?: number;
}

export class BiomeMap {
  private noise: SimplexNoise;
  private biomes: BiomeConfig[];

  constructor(seed: string | number, biomes?: BiomeConfig[]) {
    this.noise = createSimplexNoise(seed);
    this.biomes = biomes || this.getDefaultBiomes();
    this.biomes.sort((a, b) => a.heightRange.min - b.heightRange.min);
  }

  private getDefaultBiomes(): BiomeConfig[] {
    return [
      {
        name: 'deep_ocean',
        heightRange: { min: -1.0, max: -0.4 },
        moistureRange: { min: 0.8, max: 1.0 },
        temperatureRange: { min: 0.0, max: 1.0 },
        color: { r: 0.004, g: 0.027, b: 0.055 },
        vegetationDensity: 0.0,
      },
      {
        name: 'ocean',
        heightRange: { min: -0.4, max: -0.1 },
        moistureRange: { min: 0.8, max: 1.0 },
        temperatureRange: { min: 0.0, max: 1.0 },
        color: { r: 0.02, g: 0.15, b: 0.35 },
        vegetationDensity: 0.0,
      },
      {
        name: 'coast',
        heightRange: { min: -0.1, max: 0.02 },
        moistureRange: { min: 0.6, max: 1.0 },
        temperatureRange: { min: 0.0, max: 1.0 },
        color: { r: 0.85, g: 0.75, b: 0.55 },
        vegetationDensity: 0.1,
      },
      {
        name: 'plains',
        heightRange: { min: 0.02, max: 0.25 },
        moistureRange: { min: 0.3, max: 0.7 },
        temperatureRange: { min: 0.3, max: 0.7 },
        color: { r: 0.25, g: 0.45, b: 0.15 },
        vegetationDensity: 0.6,
      },
      {
        name: 'forest',
        heightRange: { min: 0.02, max: 0.35 },
        moistureRange: { min: 0.6, max: 1.0 },
        temperatureRange: { min: 0.2, max: 0.8 },
        color: { r: 0.1, g: 0.35, b: 0.1 },
        vegetationDensity: 0.9,
      },
      {
        name: 'mountains',
        heightRange: { min: 0.35, max: 0.65 },
        moistureRange: { min: 0.0, max: 0.6 },
        temperatureRange: { min: 0.0, max: 0.5 },
        color: { r: 0.45, g: 0.4, b: 0.35 },
        vegetationDensity: 0.3,
      },
      {
        name: 'high_mountains',
        heightRange: { min: 0.65, max: 0.85 },
        moistureRange: { min: 0.0, max: 0.4 },
        temperatureRange: { min: 0.0, max: 0.3 },
        color: { r: 0.6, g: 0.55, b: 0.5 },
        vegetationDensity: 0.1,
      },
      {
        name: 'peaks',
        heightRange: { min: 0.85, max: 1.0 },
        moistureRange: { min: 0.0, max: 0.2 },
        temperatureRange: { min: 0.0, max: 0.2 },
        color: { r: 0.9, g: 0.9, b: 0.95 },
        vegetationDensity: 0.0,
      },
    ];
  }

  // Get biome at normalized height (0-1) with moisture/temperature variation
  getBiomeAtHeight(height: number, _moisture?: number, _temperature?: number): BiomeConfig {
    // Find biome by height range
    for (const biome of this.biomes) {
      if (height >= biome.heightRange.min && height <= biome.heightRange.max) {
        return biome;
      }
    }
    // Fallback to last biome
    return this.biomes[this.biomes.length - 1];
  }

  // Get biome with full parameter consideration
  getBiome(height: number, moisture: number = 0.5, temperature: number = 0.5): BiomeConfig {
    let bestBiome = this.biomes[0];
    let bestScore = -1;

    for (const biome of this.biomes) {
      if (height < biome.heightRange.min || height > biome.heightRange.max) continue;

      const moistureScore =
        1 - Math.abs(moisture - (biome.moistureRange.min + biome.moistureRange.max) / 2);
      const tempScore =
        1 - Math.abs(temperature - (biome.temperatureRange.min + biome.temperatureRange.max) / 2);
      const score = moistureScore * 0.5 + tempScore * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestBiome = biome;
      }
    }

    return bestBiome;
  }

  // Map entire height field to biome indices
  mapHeightField(heightField: Float32Array): Uint8Array {
    const biomeIndices = new Uint8Array(heightField.length);
    for (let i = 0; i < heightField.length; i++) {
      const biome = this.getBiomeAtHeight(heightField[i]);
      biomeIndices[i] = this.biomes.indexOf(biome);
    }
    return biomeIndices;
  }

  // Get biome properties for material
  getBiomeProperties(biome: BiomeConfig): BiomeProperties {
    return {
      name: biome.name,
      color: biome.color,
      temperature: (biome.temperatureRange.min + biome.temperatureRange.max) / 2,
      moisture: (biome.moistureRange.min + biome.moistureRange.max) / 2,
      vegetation: biome.vegetationDensity,
      roughness: biome.name.includes('ocean') ? 0.05 : 0.7,
      metalness: 0.0,
    };
  }

  // Generate moisture map using noise
  generateMoistureMap(width: number, height: number, scale: number = 0.01): Float32Array {
    const moisture = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        moisture[y * width + x] = (this.noise.noise2D(x * scale, y * scale) + 1) * 0.5;
      }
    }
    return moisture;
  }

  // Generate temperature map (latitude-based + noise)
  generateTemperatureMap(width: number, height: number, _axialTilt: number = 0.41): Float32Array {
    const temp = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const lat = (y / height) * 2 - 1; // -1 to 1
      const baseTemp = 1 - Math.abs(lat); // Equator hot, poles cold
      for (let x = 0; x < width; x++) {
        const noise = this.noise.noise2D(x * 0.005, y * 0.005) * 0.1;
        temp[y * width + x] = Math.max(0, Math.min(1, baseTemp + noise));
      }
    }
    return temp;
  }
}
