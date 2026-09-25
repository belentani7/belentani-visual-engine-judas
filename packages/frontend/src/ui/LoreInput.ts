/**
 * Lore Input - Paste lore markdown and generate a scene
 */

export interface LoreInputOptions {
  container: HTMLElement;
  onParse: (lore: string) => void;
  onGenerateAll: () => void;
}

export class LoreInput {
  private container: HTMLElement;
  private onParse: (lore: string) => void;
  private onGenerateAll: () => void;

  constructor(options: LoreInputOptions) {
    this.container = options.container;
    this.onParse = options.onParse;
    this.onGenerateAll = options.onGenerateAll;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Lore';
    this.container.appendChild(title);

    const textarea = document.createElement('textarea');
    textarea.className = 'lore-textarea';
    textarea.placeholder = 'Pega aquí el lore Belentani (markdown)...';
    textarea.rows = 6;
    this.container.appendChild(textarea);

    const parseBtn = document.createElement('button');
    parseBtn.className = 'panel-button';
    parseBtn.textContent = 'Parse & Generate';
    parseBtn.addEventListener('click', () => this.onParse(textarea.value));
    this.container.appendChild(parseBtn);

    const allBtn = document.createElement('button');
    allBtn.className = 'panel-button secondary';
    allBtn.textContent = 'Generate All (Default)';
    allBtn.addEventListener('click', () => this.onGenerateAll());
    this.container.appendChild(allBtn);
  }
}
