/**
 * Diamond Object - Physically accurate gem
 *
 * Round brilliant with MeshPhysicalMaterial transmission/diffusion.
 * IOR 2.417, dispersion 0.044 (Abbe ~55). Causally: one transmission
 * identity, filtered by thickness and dispersion.
 */

import * as THREE from 'three';
import type { DiamondOutput } from '@belentani/core';

function toColor(c: { r: number; g: number; b: number }): THREE.Color {
  return new THREE.Color(c.r, c.g, c.b);
}

export function createDiamond(output: DiamondOutput): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Diamond';

  // Round brilliant approximation: cone crown + cone pavilion scaled radially
  const geometry = buildBrilliantGeometry(1);

  const material = new THREE.MeshPhysicalMaterial({
    color: toColor(output.material && { r: 1, g: 1, b: 1 }) ?? new THREE.Color(0xffffff),
    metalness: output.material.metalness,
    roughness: output.material.roughness,
    transmission: output.material.transmission,
    thickness: output.material.thickness,
    ior: output.material.ior,
    dispersion: output.material.dispersion,
    clearcoat: output.material.clearcoat,
    clearcoatRoughness: output.material.clearcoatRoughness,
    transparent: true,
    side: THREE.DoubleSide,
    envMapIntensity: 1.4,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  group.add(mesh);

  group.userData = {
    ior: output.material.ior,
    dispersion: output.material.dispersion,
  };

  return group;
}

/**
 * Build a faceted round-brilliant-like geometry:
 * a table (top facet), crown ring, girdle, pavilion converging to culet.
 */
function buildBrilliantGeometry(radius: number): THREE.BufferGeometry {
  const segments = 16;
  const tableRatio = 0.53;
  const crownHeight = radius * 0.4;
  const pavilionDepth = radius * 0.95;
  const girdleY = 0;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addVertex = (x: number, y: number, z: number, u: number, v: number): number => {
    positions.push(x, y, z);
    const len = Math.hypot(x, y, z) || 1;
    normals.push(x / len, y / len, z / len);
    uvs.push(u, v);
    return positions.length / 3 - 1;
  };

  // Table center (top)
  const tableCenter = addVertex(0, girdleY + crownHeight, 0, 0.5, 1);
  const culet = addVertex(0, girdleY - pavilionDepth, 0, 0.5, 0);

  const girdleTop: number[] = [];
  const girdleBottom: number[] = [];
  const tableRing: number[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cx = Math.cos(angle);
    const cz = Math.sin(angle);

    // Table ring (flat top, smaller radius)
    tableRing.push(addVertex(cx * radius * tableRatio, girdleY + crownHeight, cz * radius * tableRatio, i / segments, 1));

    // Girdle
    girdleTop.push(addVertex(cx * radius, girdleY, cz * radius, i / segments, 0.55));
    girdleBottom.push(addVertex(cx * radius, girdleY - radius * 0.12, cz * radius, i / segments, 0.5));
  }

  // Table fan
  for (let i = 0; i < segments; i++) {
    const a = tableRing[i];
    const b = tableRing[(i + 1) % segments];
    indices.push(tableCenter, a, b);
  }

  // Crown facets (table ring -> girdle top)
  for (let i = 0; i < segments; i++) {
    const a = tableRing[i];
    const b = tableRing[(i + 1) % segments];
    const c = girdleTop[(i + 1) % segments];
    const d = girdleTop[i];
    indices.push(a, d, c);
    indices.push(a, c, b);
  }

  // Girdle band
  for (let i = 0; i < segments; i++) {
    const a = girdleTop[i];
    const b = girdleTop[(i + 1) % segments];
    const c = girdleBottom[(i + 1) % segments];
    const d = girdleBottom[i];
    indices.push(a, b, c);
    indices.push(a, c, d);
  }

  // Pavilion (girdle bottom -> culet)
  for (let i = 0; i < segments; i++) {
    const a = girdleBottom[i];
    const b = girdleBottom[(i + 1) % segments];
    indices.push(a, b, culet);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.center();

  return geometry;
}
