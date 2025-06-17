// Dark Mode Toggle TypeScript
export class DarkModeToggle {
  private theme: string;
  private toggleButton?: HTMLButtonElement;

  constructor() {
    this.theme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.init();
  }

  private init() {
    this.applyTheme(this.theme);
    this.createToggleButton();
    this.listenForSystemThemeChanges();
  }

  private createToggleButton() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.innerHTML = `<span class="theme-toggle-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>`;
    
    toggle.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  public toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    this.updateToggleButton();
    localStorage.setItem('theme', this.theme);
  }

  private applyTheme(theme: string) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private updateToggleButton() {
    if (this.toggleButton) {
      const icon = this.toggleButton.querySelector('.theme-toggle-icon');
      if (icon) {
        icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
      }
    }
  }

  private listenForSystemThemeChanges() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.theme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.theme);
          this.updateToggleButton();
        }
      });
    }
  }

  public getTheme(): string {
    return this.theme;
  }
}

export const darkModeToggle = new DarkModeToggle();