/**
 * Key Object - Ceremonial golden key
 *
 * Gold PBR (metalness 1, clearcoat ceremonial) with emissive ritual pulse.
 * Geometry: bow (torus), shank (box), bit (teeth).
 */

import * as THREE from 'three';
import type { KeyOutput } from '@belentani/core';

function toColor(c: { r: number; g: number; b: number }): THREE.Color {
  return new THREE.Color(c.r, c.g, c.b);
}

export function createKey(output: KeyOutput): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Key';

  const material = new THREE.MeshPhysicalMaterial({
    color: toColor(output.material.color),
    metalness: output.material.metalness,
    roughness: output.material.roughness,
    clearcoat: output.material.clearcoat,
    clearcoatRoughness: output.material.clearcoatRoughness,
    emissive: toColor(output.material.emissive),
    emissiveIntensity: output.material.emissiveIntensity,
  });

  const length = 0.15;
  const width = 0.04;

  // Bow (decorative head) - torus
  const bow = new THREE.Mesh(
    new THREE.TorusGeometry(width * 0.9, width * 0.28, 12, 24),
    material
  );
  bow.position.set(-length * 0.42, 0, 0);
  bow.rotation.y = Math.PI / 2;
  group.add(bow);

  // Shank (stem)
  const shank = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.16, width * 0.16, length * 0.7, 12),
    material
  );
  shank.rotation.z = Math.PI / 2;
  shank.position.set(0, 0, 0);
  group.add(shank);

  // Bit (warding/teeth)
  const bitGroup = new THREE.Group();
  const toothCount = 3;
  for (let i = 0; i < toothCount; i++) {
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.5, width * 0.22, width * 0.12),
      material
    );
    tooth.position.set(length * 0.28, -width * 0.28, (i - 1) * width * 0.18);
    bitGroup.add(tooth);
  }
  group.add(bitGroup);

  group.userData = {
    pulseFrequency: output.animation?.pulseFrequency ?? 432,
    pulseColor: toColor(output.material.emissive),
    material,
  };

  group.scale.setScalar(3);
  return group;
}
