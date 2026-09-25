/**
 * Parameter Panel - Real-time controls over scene parameters
 */

import type { SceneConfig } from '@belentani/core';

export interface ParameterPanelOptions {
  container: HTMLElement;
  config: SceneConfig;
  onChange?: (path: string, value: number | boolean | string) => void;
}

interface ParamDef {
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export class ParameterPanel {
  private container: HTMLElement;
  private onChange?: (path: string, value: number | boolean | string) => void;
  private defs: ParamDef[] = [];

  constructor(options: ParameterPanelOptions) {
    this.container = options.container;
    this.onChange = options.onChange;
    this.defs = this.extractDefs(options.config);
    this.render();
  }

  private extractDefs(config: SceneConfig): ParamDef[] {
    const defs: ParamDef[] = [];

    if (config.planet) {
      const m = config.planet.material;
      defs.push({ path: 'planet.material.mountainHeight', label: 'Planet Mountains', min: 0, max: 0.5, step: 0.005, value: m.mountainHeight ?? 0.16 });
      defs.push({ path: 'planet.material.breathSpeed', label: 'Planet Breath', min: 0, max: 4, step: 0.05, value: m.breathSpeed ?? 1.35 });
    }
    if (config.diamond) {
      const m = config.diamond.material;
      defs.push({ path: 'diamond.material.ior', label: 'Diamond IOR', min: 1.5, max: 3, step: 0.001, value: m.ior });
      defs.push({ path: 'diamond.material.dispersion', label: 'Dispersion', min: 0, max: 0.1, step: 0.001, value: m.dispersion });
    }
    if (config.key) {
      const m = config.key.material;
      defs.push({ path: 'key.material.roughness', label: 'Key Roughness', min: 0, max: 1, step: 0.01, value: m.roughness });
    }
    if (config.machine) {
      defs.push({ path: 'machine.animation.pulseFrequency', label: 'Machine Pulse (Hz)', min: 100, max: 1000, step: 1, value: config.machine.animation.pulseFrequency });
    }

    return defs;
  }

  private render(): void {
    this.container.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Parameters';
    this.container.appendChild(title);

    for (const def of this.defs) {
      const row = document.createElement('div');
      row.className = 'param-row';

      const label = document.createElement('label');
      label.textContent = def.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(def.min);
      input.max = String(def.max);
      input.step = String(def.step);
      input.value = String(def.value);

      const value = document.createElement('span');
      value.className = 'param-value';
      value.textContent = def.value.toFixed(3);

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        value.textContent = v.toFixed(3);
        this.onChange?.(def.path, v);
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(value);
      this.container.appendChild(row);
    }
  }

  update(): void {
    // Reserved for future two-way binding
  }
}
