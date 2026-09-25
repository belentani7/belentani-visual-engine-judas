/**
 * Accretion Disk Generator - GPU Particle System
 *
 * Generates an accretion disk with:
 * - GPU-based particle simulation (150k+ particles)
 * - Kepler orbital mechanics
 * - Black body radiation color gradient
 * - Mouse/gravity interaction
 * - Additive blending for neon glow
 */

import type {
  AccretionGeometryOutput,
  AccretionMaterialParams,
  AccretionOutput,
  AccretionParams,
  AccretionPhysicsParams,
  Color,
} from '@belentani/core';
import type { SimplexNoise } from '../noise';
import { createSimplexNoise, SeededRandom } from '../noise';

export class AccretionGenerator {
  private noise: SimplexNoise;
  private random: SeededRandom;

  constructor(seed: string | number = 'belentani-accretion') {
    this.noise = createSimplexNoise(seed);
    const seedNum = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.random = new SeededRandom(seedNum);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  generate(params: AccretionParams): AccretionOutput {
    const {
      particleCount = 150000,
      innerRadius = 50.0,
      outerRadius = 500.0,
      diskHeight = 6000.0,
      gravityStrength = 250.0,
      rotationSpeed = 1.0,
      temperatureGradient = { inner: 10000, outer: 3000 },
      interactionRadius = 180.0,
      interactionForce = 80.0,
      interactionVerticalForce = 40.0,
      colorNeon = { r: 1.0, g: 0.027, b: 0.227 },
      colorBlood = { r: 0.545, g: 0.0, b: 0.0 },
      colorObsidian = { r: 0.102, g: 0.02, b: 0.031 },
      additiveBlending = true,
      pointSizeRange = { min: 0.5, max: 4.6 },
      seed = 'belentani-accretion',
    } = params;

    const geometry = this.generateGeometry(particleCount, innerRadius, outerRadius, diskHeight);
    const material = this.generateMaterialParams(
      particleCount,
      innerRadius,
      outerRadius,
      diskHeight,
      gravityStrength,
      rotationSpeed,
      temperatureGradient,
      interactionRadius,
      interactionForce,
      interactionVerticalForce,
      colorNeon,
      colorBlood,
      colorObsidian,
      additiveBlending,
      pointSizeRange
    );
    const physics = this.generatePhysicsParams(gravityStrength, innerRadius, outerRadius);

    return {
      geometry,
      material,
      physics,
      metadata: {
        seed,
        generator: 'AccretionGenerator',
        version: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private generateGeometry(
    particleCount: number,
    _innerRadius: number,
    _outerRadius: number,
    _diskHeight: number
  ): AccretionGeometryOutput {
    // Attributes for GPU particle system
    const attributes = [
      'position', // vec3 - initial position
      'aBasePos', // vec3 - base orbital position
      'aColor', // vec3 - base color (temperature)
      'aSize', // float - point size
      'aRandom', // vec4 - random values for variation
      'aOrbitParams', // vec4 - orbital params (radius, phase, inclination, eccentricity)
    ];

    return {
      particleCount,
      attributes,
    };
  }

  private generateMaterialParams(
    _particleCount: number,
    _innerRadius: number,
    _outerRadius: number,
    _diskHeight: number,
    gravityStrength: number,
    rotationSpeed: number,
    temperatureGradient: { inner: number; outer: number },
    interactionRadius: number,
    interactionForce: number,
    interactionVerticalForce: number,
    colorNeon: Color,
    colorBlood: Color,
    colorObsidian: Color,
    additiveBlending: boolean,
    _pointSizeRange: { min: number; max: number }
  ): AccretionMaterialParams {
    // Vertex shader for GPU particle simulation
    const vertexShader = `
      attribute vec3 position;
      attribute vec3 aBasePos;
      attribute vec3 aColor;
      attribute float aSize;
      attribute vec4 aRandom;
      attribute vec4 aOrbitParams;
      
      uniform float uTime;
      uniform vec3 uMousePos;
      uniform float uInteractionRadius;
      uniform float uInteractionForce;
      uniform float uInteractionVerticalForce;
      uniform float uGravityStrength;
      uniform float uRotationSpeed;
      uniform float uInnerRadius;
      uniform float uOuterRadius;
      uniform float uDiskHeight;
      
      varying vec3 vColor;
      varying float vSize;
      varying vec3 vWorldPos;
      
      // Kepler orbital motion
      vec3 computeOrbit(vec3 basePos, float time) {
        float radius = aOrbitParams.x;
        float phase = aOrbitParams.y;
        float inclination = aOrbitParams.z;
        float eccentricity = aOrbitParams.w;
        
        float orbitalPeriod = 2.0 * PI * sqrt(radius * radius * radius / uGravityStrength);
        float angle = phase + time * uRotationSpeed * (1.0 / orbitalPeriod);
        
        // Elliptical orbit
        float r = radius * (1.0 - eccentricity * eccentricity) / (1.0 + eccentricity * cos(angle));
        
        vec3 pos;
        pos.x = r * cos(angle);
        pos.y = r * sin(angle) * cos(inclination);
        pos.z = r * sin(angle) * sin(inclination) * 0.1; // Flatten to disk
        
        return pos;
      }
      
      // Mouse interaction force
      vec3 computeInteraction(vec3 pos) {
        vec3 toMouse = uMousePos - pos;
        float dist = length(toMouse);
        if (dist < uInteractionRadius && dist > 0.0) {
          float force = uInteractionForce * (1.0 - dist / uInteractionRadius);
          return normalize(toMouse) * force;
        }
        return vec3(0.0);
      }
      
      void main() {
        vec3 baseOrbit = computeOrbit(aBasePos, uTime);
        vec3 interaction = computeInteraction(baseOrbit);
        
        // Vertical oscillation
        float verticalOsc = sin(uTime * 2.0 + aRandom.x * 10.0) * uDiskHeight * 0.1 * aRandom.y;
        
        vec3 finalPos = baseOrbit + interaction;
        finalPos.z += verticalOsc;
        
        // Project to clip space
        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Point size based on distance and random
        float size = mix(uPointSizeMin, uPointSizeMax, aSize) * (300.0 / -mvPosition.z);
        gl_PointSize = size;
        
        vColor = aColor;
        vSize = size;
        vWorldPos = finalPos;
      }
    `;

    // Fragment shader with temperature-based color
    const fragmentShader = `
      varying vec3 vColor;
      varying float vSize;
      varying vec3 vWorldPos;
      
      uniform vec3 uColorNeon;
      uniform vec3 uColorBlood;
      uniform vec3 uColorObsidian;
      uniform float uTemperatureInner;
      uniform float uTemperatureOuter;
      
      // Black body radiation approximation
      vec3 blackBody(float temperature) {
        // Simplified Planck's law approximation
        float t = temperature / 10000.0;
        vec3 color;
        if (t < 0.4) {
          color = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.5, 0.1), t / 0.4);
        } else if (t < 0.7) {
          color = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.9, 0.4), (t - 0.4) / 0.3);
        } else {
          color = mix(vec3(1.0, 0.9, 0.4), vec3(0.9, 0.95, 1.0), (t - 0.7) / 0.3);
        }
        return color;
      }
      
      void main() {
        // Circular point
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Soft particle edge
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        
        // Temperature based on radius
        float temp = mix(uTemperatureInner, uTemperatureOuter, 
                        (length(vWorldPos.xz) - uInnerRadius) / (uOuterRadius - uInnerRadius));
        vec3 bbColor = blackBody(temp);
        
        // Mix with base color
        vec3 finalColor = mix(vColor, bbColor, 0.7);
        
        // Add neon glow at edges
        float edgeGlow = smoothstep(0.4, 0.5, dist) * 0.3;
        finalColor += uColorNeon * edgeGlow;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return {
      uniforms: {
        uTime: { value: 0 },
        uMousePos: { value: { x: 0, y: 0, z: 0 } },
        uInteractionRadius: { value: 180.0 },
        uInteractionForce: { value: 80.0 },
        uInteractionVerticalForce: { value: 40.0 },
        uGravityStrength: { value: 250.0 },
        uRotationSpeed: { value: 1.0 },
        uInnerRadius: { value: 50.0 },
        uOuterRadius: { value: 500.0 },
        uDiskHeight: { value: 6000.0 },
        uPointSizeMin: { value: 0.5 },
        uPointSizeMax: { value: 4.6 },
        uColorNeon: { value: colorNeon },
        uColorBlood: { value: colorBlood },
        uColorObsidian: { value: colorObsidian },
        uTemperatureInner: { value: 10000 },
        uTemperatureOuter: { value: 3000 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: additiveBlending ? 'AdditiveBlending' : 'NormalBlending',
    };
  }

  private generatePhysicsParams(
    gravityStrength: number,
    innerRadius: number,
    outerRadius: number
  ): AccretionPhysicsParams {
    return {
      gravityStrength,
      innerRadius,
      outerRadius,
    };
  }

  // Generate initial particle data for GPU buffer
  generateParticleData(params: AccretionParams): {
    positions: Float32Array;
    basePositions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    randoms: Float32Array;
    orbitParams: Float32Array;
  } {
    const {
      particleCount = 150000,
      innerRadius = 50.0,
      outerRadius = 500.0,
      diskHeight = 6000.0,
    } = params;
    createSimplexNoise(params.seed || 'accretion-particles');

    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount * 4);
    const orbitParams = new Float32Array(particleCount * 4); // radius, phase, inclination, eccentricity

    for (let i = 0; i < particleCount; i++) {
      // Random orbital radius (biased toward inner)
      const radiusBias = this.random.next();
      const radius = innerRadius + (outerRadius - innerRadius) * Math.pow(radiusBias, 0.5);

      // Random phase
      const phase = Math.random() * Math.PI * 2;

      // Random inclination (small for disk)
      const inclination = (Math.random() - 0.5) * 0.2;

      // Small eccentricity
      const eccentricity = Math.random() * 0.1;

      // Initial position on orbit
      const angle = phase;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle) * Math.cos(inclination);
      const z =
        radius * Math.sin(angle) * Math.sin(inclination) * 0.1 +
        (Math.random() - 0.5) * diskHeight * 0.01;

      // Store
      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Orbital parameters
      orbitParams[i * 4] = radius;
      orbitParams[i * 4 + 1] = phase;
      orbitParams[i * 4 + 2] = inclination;
      orbitParams[i * 4 + 3] = eccentricity;

      // Temperature-based color (will be overridden in shader)
      const tempRatio = (radius - innerRadius) / (outerRadius - innerRadius);
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0 - tempRatio * 0.5;
      colors[i * 3 + 2] = tempRatio * 0.3;

      // Point size variation
      sizes[i] = 0.5 + Math.random() * 0.5;

      // Random values for variation
      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
    }

    return {
      positions,
      basePositions,
      colors,
      sizes,
      randoms,
      orbitParams,
    };
  }
}
