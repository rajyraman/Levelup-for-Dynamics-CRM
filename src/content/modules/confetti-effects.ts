// Confetti burst for subtle God Mode delight
// Minimal DOM footprint, no external deps, small CSS injected per-document.

export class ConfettiEffects {
  static createConfettiBurst(): void {
    ConfettiEffects.run(false);
  }

  static testConfetti(): void {
    ConfettiEffects.run(true);
  }

  private static addStyles(doc: Document): void {
    const id = 'levelup-confetti-styles';
    if (doc.getElementById(id)) {
      return;
    }

    const style = doc.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes levelup-confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(120vh) rotate(720deg); opacity: 0.9; }
      }
      .levelup-confetti {
        position: fixed;
        pointer-events: none;
        will-change: transform, opacity;
      }
    `;

    try {
      const target = doc.head || doc.documentElement;
      target.appendChild(style);
    } catch (err) {
      // ignore cross-origin or unavailable heads
      void err;
    }
  }

  private static createConfettiPiece(
    doc: Document,
    root: Element,
    x: number,
    y: number,
    colors: string[]
  ): void {
    const el = doc.createElement('div');
    el.className = 'levelup-confetti';
    const w = 6 + Math.floor(Math.random() * 10);
    const h = 8 + Math.floor(Math.random() * 10);
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.zIndex = '1000000';
    // random tilt
    const rotate = Math.floor(Math.random() * 360);
    el.style.transform = `rotate(${rotate}deg)`;
    el.style.borderRadius = '2px';
    // add slight horizontal drift via transition + transform
    const duration = 900 + Math.floor(Math.random() * 700);
    const delay = Math.floor(Math.random() * 200);
    el.style.transition = `transform ${duration}ms cubic-bezier(.2,.7,.2,1) ${delay}ms, opacity ${duration}ms linear ${delay}ms`;

    root.appendChild(el);

    // force layout then animate
    // horizontal drift range - make drift proportional to viewport width so pieces spread nicely
    const docW =
      doc.documentElement && doc.documentElement.clientWidth
        ? doc.documentElement.clientWidth
        : window.innerWidth;
    const maxDrift = Math.max(300, Math.floor(docW * 0.5));
    const drift = (Math.random() - 0.5) * maxDrift; // px
    // vertical travel managed by keyframes animation
    try {
      // start keyframe animation
      const styleObj = el.style as CSSStyleDeclaration & { animation?: string };
      styleObj.animation = `levelup-confetti-fall ${duration}ms linear ${delay}ms forwards`;

      // apply extra transform for horizontal drift + additional rotation
      requestAnimationFrame(() => {
        try {
          el.style.transform = `translateX(${drift}px) rotate(${rotate + (drift > 0 ? 120 : -120)}deg)`;
          el.style.opacity = '0.95';
        } catch (e) {
          void e;
        }
      });
    } catch (err) {
      void err;
    }

    // cleanup after animation
    const cleanup = (): void => {
      try {
        el.remove();
      } catch (e) {
        void e;
      }
    };

    setTimeout(cleanup, duration + delay + 300);
  }

  private static run(showBadge: boolean): void {
    const inject = (doc: Document): void => {
      try {
        ConfettiEffects.addStyles(doc);

        const root = doc.body || doc.documentElement;
        if (!root) {
          return;
        }

        if (showBadge) {
          const badge = doc.createElement('div');
          badge.textContent = '🎉';
          badge.className = 'levelup-confetti';
          badge.style.position = 'fixed';
          badge.style.top = '12px';
          badge.style.right = '12px';
          badge.style.fontSize = '18px';
          badge.style.zIndex = '1000001';
          root.appendChild(badge);
          setTimeout(() => {
            try {
              badge.remove();
            } catch (e) {
              void e;
            }
          }, 900);
        }

        const count = 18; // small burst
        const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ff6b81', '#f368e0'];

        for (let i = 0; i < count; i++) {
          // compute viewport size per-iteration (avoids previous linter/indent issues)
          const docWLocal =
            doc.documentElement && doc.documentElement.clientWidth
              ? doc.documentElement.clientWidth
              : window.innerWidth;

          const docHLocal =
            doc.documentElement && doc.documentElement.clientHeight
              ? doc.documentElement.clientHeight
              : window.innerHeight;
          // spawn across the full viewport width (allow a small horizontal padding)
          const horizontalPadding = Math.min(16, Math.floor(docWLocal * 0.02));
          const x = Math.floor(
            horizontalPadding + Math.random() * (docWLocal - horizontalPadding * 2)
          );
          const y = Math.floor(docHLocal * 0.2 + (Math.random() - 0.5) * docHLocal * 0.1);
          ConfettiEffects.createConfettiPiece(doc, root, x, y, colors);
        }
      } catch (err) {
        void err;
      }
    };

    // Attempt to inject into top-level document if same-origin
    try {
      const topWindow = window.top as Window | null;
      if (topWindow && topWindow.document) {
        inject(topWindow.document);
      }
    } catch (err) {
      void err;
    }

    // Always inject into current document
    inject(document);

    // Inject into same-origin child frames if accessible
    try {
      const frames = window.frames;
      for (let i = 0; i < frames.length; i++) {
        try {
          const f = frames[i] as Window;
          if (f && f.document && f.document !== document) {
            inject(f.document);
          }
        } catch (e) {
          void e;
        }
      }
    } catch (err) {
      void err;
    }
  }
}

// expose for console debugging (avoid casting to any)
try {
  const w = window as unknown as { ConfettiEffects?: unknown };
  w.ConfettiEffects = ConfettiEffects as unknown;
} catch (err) {
  void err;
}
