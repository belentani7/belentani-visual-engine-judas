/**
 * Belentani Visual Engine - Frontend Entry Point
 *
 * Wires together: RenderEngine -> SceneManager -> CameraController -> UI
 */

import * as THREE from 'three';
import { SceneComposer } from '@belentani/generators';
import { RenderEngine } from './render/RenderEngine';
import { createPostProcessing, type PostProcessingHandles } from './render/PostProcessing';
import { SceneManager } from './scene/SceneManager';
import { CameraController } from './scene/CameraController';
import { NarrativeFlow } from './scene/NarrativeFlow';
import { ParameterPanel } from './ui/ParameterPanel';
import { ExportPanel } from './ui/ExportPanel';
import { LoreInput } from './ui/LoreInput';
import type { SceneConfig } from '@belentani/core';
import './styles.css';

class BelentaniApp {
  private canvas!: HTMLCanvasElement;
  private engine!: RenderEngine;
  private sceneManager!: SceneManager;
  private cameraController!: CameraController;
  private postProcessing: PostProcessingHandles | null = null;
  private narrative: NarrativeFlow | null = null;
  private currentConfig!: SceneConfig;
  private statsEl!: HTMLElement;

  async init(): Promise<void> {
    this.canvas = document.getElementById('viewport') as HTMLCanvasElement;
    this.statsEl = document.getElementById('stats') as HTMLElement;

    // 1. Render engine
    this.engine = new RenderEngine({ canvas: this.canvas });

    // 2. Generate default scene
    const composer = new SceneComposer('belentani-default');
    const outputs = composer.generateAll();
    this.currentConfig = composer.compose(outputs, {
      camera: this.getCinematicCamera(),
    });

    // 3. Build Three.js scene
    this.sceneManager = new SceneManager();
    const managed = this.sceneManager.load(this.currentConfig);

    // 4. Camera controller
    this.cameraController = new CameraController(managed.camera, this.canvas);
    this.cameraController.setCinematicPath([
      { x: 0, y: 3, z: 18 },
      { x: 6, y: 1, z: 10 },
      { x: -6, y: 2, z: 12 },
      { x: 2, y: -2, z: 14 },
    ]);

    // 5. Post-processing
    this.postProcessing = createPostProcessing(
      this.engine.renderer,
      managed.scene,
      managed.camera,
      this.currentConfig.postProcessing
    );

    // 6. Narrative flow
    if (this.currentConfig.narrative) {
      this.narrative = new NarrativeFlow(this.currentConfig.narrative, {
        onStepChange: (i, id) => console.log(`Narrative step ${i}: ${id}`),
      });
    }

    // 7. UI
    this.buildUI();

    // 8. Events
    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    // 9. Render loop
    this.animate();

    this.hideLoading();
  }

  private buildUI(): void {
    const paramsEl = document.getElementById('params') as HTMLElement;
    new ParameterPanel({
      container: paramsEl,
      config: this.currentConfig,
      onChange: (path, value) => this.onParamChange(path, value),
    });

    const exportEl = document.getElementById('export') as HTMLElement;
    new ExportPanel({
      container: exportEl,
      getScene: () => this.sceneManager.get()!.scene,
      getRenderer: () => this.engine.renderer,
    });

    const loreEl = document.getElementById('lore') as HTMLElement;
    new LoreInput({
      container: loreEl,
      onParse: () => this.generateAll(),
      onGenerateAll: () => this.generateAll(),
    });
  }

  private onParamChange(path: string, value: number | boolean | string): void {
    // Real-time param application (limited set)
    const managed = this.sceneManager.get();
    if (!managed) return;

    const planet = managed.entities.planet;
    if (planet && path === 'planet.material.mountainHeight') {
      planet.scale.setScalar(1 + (value as number) * 0.5);
    }
    const diamond = managed.entities.diamond;
    if (diamond && path === 'diamond.material.ior') {
      const mesh = diamond.children[0] as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.ior = value as number;
      mat.needsUpdate = true;
    }
  }

  private generateAll(): void {
    const composer = new SceneComposer('belentani-' + Date.now());
    const outputs = composer.generateAll();
    this.currentConfig = composer.compose(outputs);

    this.postProcessing?.dispose();
    const managed = this.sceneManager.load(this.currentConfig);
    this.cameraController.applyConfig(this.currentConfig.camera);
    this.postProcessing = createPostProcessing(
      this.engine.renderer,
      managed.scene,
      managed.camera,
      this.currentConfig.postProcessing
    );
  }

  private getCinematicCamera(): SceneConfig['camera'] {
    return {
      type: 'PerspectiveCamera',
      fov: 43,
      near: 0.05,
      far: 200,
      position: { x: 0, y: 3, z: 18 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
    };
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.engine.resize(w, h);
    const managed = this.sceneManager.get();
    if (managed) {
      managed.camera.aspect = w / h;
      managed.camera.updateProjectionMatrix();
    }
    this.postProcessing?.setSize(w, h);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const managed = this.sceneManager.get();
    if (!managed) return;

    const stats = this.engine.getStats();
    const delta = stats.frameTimeMs / 1000 || 0.016;
    const elapsed = performance.now() / 1000;

    this.sceneManager.update(delta, elapsed);
    this.cameraController.update(delta);
    this.narrative?.update(delta, this.cameraController);

    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.engine.renderer.render(managed.scene, managed.camera);
    }

    // Update stats display
    this.statsEl.textContent = `${stats.fps} FPS | ${stats.drawCalls} calls | ${(stats.triangles / 1000).toFixed(1)}k tris | ${this.engine.backend.toUpperCase()}`;
  };

  private hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }
}

const app = new BelentaniApp();
app.init().catch((err) => {
  console.error('Failed to start Belentani Visual Engine:', err);
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'Error al iniciar: ' + String(err);
});
