/**
 * Noise Utilities - Simplex Noise, Seeded Random, Vector Math
 *
 * Deterministic noise and random for procedural generation.
 */

// ============================================================================
// Simplex Noise (3D, deterministic, seeded)
// ============================================================================

export class SimplexNoise {
  private perm: number[];
  private permMod12: number[];
  private grad3: number[][] = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];

  constructor(seed: string | number) {
    this.perm = new Array<number>(512);
    this.permMod12 = new Array<number>(512);
    this.seed(seed);
  }

  seed(seed: string | number): void {
    let seedNum = typeof seed === 'string' ? this.hashString(seed) : seed;

    const random = () => {
      seedNum = (seedNum * 1664525 + 1013904223) % 4294967296;
      return seedNum / 4294967296;
    };

    for (let i = 0; i < 256; i++) this.perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }
    for (let i = 0; i < 256; i++) {
      this.perm[i + 256] = this.perm[i];
      this.permMod12[i] = this.perm[i] % 12;
      this.permMod12[i + 256] = this.permMod12[i];
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  noise3D(x: number, y: number, z: number): number {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;

    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    let i1, j1, k1, i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0, n1, n2, n3;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      const gi0 = this.permMod12[ii + this.permMod12[jj + this.permMod12[kk]]];
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0][0] * x0 + this.grad3[gi0][1] * y0 + this.grad3[gi0][2] * z0);
    } else n0 = 0;

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      const gi1 = this.permMod12[ii + i1 + this.permMod12[jj + j1 + this.permMod12[kk + k1]]];
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1][0] * x1 + this.grad3[gi1][1] * y1 + this.grad3[gi1][2] * z1);
    } else n1 = 0;

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      const gi2 = this.permMod12[ii + i2 + this.permMod12[jj + j2 + this.permMod12[kk + k2]]];
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2][0] * x2 + this.grad3[gi2][1] * y2 + this.grad3[gi2][2] * z2);
    } else n2 = 0;

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      const gi3 = this.permMod12[ii + 1 + this.permMod12[jj + 1 + this.permMod12[kk + 1]]];
      t3 *= t3;
      n3 = t3 * t3 * (this.grad3[gi3][0] * x3 + this.grad3[gi3][1] * y3 + this.grad3[gi3][2] * z3);
    } else n3 = 0;

    return 32.0 * (n0 + n1 + n2 + n3);
  }

  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  fbm(
    x: number,
    y: number,
    octaves: number = 5,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let value = 0.0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0.0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  fbm3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 5,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let value = 0.0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0.0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  fbm2D(
    x: number,
    y: number,
    octaves: number = 5,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    return this.fbm3D(x, y, 0, octaves, persistence, lacunarity);
  }

  domainWarp(x: number, y: number, warpStrength: number = 5.0): { x: number; y: number } {
    const warpX = this.fbm(x + 100, y + 100, 4, 0.5, 2.0) * warpStrength;
    const warpY = this.fbm(x + 200, y + 200, 4, 0.5, 2.0) * warpStrength;
    return { x: x + warpX, y: y + warpY };
  }

  domainWarp3D(
    x: number,
    y: number,
    z: number,
    warpStrength: number = 1.0
  ): { x: number; y: number; z: number } {
    const wx = this.noise3D(x + 100, y, z);
    const wy = this.noise3D(x, y + 100, z);
    const wz = this.noise3D(x, y, z + 100);

    return {
      x: x + wx * warpStrength,
      y: y + wy * warpStrength,
      z: z + wz * warpStrength,
    };
  }

  ridge3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 5,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
      const n = Math.abs(this.noise3D(x * frequency, y * frequency, z * frequency));
      value += amplitude * (1.0 - n);
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value;
  }
}

export const F3 = 1.0 / 3.0;
export const G3 = 1.0 / 6.0;

// ============================================================================
// Seeded Random Number Generator (LCG)
// ============================================================================

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// ============================================================================
// Vector Math
// ============================================================================

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const Vec3 = {
  create: (x: number, y: number, z: number): Vec3 => ({ x, y, z }),
  add: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s }),
  div: (a: Vec3, s: number): Vec3 => ({ x: a.x / s, y: a.y / s, z: a.z / s }),
  dot: (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  length: (a: Vec3): number => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z),
  normalize: (a: Vec3): Vec3 => {
    const len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    return len > 0 ? { x: a.x / len, y: a.y / len, z: a.z / len } : { x: 0, y: 0, z: 0 };
  },
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }),
} as const;

// ============================================================================
// Exports
// ============================================================================

export function createSimplexNoise(seed: string | number): SimplexNoise {
  return new SimplexNoise(seed);
}
