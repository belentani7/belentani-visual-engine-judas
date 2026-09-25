/**
 * Scene Manager - Builds a Three.js scene from a SceneConfig
 *
 * Instantiates objects, materials, lights, cameras from the serializable
 * SceneConfig produced by the generators package.
 */

import * as THREE from 'three';
import type {
  SceneConfig,
  CameraConfig,
  LightConfig,
  Color,
} from '@belentani/core';
import { createPlanet } from '../objects/Planet';
import { createDiamond } from '../objects/Diamond';
import { createKey } from '../objects/Key';
import { createMachine } from '../objects/Machine';
import { createMirror } from '../objects/Mirror';
import { createAccretionDisk } from '../objects/AccretionDisk';

export interface ManagedScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  entities: Record<string, THREE.Object3D>;
  dispose: () => void;
}

function colorToThree(c: Color | undefined, fallback = 0xffffff): THREE.Color {
  if (!c) return new THREE.Color(fallback);
  return new THREE.Color(c.r, c.g, c.b);
}

export function createCamera(config: CameraConfig): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    config.fov,
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9,
    config.near,
    config.far
  );
  camera.position.set(config.position.x, config.position.y, config.position.z);
  camera.lookAt(config.target.x, config.target.y, config.target.z);
  return camera;
}

export function createLight(config: LightConfig): THREE.Light | null {
  const color = colorToThree(config.color as Color | undefined);

  switch (config.type) {
    case 'AmbientLight':
      return new THREE.AmbientLight(color, config.intensity);

    case 'DirectionalLight': {
      const light = new THREE.DirectionalLight(color, config.intensity);
      if (config.position) light.position.set(config.position.x, config.position.y, config.position.z);
      if (config.target) light.target.position.set(config.target.x, config.target.y, config.target.z);
      light.castShadow = config.castShadow ?? false;
      if (light.castShadow) {
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 50;
        light.shadow.bias = -0.0001;
        light.shadow.normalBias = 0.02;
      }
      return light;
    }

    case 'PointLight': {
      const light = new THREE.PointLight(color, config.intensity, config.distance ?? 0, config.decay ?? 2);
      if (config.position) light.position.set(config.position.x, config.position.y, config.position.z);
      light.castShadow = config.castShadow ?? false;
      return light;
    }

    case 'SpotLight': {
      const light = new THREE.SpotLight(
        color,
        config.intensity,
        config.distance ?? 0,
        config.angle ?? Math.PI / 3,
        config.penumbra ?? 0,
        config.decay ?? 2
      );
      if (config.position) light.position.set(config.position.x, config.position.y, config.position.z);
      if (config.target) light.target.position.set(config.target.x, config.target.y, config.target.z);
      light.castShadow = config.castShadow ?? true;
      return light;
    }

    case 'HemisphereLight': {
      const hemi = config as unknown as { skyColor?: Color; groundColor?: Color; intensity: number; position?: { x: number; y: number; z: number } };
      const light = new THREE.HemisphereLight(
        colorToThree(hemi.skyColor, 0x99b3ff),
        colorToThree(hemi.groundColor, 0x664d33),
        hemi.intensity
      );
      if (hemi.position) light.position.set(hemi.position.x, hemi.position.y, hemi.position.z);
      return light;
    }

    default:
      return null;
  }
}

export class SceneManager {
  private managed: ManagedScene | null = null;

  /** Build a Three.js scene from a SceneConfig */
  load(config: SceneConfig): ManagedScene {
    this.dispose();

    const scene = new THREE.Scene();

    // Background / fog
    scene.background = new THREE.Color(0x02030a);
    scene.fog = new THREE.FogExp2(0x02030a, 0.0075);

    const camera = createCamera(config.camera);

    // Lights
    const lights: THREE.Light[] = [];
    for (const lightConfig of config.lights ?? []) {
      const light = createLight(lightConfig);
      if (light) {
        scene.add(light);
        if (light instanceof THREE.DirectionalLight) scene.add(light.target);
        lights.push(light);
      }
    }

    // Entities
    const entities: Record<string, THREE.Object3D> = {};

    if (config.planet) {
      const planet = createPlanet(config.planet);
      planet.position.set(0, 0, 0);
      scene.add(planet);
      entities.planet = planet;
    }

    if (config.diamond) {
      const diamond = createDiamond(config.diamond);
      diamond.position.set(2.4, 0.2, 0.6);
      scene.add(diamond);
      entities.diamond = diamond;
    }

    if (config.key) {
      const key = createKey(config.key);
      key.position.set(-2.4, -0.3, 1.2);
      scene.add(key);
      entities.key = key;
    }

    if (config.machine) {
      const machine = createMachine(config.machine);
      machine.position.set(0, -2.2, -1.8);
      scene.add(machine);
      entities.machine = machine;
    }

    if (config.mirror) {
      const mirror = createMirror(config.mirror);
      mirror.position.set(0, 1.8, -4);
      scene.add(mirror);
      entities.mirror = mirror;
    }

    if (config.accretion) {
      const accretion = createAccretionDisk(config.accretion);
      accretion.position.set(0, 0, -8);
      scene.add(accretion);
      entities.accretion = accretion;
    }

    const disposables: Array<{ dispose: () => void }> = [];

    const managed: ManagedScene = {
      scene,
      camera,
      entities,
      dispose: () => {
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else if (mat) {
            mat.dispose();
          }
        });
        for (const d of disposables) d.dispose();
        scene.clear();
      },
    };

    this.managed = managed;
    return managed;
  }

  update(delta: number, elapsed: number): void {
    if (!this.managed) return;
    const { entities } = this.managed;

    // Animate planet
    if (entities.planet) {
      entities.planet.rotation.y += delta * 0.026;
    }
    // Animate diamond slowly
    if (entities.diamond) {
      entities.diamond.rotation.y += delta * 0.15;
      entities.diamond.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
    }
    // Animate key pulse
    if (entities.key) {
      entities.key.rotation.z = Math.sin(elapsed * 0.8) * 0.15;
    }
    // Animate machine rings
    if (entities.machine) {
      entities.machine.rotation.y += delta * 0.1;
    }
    // Animate accretion disk
    if (entities.accretion) {
      entities.accretion.rotation.z += delta * 0.05;
    }
  }

  get(): ManagedScene | null {
    return this.managed;
  }

  dispose(): void {
    if (this.managed) {
      this.managed.dispose();
      this.managed = null;
    }
  }
}
