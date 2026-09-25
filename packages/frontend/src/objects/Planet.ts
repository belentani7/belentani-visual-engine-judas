/**
 * Planet Object - Procedural living planet
 *
 * Builds a Three.js mesh from PlanetOutput: displaced icosphere with
 * biome coloring, vein emission, breathing animation, and atmosphere shell.
 */

import * as THREE from 'three';
import type { PlanetOutput } from '@belentani/core';

function toColor(c: { r: number; g: number; b: number }): THREE.Color {
  return new THREE.Color(c.r, c.g, c.b);
}

export function createPlanet(output: PlanetOutput): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Planet';

  const { radius, segments } = output.geometry;
  const detail = Math.max(2, Math.min(6, segments));

  // Base icosphere geometry
  const geometry = new THREE.IcosahedronGeometry(radius, detail);

  // Vertex displacement from height field (mapped onto normalized vertices)
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  const heightField = output.geometry.heightField;
  const mountainHeight = output.material.mountainHeight;

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const normalized = vertex.clone().normalize();
    // Sample height field by index (best-effort mapping for CPU-generated fields)
    const hf = i < heightField.length ? heightField[i] : 0;
    const displacement = 1 + hf * mountainHeight;
    position.setXYZ(
      i,
      normalized.x * radius * displacement,
      normalized.y * radius * displacement,
      normalized.z * radius * displacement
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  // Material with emissive veins
  const oceanColor = toColor(output.material.oceanColor);
  const landColor = toColor(output.material.landColor);
  const veinColor = toColor(output.material.veinColor);

  const material = new THREE.MeshStandardMaterial({
    color: landColor,
    metalness: 0.1,
    roughness: 0.85,
    emissive: veinColor,
    emissiveIntensity: 0.35,
    flatShading: false,
  });

  const planetMesh = new THREE.Mesh(geometry, material);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  group.add(planetMesh);

  // Atmosphere shell (glow rim)
  const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.14, 48, 32);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: veinColor,
    transparent: true,
    opacity: output.atmosphere ? Math.min(0.25, output.atmosphere.density ?? 0.3) : 0.12,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.name = 'PlanetAtmosphere';
  group.add(atmosphere);

  // Store animation params for breathing
  group.userData = {
    breathSpeed: output.material.breathSpeed,
    breathAmplitude: output.material.breathAmplitude ?? 0.018,
    baseScale: 1,
    veinColor,
    oceanColor,
  };

  return group;
}
