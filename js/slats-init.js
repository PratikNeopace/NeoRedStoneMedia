/**
 * NeoRedStone Micro Slats Initialization & Lifecycle Controller
 * Seamlessly integrates the React Bits Micro Slats WebGL2 engine
 * with the signature NeoRedStone typographic wordmark.
 */

import { createMicroSlats } from './micro-slats.js';

function initNeoRedStoneSlats() {
  const wordmarkEl = document.getElementById('slats-wordmark-canvas');
  const ambientEl = document.getElementById('slats-ambient-container');
  const fallbackEl = document.getElementById('slats-fallback');
  const sectionEl = document.querySelector('.neoredstone-slats-section');

  if (!wordmarkEl) return;

  // 1. Initialize Foreground Wordmark Micro Slats
  const wordmarkInstance = createMicroSlats(wordmarkEl, {
    preset: 'swell',
    color: '#D4DAE5',         // Titanium-silver architectural base
    glintColor: '#FFFFFF',    // Specular brilliant crest glints
    accentColor: '#D13239',   // Signature NeoRedStone crimson accents
    backgroundColor: 'rgba(0,0,0,0)',
    slatWidth: 8,
    slatHeight: 26,
    gap: 2.2,
    roundness: 0.75,
    scale: 1.35,
    speed: 0.65,
    direction: 250,
    chop: 0.65,
    stretch: 0.15,
    glint: 1.9,
    contrast: 1.3,
    perspective: 0.55,
    fog: 0.05,                // Ultra-low fog keeps every slat letter razor sharp
    trail: 2.2,
    cursorStrength: 1.8,
    cursorSize: 48,
    lean: 0.35,
    intro: true,
    introDuration: 1.6
  });

  // If WebGL2 failed to initialize, activate the visual CSS/SVG fallback
  if (!wordmarkInstance) {
    if (fallbackEl) fallbackEl.style.display = 'flex';
    if (wordmarkEl) wordmarkEl.style.display = 'none';
    if (ambientEl) ambientEl.style.display = 'none';
    return;
  }

  // 2. Initialize Subtle Ambient Background Slats (if container is present)
  let ambientInstance = null;
  if (ambientEl) {
    ambientInstance = createMicroSlats(ambientEl, {
      preset: 'tide',
      color: '#161820',
      glintColor: '#282A36',
      accentColor: '#341517',
      backgroundColor: 'rgba(0,0,0,0)',
      slatWidth: 8,
      slatHeight: 24,
      gap: 2.8,
      roundness: 0.75,
      scale: 1.3,
      speed: 0.35,
      direction: 260,
      glint: 0.3,
      contrast: 1.0,
      perspective: 0.5,
      fog: 0.5,
      interactive: false,
      intro: false
    });
  }

  // 3. Section-level pointer forwarding for rich interactive fluid response
  if (sectionEl) {
    sectionEl.addEventListener('pointermove', e => {
      // Forward pointer events to the wordmark canvas
      const canvas = wordmarkEl.querySelector('canvas');
      if (canvas) {
        canvas.dispatchEvent(new PointerEvent('pointermove', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: false
        }));
      }
    }, { passive: true });

    sectionEl.addEventListener('pointerdown', e => {
      const canvas = wordmarkEl.querySelector('canvas');
      if (canvas) {
        canvas.dispatchEvent(new PointerEvent('pointerdown', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: false
        }));
      }
    }, { passive: true });
  }

  // 4. Clean resource disposal on page unload
  window.addEventListener('beforeunload', () => {
    wordmarkInstance?.destroy();
    ambientInstance?.destroy();
  }, { once: true });
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNeoRedStoneSlats);
} else {
  initNeoRedStoneSlats();
}
