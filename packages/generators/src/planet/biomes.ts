/**
 * Biome System - Maps height/moisture/temperature to biome types
 *
 * Based on Whittaker biome classification adapted for procedural planets
 */

import type { BiomeConfig } from '@belentani/core';

export interface BiomeData {
  name: string;
  color: { r: number; g: number; b: number };
  vegetationDensity: number;
  temperature: number;
  moisture: number;
  heightRange: { min: number; max: number };
}

export class BiomeMap {
  private defaultBiomes: BiomeData[];

  constructor() {
    this.defaultBiomes = this.createDefaultBiomes();
  }

  private createDefaultBiomes(): BiomeData[] {
    return [
      // Deep ocean
      {
        name: 'deep_ocean',
        color: { r: 0.004, g: 0.015, b: 0.045 },
        vegetationDensity: 0,
        temperature: 0.3,
        moisture: 1.0,
        heightRange: { min: -1.0, max: -0.4 },
      },
      // Shallow ocean
      {
        name: 'shallow_ocean',
        color: { r: 0.004, g: 0.027, b: 0.055 },
        vegetationDensity: 0,
        temperature: 0.4,
        moisture: 1.0,
        heightRange: { min: -0.4, max: -0.15 },
      },
      // Beach/shore
      {
        name: 'beach',
        color: { r: 0.89, g: 0.82, b: 0.65 },
        vegetationDensity: 0.05,
        temperature: 0.6,
        moisture: 0.8,
        heightRange: { min: -0.15, max: -0.05 },
      },
      // Lowlands
      {
        name: 'lowlands',
        color: { r: 0.031, g: 0.047, b: 0.055 },
        vegetationDensity: 0.3,
        temperature: 0.55,
        moisture: 0.6,
        heightRange: { min: -0.05, max: 0.15 },
      },
      // Grasslands
      {
        name: 'grasslands',
        color: { r: 0.18, g: 0.45, b: 0.12 },
        vegetationDensity: 0.7,
        temperature: 0.6,
        moisture: 0.5,
        heightRange: { min: 0.15, max: 0.35 },
      },
      // Forest
      {
        name: 'forest',
        color: { r: 0.05, g: 0.35, b: 0.08 },
        vegetationDensity: 0.9,
        temperature: 0.65,
        moisture: 0.7,
        heightRange: { min: 0.35, max: 0.55 },
      },
      // Highlands
      {
        name: 'highlands',
        color: { r: 0.45, g: 0.42, b: 0.35 },
        vegetationDensity: 0.4,
        temperature: 0.5,
        moisture: 0.4,
        heightRange: { min: 0.55, max: 0.75 },
      },
      // Mountains
      {
        name: 'mountains',
        color: { r: 0.55, g: 0.52, b: 0.48 },
        vegetationDensity: 0.15,
        temperature: 0.35,
        moisture: 0.3,
        heightRange: { min: 0.75, max: 0.9 },
      },
      // Snow peaks
      {
        name: 'snow_peaks',
        color: { r: 0.95, g: 0.95, b: 0.98 },
        vegetationDensity: 0,
        temperature: 0.1,
        moisture: 0.2,
        heightRange: { min: 0.9, max: 1.0 },
      },
    ];
  }

  /**
   * Map height field to biome indices
   * Returns array of biome indices per vertex
   */
  map(heightField: Float32Array): Uint16Array {
    const biomeIndices = new Uint16Array(heightField.length);

    for (let i = 0; i < heightField.length; i++) {
      const height = heightField[i];
      biomeIndices[i] = this.getBiomeIndex(height);
    }

    return biomeIndices;
  }

  /**
   * Map with custom biomes
   */
  mapCustom(heightField: Float32Array, biomes: BiomeConfig[]): Uint16Array {
    // Sort biomes by height range
    const sortedBiomes = [...biomes].sort((a, b) => a.heightRange.min - b.heightRange.min);
    const biomeIndices = new Uint16Array(heightField.length);

    for (let i = 0; i < heightField.length; i++) {
      const height = heightField[i];
      biomeIndices[i] = this.getCustomBiomeIndex(height, sortedBiomes);
    }

    return biomeIndices;
  }

  /**
   * Get biome data by index
   */
  getBiomeData(index: number): BiomeData {
    return this.defaultBiomes[Math.min(index, this.defaultBiomes.length - 1)];
  }

  /**
   * Get all default biomes
   */
  getDefaultBiomes(): BiomeData[] {
    return [...this.defaultBiomes];
  }

  private getBiomeIndex(height: number): number {
    // Clamp height
    height = Math.max(-1, Math.min(1, height));

    // Find matching biome
    for (let i = 0; i < this.defaultBiomes.length; i++) {
      const biome = this.defaultBiomes[i];
      if (height >= biome.heightRange.min && height < biome.heightRange.max) {
        return i;
      }
    }

    // Default to last biome (snow peaks)
    return this.defaultBiomes.length - 1;
  }

  private getCustomBiomeIndex(height: number, biomes: BiomeConfig[]): number {
    height = Math.max(-1, Math.min(1, height));

    for (let i = 0; i < biomes.length; i++) {
      const biome = biomes[i];
      if (height >= biome.heightRange.min && height < biome.heightRange.max) {
        return i;
      }
    }

    return biomes.length - 1;
  }

  /**
   * Get smooth biome blending weights for transitions
   * Returns array of [biomeIndex, weight] pairs for smooth interpolation
   */
  getBlendedBiomes(height: number, blendWidth: number = 0.05): { index: number; weight: number }[] {
    height = Math.max(-1, Math.min(1, height));
    const results: { index: number; weight: number }[] = [];

    for (let i = 0; i < this.defaultBiomes.length; i++) {
      const biome = this.defaultBiomes[i];
      const center = (biome.heightRange.min + biome.heightRange.max) / 2;
      const halfWidth = (biome.heightRange.max - biome.heightRange.min) / 2 + blendWidth;

      const dist = Math.abs(height - center);
      if (dist < halfWidth) {
        const weight = 1 - dist / halfWidth;
        if (weight > 0) {
          results.push({ index: i, weight });
        }
      }
    }

    // Normalize weights
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight > 0) {
      results.forEach((r) => (r.weight /= totalWeight));
    }

    return results.sort((a, b) => b.weight - a.weight);
  }
}
