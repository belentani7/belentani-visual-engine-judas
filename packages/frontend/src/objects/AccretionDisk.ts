/**
 * Accretion Disk - GPU particle system with Keplerian orbital motion
 *
 * Uses the vertex/fragment shaders produced by the AccretionGenerator,
 * with a temperature gradient (blue-white inner -> red outer) and
 * additive blending for the neon/fire look.
 */

import * as THREE from 'three';
import type { AccretionOutput } from '@belentani/core';

interface AccretionParamsLike {
  particleCount: number;
  innerRadius: number;
  outerRadius: number;
  diskHeight: number;
  gravityStrength: number;
  rotationSpeed: number;
  temperatureGradient?: { inner: number; outer: number };
  interactionRadius: number;
  interactionForce: number;
  interactionVerticalForce: number;
  colorNeon: { r: number; g: number; b: number };
  colorBlood: { r: number; g: number; b: number };
  colorObsidian: { r: number; g: number; b: number };
  pointSizeRange?: { min: number; max: number };
}

export function createAccretionDisk(output: AccretionOutput): THREE.Points {
  const p = output.material.uniforms as unknown as AccretionParamsLike;

  const count = output.geometry.particleCount;
  const inner = output.physics.innerRadius;
  const outer = output.physics.outerRadius;

  // Attributes
  const positions = new Float32Array(count * 3);
  const basePos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count * 4);
  const orbital = new Float32Array(count * 4);

  const tempInner = p.temperatureGradient?.inner ?? 10000;
  const tempOuter = p.temperatureGradient?.outer ?? 3000;

  for (let i = 0; i < count; i++) {
    // Biased radius (more particles inward)
    const bias = Math.pow(Math.random(), 0.6);
    const r = inner + (outer - inner) * bias;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const z = (Math.random() - 0.5) * (output.material.uniforms['uDiskHeight'] as number) * 0.02;

    basePos[i * 3] = x;
    basePos[i * 3 + 1] = y;
    basePos[i * 3 + 2] = z;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Temperature -> color ramp (red/orange -> white/blue)
    const t = 1 - bias; // inner = hot
    const temp = tempOuter + (tempInner - tempOuter) * t;
    const tn = Math.min(1, temp / 10000);
    let cr: number, cg: number, cb: number;
    if (tn < 0.4) {
      cr = 1.0; cg = tn * 2.5; cb = 0.0;
    } else if (tn < 0.7) {
      cr = 1.0; cg = 1.0; cb = (tn - 0.4) * 3.33;
    } else {
      cr = 0.8; cg = 0.9; cb = 1.0;
    }
    colors[i * 3] = cr;
    colors[i * 3 + 1] = cg;
    colors[i * 3 + 2] = cb;

    sizes[i] = Math.random();
    randoms[i * 4] = Math.random() * 2 - 1;
    randoms[i * 4 + 1] = Math.random();
    randoms[i * 4 + 2] = Math.random();
    randoms[i * 4 + 3] = Math.random();

    orbital[i * 4] = r;
    orbital[i * 4 + 1] = Math.random() * 0.3;
    orbital[i * 4 + 2] = 0;
    orbital[i * 4 + 3] = angle;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aBasePos', new THREE.BufferAttribute(basePos, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));
  geometry.setAttribute('aOrbitalParams', new THREE.BufferAttribute(orbital, 4));

  const uniforms = {
    uTime: { value: 0 },
    uGravityStrength: { value: output.physics.gravityStrength },
    uRotationSpeed: { value: p.rotationSpeed ?? 1.0 },
    uInteractionPos: { value: new THREE.Vector3(0, 0, 0) },
    uInteractionRadius: { value: p.interactionRadius ?? 180 },
    uInteractionForce: { value: p.interactionForce ?? 80 },
    uPointSizeMin: { value: p.pointSizeRange?.min ?? 0.5 },
    uPointSizeMax: { value: p.pointSizeRange?.max ?? 4.6 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: ACCRETION_VERT,
    fragmentShader: ACCRETION_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'AccretionDisk';
  points.scale.setScalar(0.01); // world scale from generator units
  points.frustumCulled = false;

  points.userData = {
    uniforms,
    gravityStrength: output.physics.gravityStrength,
    rotationSpeed: p.rotationSpeed ?? 1.0,
  };

  return points;
}

const ACCRETION_VERT = /* glsl */ `
  attribute vec3 aBasePos;
  attribute vec3 aColor;
  attribute float aSize;
  attribute vec4 aRandom;
  attribute vec4 aOrbitalParams;

  uniform float uTime;
  uniform float uGravityStrength;
  uniform float uRotationSpeed;
  uniform vec3 uInteractionPos;
  uniform float uInteractionRadius;
  uniform float uInteractionForce;
  uniform float uPointSizeMin;
  uniform float uPointSizeMax;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 orbitalPosition(vec4 op, float t) {
    float a = op.x;
    float e = op.y;
    float phase = op.w;
    float n = sqrt(uGravityStrength / (a * a * a));
    float M = n * t * uRotationSpeed + phase;
    float E = M;
    for (int i = 0; i < 3; i++) {
      E = M + e * sin(E);
    }
    float r = a * (1.0 - e * cos(E));
    float theta = E + phase;
    return vec3(r * cos(theta), 0.0, r * sin(theta));
  }

  void main() {
    vec3 pos = orbitalPosition(aOrbitalParams, uTime);
    pos.y = aRandom.x * 2.0;

    vec3 toI = uInteractionPos - pos;
    float d = length(toI);
    if (d < uInteractionRadius && d > 0.001) {
      float f = (1.0 - d / uInteractionRadius) * uInteractionForce * aRandom.y;
      pos += normalize(toI) * f;
    }

    vColor = aColor;
    vAlpha = 0.35 + 0.65 * aRandom.z;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = mix(uPointSizeMin, uPointSizeMax, aSize) * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const ACCRETION_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float falloff = 1.0 - smoothstep(0.1, 0.5, d);
    float core = 1.0 - smoothstep(0.0, 0.25, d);
    vec3 col = vColor + vec3(0.9, 0.4, 0.9) * core * 0.4;
    gl_FragColor = vec4(col, falloff * vAlpha);
  }
`;
