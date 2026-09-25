/**
 * Atmosphere Generator - Procedural atmosphere parameters
 *
 * Generates Rayleigh/Mie scattering coefficients, cloud parameters
 * for volumetric atmosphere rendering
 */

import type { AtmosphereConfig } from '@belentani/core';
import { SimplexNoise } from '../noise';

export interface AtmosphereParams {
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
    noiseScale: number;
    noiseOctaves: number;
  };
}

export class AtmosphereGenerator {
  private noise: SimplexNoise;

  constructor(seed: number) {
    this.noise = new SimplexNoise(seed);
  }

  generate(config: AtmosphereConfig, planetRadius: number): AtmosphereParams {
    const validated = this.validateConfig(config);

    // Compute atmosphere extent
    planetRadius * 0.15; // 15% of planet radius (unused but calculated for reference)
    const atmosphereDensity = validated.density * (planetRadius / 1.56); // Scale with planet

    // Rayleigh scattering (molecular) - wavelength dependent
    // Blue scatters more (1/λ⁴)
    const rayleighScale = 1.0 / Math.pow(planetRadius, 0.5);
    const rayleighCoefficient = validated.rayleighCoefficient * rayleighScale;

    // Mie scattering (aerosols) - wavelength independent
    const mieCoefficient = validated.mieCoefficient * 0.1;

    // Cloud parameters
    let cloudParams: AtmosphereParams['clouds'];
    if (validated.clouds?.enabled) {
      cloudParams = {
        enabled: true,
        coverage: validated.clouds.coverage,
        height: validated.clouds.height * (planetRadius / 1.56),
        density: validated.clouds.density,
        noiseScale: 0.05 * (1.56 / planetRadius),
        noiseOctaves: 4,
      };
    }

    return {
      density: atmosphereDensity,
      rayleighCoefficient,
      mieCoefficient,
      sunIntensity: validated.sunIntensity,
      groundAlbedo: validated.groundAlbedo,
      clouds: cloudParams,
    };
  }

  generateDefault(planetRadius: number): AtmosphereParams {
    return this.generate(
      {
        enabled: true,
        density: 0.3,
        rayleighCoefficient: 2.5,
        mieCoefficient: 0.1,
        sunIntensity: 1.0,
        groundAlbedo: { r: 0.3, g: 0.3, b: 0.3 },
        clouds: {
          enabled: true,
          coverage: 0.4,
          height: 10,
          density: 0.5,
        },
      },
      planetRadius
    );
  }

  private validateConfig(config: AtmosphereConfig): Required<AtmosphereConfig> {
    return {
      enabled: config.enabled ?? true,
      density: config.density ?? 0.3,
      rayleighCoefficient: config.rayleighCoefficient ?? 2.5,
      mieCoefficient: config.mieCoefficient ?? 0.1,
      sunIntensity: config.sunIntensity ?? 1.0,
      groundAlbedo: config.groundAlbedo ?? { r: 0.3, g: 0.3, b: 0.3 },
      clouds: config.clouds
        ? {
            enabled: config.clouds.enabled ?? true,
            coverage: config.clouds.coverage ?? 0.4,
            height: config.clouds.height ?? 10,
            density: config.clouds.density ?? 0.5,
          }
        : {
            enabled: true,
            coverage: 0.4,
            height: 10,
            density: 0.5,
          },
    };
  }
}
