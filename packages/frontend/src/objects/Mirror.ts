/**
 * Mirror Object - Portal / Nexus / Void / Mirror
 *
 * A refractive portal panel. Uses MeshPhysicalMaterial transmission with
 * a glitch/fracture TSL-ready uniform set. Nexus mode adds orbit dots.
 */

import * as THREE from 'three';
import type { MirrorOutput } from '@belentani/core';

export function createMirror(output: MirrorOutput): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Mirror';

  const size = 5;
  let geometry: THREE.BufferGeometry;
  switch (output.geometry.type) {
    case 'sphere':
      geometry = new THREE.IcosahedronGeometry(size * 0.5, 4);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(size * 0.5, size * 0.15, 24, 96);
      break;
    case 'fractal':
      geometry = new THREE.IcosahedronGeometry(size * 0.5, 5);
      break;
    case 'plane':
    default:
      geometry = new THREE.PlaneGeometry(size, size * 1.4, 1, 1);
      break;
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a12,
    metalness: output.effects.renderTargetReflection ? 1.0 : 0.2,
    roughness: 0.05,
    transmission: output.material.transmission,
    thickness: output.material.thickness,
    ior: output.material.refractionIndex,
    dispersion: output.material.dispersion,
    transparent: true,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'MirrorSurface';
  group.add(mesh);

  // Nexus connection dots (orbiting)
  const nexusDots: THREE.Mesh[] = [];
  const connections = output.portal?.connections ?? 0;
  if (connections > 0) {
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xb44dff });
    for (let i = 0; i < connections; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), dotMat);
      const a = (i / connections) * Math.PI * 2;
      dot.position.set(Math.cos(a) * size * 0.85, Math.sin(a) * size * 0.85, 0);
      dot.userData = { baseAngle: a };
      nexusDots.push(dot);
      group.add(dot);
    }
  }

  group.userData = {
    portalType: output.portal?.type ?? 'mirror',
    nexusDots,
    material,
    glitch: output.effects.glitch,
    fracture: output.effects.fracture,
  };

  group.scale.setScalar(0.55);
  return group;
}
