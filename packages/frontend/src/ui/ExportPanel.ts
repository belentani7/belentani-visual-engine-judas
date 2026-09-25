/**
 * Export Panel - Export scene as GLTF / screenshot
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ExportPanelOptions {
  container: HTMLElement;
  getScene: () => THREE.Scene;
  getRenderer: () => THREE.WebGLRenderer;
}

export class ExportPanel {
  private container: HTMLElement;
  private getScene: () => THREE.Scene;
  private getRenderer: () => THREE.WebGLRenderer;

  constructor(options: ExportPanelOptions) {
    this.container = options.container;
    this.getScene = options.getScene;
    this.getRenderer = options.getRenderer;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Export';
    this.container.appendChild(title);

    this.container.appendChild(
      this.button('Export GLTF', () => this.exportGLTF())
    );
    this.container.appendChild(
      this.button('Screenshot PNG', () => this.screenshot())
    );
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'panel-button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private exportGLTF(): void {
    const exporter = new GLTFExporter();
    exporter.parse(
      this.getScene(),
      (result) => {
        const output = JSON.stringify(result, null, 2);
        this.download(new Blob([output], { type: 'application/json' }), 'belentani-scene.gltf');
      },
      (error) => console.error('GLTF export failed', error),
      { binary: false }
    );
  }

  private screenshot(): void {
    const renderer = this.getRenderer() as THREE.WebGLRenderer;
    if (typeof renderer.domElement.toDataURL !== 'function') return;
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'belentani-screenshot.png';
    link.click();
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
