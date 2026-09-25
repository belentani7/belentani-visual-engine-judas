/**
 * Render Engine - Three.js WebGPU/TSL with WebGL2 fallback
 *
 * Manages renderer lifecycle, render pipeline, multi-render-targets,
 * and post-processing composition.
 */

import * as THREE from 'three';
import type { SceneConfig, RendererSettings } from '@belentani/core';

export type RenderBackend = 'webgpu' | 'webgl2';

export interface RenderEngineOptions {
  canvas: HTMLCanvasElement;
  settings?: Partial<RendererSettings>;
}

export interface FrameStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  programs: number;
}

export class RenderEngine {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly backend: RenderBackend;
  public readonly canvas: HTMLCanvasElement;

  private clock: THREE.Clock;
  private frameCount = 0;
  private lastFPSUpdate = 0;
  private currentFPS = 0;
  private stats: FrameStats = {
    fps: 0,
    frameTimeMs: 0,
    drawCalls: 0,
    triangles: 0,
    programs: 0,
  };
  private onFrameCallbacks: Array<(delta: number, elapsed: number) => void> = [];

  constructor(options: RenderEngineOptions) {
    this.canvas = options.canvas;
    this.clock = new THREE.Clock();

    const settings: Partial<RendererSettings> = options.settings ?? {};
    const webgpuAvailable =
      typeof navigator !== 'undefined' && 'gpu' in navigator;

    if (webgpuAvailable) {
      // WebGPU is available. three's WebGPURenderer lives in 'three/webgpu';
      // we attempt a dynamic resolution and fall back to WebGL2 if unavailable.
      const THREEAny = THREE as unknown as Record<string, unknown>;
      const WebGPURendererCtor = THREEAny['WebGPURenderer'] as
        | (new (params: Record<string, unknown>) => THREE.WebGLRenderer)
        | undefined;

      if (WebGPURendererCtor) {
        try {
          this.renderer = new WebGPURendererCtor({
            canvas: this.canvas,
            antialias: settings.antialias ?? true,
            alpha: settings.alpha ?? false,
            powerPreference: settings.powerPreference ?? 'high-performance',
          });
          this.backend = 'webgpu';
        } catch {
          this.renderer = this.createWebGLRenderer(settings);
          this.backend = 'webgl2';
        }
      } else {
        this.renderer = this.createWebGLRenderer(settings);
        this.backend = 'webgl2';
      }
    } else {
      this.renderer = this.createWebGLRenderer(settings);
      this.backend = 'webgl2';
    }

    this.configureRenderer(settings);
  }

  private createWebGLRenderer(settings: Partial<RendererSettings>): THREE.WebGLRenderer {
    return new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: settings.antialias ?? true,
      alpha: settings.alpha ?? false,
      stencil: settings.stencil ?? false,
      depth: settings.depth ?? true,
      logarithmicDepthBuffer: settings.logarithmicDepthBuffer ?? false,
      preserveDrawingBuffer: settings.preserveDrawingBuffer ?? false,
      failIfMajorPerformanceCaveat: settings.failIfMajorPerformanceCaveat ?? false,
      powerPreference: settings.powerPreference ?? 'high-performance',
    });
  }

  private configureRenderer(settings: Partial<RendererSettings>): void {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const pixelRatio = settings.pixelRatio ?? Math.min(dpr, 2);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    const gl = this.renderer as THREE.WebGLRenderer;
    if ('outputColorSpace' in gl) {
      gl.outputColorSpace = settings.outputColorSpace === 'LinearSRGBColorSpace'
        ? THREE.LinearSRGBColorSpace
        : THREE.SRGBColorSpace;
    }
    if ('toneMapping' in gl) {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = settings.toneMappingExposure ?? 1.18;
    }
    if ('shadowMap' in gl) {
      gl.shadowMap.enabled = settings.shadowMap?.enabled ?? true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    if ('physicallyCorrectLights' in gl) {
      (gl as unknown as { useLegacyLights: boolean }).useLegacyLights = false;
    }
  }

  /** Register a per-frame callback */
  onFrame(callback: (delta: number, elapsed: number) => void): () => void {
    this.onFrameCallbacks.push(callback);
    return () => {
      const idx = this.onFrameCallbacks.indexOf(callback);
      if (idx >= 0) this.onFrameCallbacks.splice(idx, 1);
    };
  }

  /** Render a single frame */
  render(scene: THREE.Scene, camera: THREE.Camera): FrameStats {
    const frameStart = performance.now();
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Execute per-frame callbacks (animation, uniforms, etc.)
    for (const cb of this.onFrameCallbacks) {
      cb(delta, elapsed);
    }

    this.renderer.render(scene, camera);

    // Stats
    const frameTimeMs = performance.now() - frameStart;
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFPSUpdate >= 500) {
      this.currentFPS = (this.frameCount * 1000) / (now - this.lastFPSUpdate);
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }

    const info = this.renderer.info;
    this.stats = {
      fps: Math.round(this.currentFPS),
      frameTimeMs,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      programs: info.programs?.length ?? 0,
    };

    return this.stats;
  }

  getStats(): FrameStats {
    return { ...this.stats };
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
  }

  dispose(): void {
    this.onFrameCallbacks = [];
    this.renderer.dispose();
  }

  /** Detect capability report for diagnostics */
  static detectCapabilities(): {
    webgpu: boolean;
    webgl2: boolean;
    maxTextureSize: number;
    extensions: string[];
  } {
    const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    let webgl2 = false;
    let maxTextureSize = 0;
    let extensions: string[] = [];

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      if (gl) {
        webgl2 = true;
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        extensions = gl.getSupportedExtensions() ?? [];
      }
    } catch {
      // No WebGL available
    }

    return { webgpu, webgl2, maxTextureSize, extensions };
  }
}
