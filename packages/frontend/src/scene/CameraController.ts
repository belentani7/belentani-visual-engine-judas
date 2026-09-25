/**
 * Camera Controller - Orbit + cinematic + free modes
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CameraConfig } from '@belentani/core';

export type CameraMode = 'orbit' | 'cinematic' | 'free';

export class CameraController {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;
  private mode: CameraMode = 'orbit';
  private cinematicPath: THREE.CatmullRomCurve3 | null = null;
  private cinematicT = 0;
  private cinematicSpeed = 0.04;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 0, 0);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    this.controls.enabled = mode === 'orbit';
  }

  getMode(): CameraMode {
    return this.mode;
  }

  /** Set a cinematic flight path through control points */
  setCinematicPath(points: Array<{ x: number; y: number; z: number }>, lookAt = new THREE.Vector3(0, 0, 0)): void {
    this.cinematicPath = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      true,
      'catmullrom',
      0.5
    );
    this.controls.target.copy(lookAt);
    this.mode = 'cinematic';
    this.controls.enabled = false;
  }

  update(delta: number): void {
    if (this.mode === 'cinematic' && this.cinematicPath) {
      this.cinematicT = (this.cinematicT + delta * this.cinematicSpeed) % 1;
      const point = this.cinematicPath.getPointAt(this.cinematicT);
      this.camera.position.lerp(point, 0.08);
      this.camera.lookAt(this.controls.target);
    } else if (this.mode === 'orbit') {
      this.controls.update();
    }
  }

  applyConfig(config: CameraConfig): void {
    this.camera.fov = config.fov;
    this.camera.near = config.near;
    this.camera.far = config.far;
    this.camera.position.set(config.position.x, config.position.y, config.position.z);
    this.controls.target.set(config.target.x, config.target.y, config.target.z);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
