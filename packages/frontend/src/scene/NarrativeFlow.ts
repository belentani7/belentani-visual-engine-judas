/**
 * Narrative Flow - Sequential camera/param/audio steps
 */

import * as THREE from 'three';
import type { NarrativeFlowConfig } from '@belentani/core';
import type { CameraController } from './CameraController';

export interface NarrativeCallbacks {
  onStepChange?: (stepIndex: number, stepId: string) => void;
  onComplete?: () => void;
}

export class NarrativeFlow {
  private config: NarrativeFlowConfig;
  private elapsed = 0;
  private stepIndex = 0;
  private playing = false;
  private callbacks: NarrativeCallbacks;
  private readonly tmpPos = new THREE.Vector3();
  private readonly tmpTarget = new THREE.Vector3();

  constructor(config: NarrativeFlowConfig, callbacks: NarrativeCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  start(): void {
    this.playing = true;
    this.elapsed = 0;
    this.stepIndex = 0;
    this.emitStep();
  }

  stop(): void {
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentStep(): number {
    return this.stepIndex;
  }

  update(delta: number, cameraController: CameraController): void {
    if (!this.playing) return;

    const steps = this.config.steps;
    if (steps.length === 0) return;

    const step = steps[this.stepIndex];
    this.elapsed += delta;

    if (step.camera) {
      const target = step.camera;
      const cam = cameraController.camera;
      const t = Math.min(1, this.elapsed / Math.max(0.001, step.duration));
      const ease = t * t * (3 - 2 * t);

      this.tmpPos.set(target.position.x, target.position.y, target.position.z);
      this.tmpTarget.set(target.target.x, target.target.y, target.target.z);
      cam.position.lerp(this.tmpPos, ease * 0.02);
      cameraController.controls.target.lerp(this.tmpTarget, ease * 0.02);
    }

    if (this.elapsed >= step.duration) {
      this.elapsed = 0;
      this.stepIndex++;
      if (this.stepIndex >= steps.length) {
        if (this.config.loop) {
          this.stepIndex = 0;
        } else {
          this.playing = false;
          this.callbacks.onComplete?.();
          return;
        }
      }
      this.emitStep();
    }
  }

  private emitStep(): void {
    const step = this.config.steps[this.stepIndex];
    if (step) this.callbacks.onStepChange?.(this.stepIndex, step.id);
  }
}
