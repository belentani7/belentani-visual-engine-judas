/**
 * Planet Generator - Procedural Living Planet
 *
 * Generates a complete planet with:
 * - FBM terrain displacement (CPU geometry + GPU material)
 * - Biome system with height/moisture/temperature mapping
 * - Atmospheric scattering (Rayleigh/Mie)
 * - Aurora polar effects
 * - Breathing animation (subtle pulsation)
 * - Vein/glow network
 * - Volumetric clouds
 */

import type { PlanetOutput, PlanetParams } from '@belentani/core';
import { SeededRandom, SimplexNoise, Vec3 } from '../noise';
import { AtmosphereGenerator } from './atmosphere';
import { BiomeMap } from './biomes';

export class PlanetGenerator {
  private noise: SimplexNoise;
  private biomes: BiomeMap;
  private atmosphere: AtmosphereGenerator;
  private random: SeededRandom;

  constructor(seed: string | number) {
    const seedNum = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.noise = new SimplexNoise(seedNum);
    this.biomes = new BiomeMap();
    this.atmosphere = new AtmosphereGenerator(seedNum + 1);
    this.random = new SeededRandom(seedNum + 2);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  generate(params: PlanetParams): PlanetOutput {
    const validated = this.validateParams(params);

    // Generate height field (CPU for geometry/collision)
    const heightField = this.computeHeightField(validated);

    // Map biomes
    const biomeMap =
      validated.biomes && validated.biomes.length > 0
        ? this.biomes.mapCustom(heightField, validated.biomes)
        : this.biomes.map(heightField);

    // Compute vein/glow parameters
    this.computeVeinParams(validated);

    // Compute atmosphere
    const atmosphereParams = validated.atmosphere
      ? this.atmosphere.generate(validated.atmosphere, validated.radius)
      : this.atmosphere.generateDefault(validated.radius);

    // Generate geometry data
    const segments = validated.segments;
    const vertexCount = this.calcVertexCount(segments);
    const faceCount = this.calcFaceCount(segments);

    const output: PlanetOutput = {
      geometry: {
        radius: validated.radius,
        heightField,
        segments,
        vertices: vertexCount,
        faces: faceCount,
      },
      material: {
        noiseScale: validated.noise.scale,
        mountainHeight: validated.mountainHeight,
        detailScale: validated.detailScale,
        detailStrength: validated.detailStrength,
        breathSpeed: validated.breathSpeed,
        breathAmplitude: validated.breathAmplitude,
        veinColor: validated.veinColor,
        veinHotColor: validated.veinHotColor,
        veinThreshold: validated.veinThreshold,
        veinMicroThreshold: validated.veinMicroThreshold,
        oceanColor: validated.oceanColor,
        landColor: validated.landColor,
        biomes: biomeMap,
      },
      atmosphere: atmosphereParams
        ? {
            density: atmosphereParams.density,
            rayleigh: atmosphereParams.rayleighCoefficient,
            mie: atmosphereParams.mieCoefficient,
            clouds: atmosphereParams.clouds?.enabled ?? false,
          }
        : undefined,
      metadata: {
        seed: validated.seed ?? this.noise['perm'][0],
        generator: 'PlanetGenerator',
        version: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };

    return output;
  }

  private validateParams(params: PlanetParams): Required<PlanetParams> {
    return {
      radius: params.radius ?? 1.56,
      segments: Math.max(3, Math.min(8, params.segments ?? 6)),
      noise: {
        seed: params.noise?.seed ?? this.random.nextInt(0, 0xffffffff),
        scale: params.noise?.scale ?? 3.4,
        octaves: params.noise?.octaves ?? 5,
        persistence: params.noise?.persistence ?? 0.5,
        lacunarity: params.noise?.lacunarity ?? 2.0,
        offset: params.noise?.offset,
      },
      mountainHeight: params.mountainHeight ?? 0.16,
      detailScale: params.detailScale ?? 18.0,
      detailStrength: params.detailStrength ?? 0.028,
      breathSpeed: params.breathSpeed ?? 1.35,
      breathAmplitude: params.breathAmplitude ?? 0.018,
      veinColor: params.veinColor ?? { r: 1.0, g: 0.0, b: 0.236 },
      veinHotColor: params.veinHotColor ?? { r: 1.0, g: 0.157, b: 0.561 },
      veinThreshold: params.veinThreshold ?? 0.955,
      veinMicroThreshold: params.veinMicroThreshold ?? 0.82,
      oceanColor: params.oceanColor ?? { r: 0.004, g: 0.027, b: 0.055 },
      landColor: params.landColor ?? { r: 0.031, g: 0.047, b: 0.055 },
      auroraEnabled: params.auroraEnabled ?? true,
      auroraColor: params.auroraColor ?? { r: 0.392, g: 0.973, b: 1.0 },
      auroraIntensity: params.auroraIntensity ?? 0.32,
      atmosphere: params.atmosphere ?? {
        enabled: true,
        density: 0.3,
        rayleighCoefficient: 2.5,
        mieCoefficient: 0.1,
        sunIntensity: 1.0,
        groundAlbedo: { r: 0.3, g: 0.3, b: 0.3 },
        clouds: { enabled: true, coverage: 0.4, height: 10, density: 0.5 },
      },
      biomes: params.biomes ?? [],
      rotationSpeed: params.rotationSpeed ?? 0.026,
      axialTilt: params.axialTilt ?? 0.41,
      seed: params.seed ?? this.random.nextInt(0, 0xffffffff),
    };
  }

  private computeHeightField(params: Required<PlanetParams>): Float32Array {
    const segments = params.segments;
    const vertexCount = this.calcVertexCount(segments);
    const heightField = new Float32Array(vertexCount);

    // Icosphere vertex positions
    const vertices = this.generateIcosphereVertices(segments);

    for (let i = 0; i < vertexCount; i++) {
      const v = vertices[i];
      const scale = params.noise.scale;

      // Base terrain noise (FBM)
      let height = this.noise.fbm3D(
        v.x * scale,
        v.y * scale,
        v.z * scale,
        params.noise.octaves,
        params.noise.persistence,
        params.noise.lacunarity
      );

      // Domain warp for organic shapes
      if (params.noise.scale > 1) {
        const warp = this.noise.domainWarp3D(v.x, v.y, v.z, 0.15);
        height = this.noise.fbm3D(
          warp.x * scale,
          warp.y * scale,
          warp.z * scale,
          params.noise.octaves,
          params.noise.persistence,
          params.noise.lacunarity
        );
      }

      // Mountain ridges
      const ridge = this.noise.ridge3D(
        v.x * scale * 2,
        v.y * scale * 2,
        v.z * scale * 2,
        3,
        0.4,
        2.0
      );
      height = height * 0.7 + ridge * 0.3;

      // Apply mountain height
      height = height * params.mountainHeight;

      // Detail noise
      const detail = this.noise.noise3D(
        v.x * params.detailScale,
        v.y * params.detailScale,
        v.z * params.detailScale
      );
      height += detail * params.detailStrength;

      heightField[i] = Math.max(-1, Math.min(1, height));
    }

    return heightField;
  }

  private computeVeinParams(params: Required<PlanetParams>) {
    return {
      color: params.veinColor,
      hotColor: params.veinHotColor,
      threshold: params.veinThreshold,
      microThreshold: params.veinMicroThreshold,
      breathSpeed: params.breathSpeed,
    };
  }

  private calcSegments(radius: number): number {
    if (radius > 5) return 6;
    if (radius > 2) return 5;
    return 4;
  }

  private calcVertexCount(segments: number): number {
    return 10 * Math.pow(4, segments) + 2;
  }

  private calcFaceCount(segments: number): number {
    return 20 * Math.pow(4, segments);
  }

  private generateIcosphereVertices(segments: number): { x: number; y: number; z: number }[] {
    const t = (1 + Math.sqrt(5)) / 2;

    const icoVerts = [
      { x: -1, y: t, z: 0 },
      { x: 1, y: t, z: 0 },
      { x: -1, y: -t, z: 0 },
      { x: 1, y: -t, z: 0 },
      { x: 0, y: -1, z: t },
      { x: 0, y: 1, z: t },
      { x: 0, y: -1, z: -t },
      { x: 0, y: 1, z: -t },
      { x: t, y: 0, z: -1 },
      { x: t, y: 0, z: 1 },
      { x: -t, y: 0, z: -1 },
      { x: -t, y: 0, z: 1 },
    ].map((v) => Vec3.normalize(v));

    const icoFaces = [
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1],
    ];

    let vertices = icoVerts;
    let faces = icoFaces;

    for (let s = 0; s < segments; s++) {
      const newVertices: { x: number; y: number; z: number }[] = [...vertices];
      const newFaces: number[][] = [];
      const edgeMap = new Map<string, number>();

      for (const face of faces) {
        const a = face[0];
        const b = face[1];
        const c = face[2];

        const ab = this.getMidpoint(a, b, vertices, newVertices, edgeMap);
        const bc = this.getMidpoint(b, c, vertices, newVertices, edgeMap);
        const ca = this.getMidpoint(c, a, vertices, newVertices, edgeMap);

        newFaces.push([a, ab, ca]);
        newFaces.push([b, bc, ab]);
        newFaces.push([c, ca, bc]);
        newFaces.push([ab, bc, ca]);
      }

      vertices = newVertices;
      faces = newFaces;
    }

    return vertices;
  }

  private getMidpoint(
    a: number,
    b: number,
    vertices: { x: number; y: number; z: number }[],
    newVertices: { x: number; y: number; z: number }[],
    edgeMap: Map<string, number>
  ): number {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (edgeMap.has(key)) return edgeMap.get(key)!;

    const va = vertices[a];
    const vb = vertices[b];
    const mid = Vec3.normalize(Vec3.lerp(va, vb, 0.5));
    const idx = newVertices.length;
    newVertices.push(mid);
    edgeMap.set(key, idx);
    return idx;
  }
}
