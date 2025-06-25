// Dark Mode Toggle JavaScript
class DarkModeToggle {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.createToggleButton();
    this.listenForSystemThemeChanges();
  }

  createToggleButton() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.innerHTML = `<span class="theme-toggle-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>`;
    
    toggle.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    this.updateToggleButton();
    localStorage.setItem('theme', this.theme);
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  updateToggleButton() {
    if (this.toggleButton) {
      const icon = this.toggleButton.querySelector('.theme-toggle-icon');
      icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  listenForSystemThemeChanges() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => {
        if (!localStorage.getItem('theme')) {
          this.theme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.theme);
          this.updateToggleButton();
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.darkModeToggle = new DarkModeToggle();
});