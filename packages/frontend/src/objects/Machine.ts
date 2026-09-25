/**
 * Machine Object - Organic machine with iris aperture and rings
 *
 * Metal body with iris segments (morph-style via scale) and instanced rings.
 * 432Hz biological pulse via emissive intensity.
 */

import * as THREE from 'three';
import type { MachineOutput } from '@belentani/core';

function toColor(c: { r: number; g: number; b: number }): THREE.Color {
  return new THREE.Color(c.r, c.g, c.b);
}

export function createMachine(output: MachineOutput): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Machine';

  const material = new THREE.MeshStandardMaterial({
    color: toColor(output.material.color),
    metalness: output.material.metalness,
    roughness: output.material.roughness,
    emissive: toColor(output.material.emissive),
    emissiveIntensity: output.material.emissiveIntensity,
  });

  // Core body (sphere)
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 3), material);
  body.castShadow = true;
  group.add(body);

  // Iris segments (radial blades) - stored for animation
  const irisGroup = new THREE.Group();
  irisGroup.name = 'Iris';
  const irisSegments = output.animation.irisMorphTargets.length || 12;
  for (let i = 0; i < irisSegments; i++) {
    const angle = (i / irisSegments) * Math.PI * 2;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.5, 0.32),
      material
    );
    blade.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0);
    blade.rotation.z = angle;
    blade.userData = { baseAngle: angle, index: i };
    irisGroup.add(blade);
  }
  group.add(irisGroup);

  // Rings (instanced)
  const ringCount = output.animation.ringRotationSpeeds.length || 3;
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1 + i * 0.28, 0.05, 8, 48),
      material
    );
    ring.rotation.x = Math.PI / 2;
    ring.userData = { speed: output.animation.ringRotationSpeeds[i] ?? 0.5 };
    rings.push(ring);
    group.add(ring);
  }

  group.userData = {
    irisGroup,
    rings,
    pulseFrequency: output.animation.pulseFrequency,
    material,
    baseEmissive: output.material.emissiveIntensity,
  };

  return group;
}
