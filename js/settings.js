// Einstellungen, die für alle Seiten gelten (gesetzt im Spiel unter „Einstellungen“).
// Liegen im localStorage dieses Browsers.

const KEY = 'coinmaster.settings';

export const DEFAULT_SETTINGS = { music: 60, sfx: 80, quality: 'mittel', skipAnimations: false, fewerParticles: false, shortNumbers: true };

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

// Auflösung der 3D-Ansichten je nach Grafikqualität
export function pixelRatio() {
  const cap = { niedrig: 1, mittel: 1.5, hoch: 2 }[loadSettings().quality] ?? 1.5;
  return Math.min(devicePixelRatio, cap);
}

// Animationen überspringen: eingestellt oder vom System gewünscht
export const skipAnimations = () => loadSettings().skipAnimations || matchMedia('(prefers-reduced-motion: reduce)').matches;
