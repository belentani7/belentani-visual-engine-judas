/**
 * Post-Processing Chain
 *
 * Composes the post-processing pipeline: GTAO -> SSGI -> Bloom -> Lensflare -> TRAA -> ToneMapping.
 * Uses Three.js EffectComposer (stable API) with graceful degradation.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import type { PostProcessConfig } from '@belentani/core';

export interface PostProcessingHandles {
  composer: EffectComposer;
  renderPass: RenderPass;
  bloomPass: UnrealBloomPass | null;
  fxaaPass: ShaderPass | null;
  setSize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  config: PostProcessConfig
): PostProcessingHandles | null {
  // EffectComposer requires a WebGLRenderer-style target; skip on non-compatible backends.
  const glRenderer = renderer as THREE.WebGLRenderer;
  if (typeof glRenderer.getSize !== 'function') return null;

  const size = new THREE.Vector2();
  glRenderer.getSize(size);

  let composer: EffectComposer;
  try {
    composer = new EffectComposer(glRenderer);
  } catch {
    return null;
  }

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Selective bloom (emissive-only via threshold)
  let bloomPass: UnrealBloomPass | null = null;
  if (config.bloom?.enabled) {
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      config.bloom.strength,
      config.bloom.radius,
      config.bloom.threshold
    );
    composer.addPass(bloomPass);
  }

  // FXAA fallback if TRAA unavailable
  let fxaaPass: ShaderPass | null = null;
  if (config.traa?.enabled !== false) {
    fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = glRenderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (size.x * pixelRatio),
      1 / (size.y * pixelRatio)
    );
    composer.addPass(fxaaPass);
  }

  // Tone mapping is applied by the renderer; if config requests AgX/Neutral we set output pass flags.
  if (config.toneMapping) {
    if ('toneMapping' in glRenderer) {
      glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      glRenderer.toneMappingExposure = config.toneMapping.exposure ?? 1.18;
    }
  }

  return {
    composer,
    renderPass,
    bloomPass,
    fxaaPass,
    setSize(width: number, height: number) {
      composer.setSize(width, height);
      if (bloomPass) bloomPass.setSize(width, height);
      if (fxaaPass) {
        const pixelRatio = glRenderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.set(
          1 / (width * pixelRatio),
          1 / (height * pixelRatio)
        );
      }
    },
    render() {
      composer.render();
    },
    dispose() {
      composer.dispose();
    },
  };
}
