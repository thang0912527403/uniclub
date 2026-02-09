// Toggle between light and dark mode
export function toggleTheme(): void {
  const isDark = document.documentElement.classList.contains('dark');

  if (isDark) {
    // Switch to light
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    // Switch to dark
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }

  // Dispatch event for components that need to re-render
  window.dispatchEvent(new Event('themechange'));
}

// Use system preference
export function useSystemTheme(): void {
  localStorage.removeItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', prefersDark);
  window.dispatchEvent(new Event('themechange'));
}

// Check if dark mode is active
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

// Get current theme setting: 'light', 'dark', or 'system'
export function getTheme(): 'light' | 'dark' | 'system' {
  const theme = localStorage.getItem('theme');
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return 'system';
}
