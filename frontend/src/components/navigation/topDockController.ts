/**
 * topDockController.ts
 * Spring-based proximity animation controller for the CIT Animated Top Dock.
 * Variant: Sable
 * Default parameters:
 *  - proximity: 122
 *  - spring: 0.19
 *  - damping: 0.7
 *  - widthGrowth: 17
 *  - heightGrowth: 16
 *  - drop: 3.5
 */

export interface TopDockControllerOptions {
  variant?: 'sable' | 'modern' | 'retro' | 'glass';
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  axis?: 'x' | 'y';
  distribute?: boolean;
  lockTrack?: boolean;
}

export const TOP_DOCK_DEFAULTS: Required<TopDockControllerOptions> = {
  variant: 'sable',
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 0,
  heightGrowth: 0,
  drop: 1.2,
  axis: 'x',
  distribute: false,
  lockTrack: false,
};

interface DockItemState {
  element: HTMLElement;
  baseWidth: number;
  baseHeight: number;
  baseCenterX: number;
  baseCenterY: number;
  value: number;
  velocity: number;
  target: number;
}

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export function createTopDockController(
  navElement: HTMLElement,
  optionsGetter: () => TopDockControllerOptions
): () => void {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover:hover) and (pointer:fine)');

  const getOpts = (): Required<TopDockControllerOptions> => ({
    ...TOP_DOCK_DEFAULTS,
    ...optionsGetter(),
  });

  const rawElements = Array.from(navElement.querySelectorAll<HTMLElement>('[data-dock-item]'));
  const items: DockItemState[] = rawElements.map((el) => ({
    element: el,
    baseWidth: 0,
    baseHeight: 0,
    baseCenterX: 0,
    baseCenterY: 0,
    value: 0,
    velocity: 0,
    target: 0,
  }));

  let isEnabled = false;
  let isHovering = false;
  let isDirty = false;
  let animFrameId = 0;
  let isDisposed = false;

  // Cached geometry to avoid layout thrashing during mouse movement
  let cachedNavRect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

  // Pending pointer coordinates throttled to RAF
  let pendingX = 0;
  let pendingY = 0;
  let hasPendingMove = false;

  const checkEnabled = () =>
    !reducedMotionQuery.matches &&
    navElement.clientWidth > 0 &&
    window.innerWidth > 600 &&
    finePointerQuery.matches;

  const layout = () => {
    isEnabled = checkEnabled();
    const opts = getOpts();

    if (isHovering) return; // Do not interrupt or reset active hover interaction

    if (opts.lockTrack) {
      navElement.style.width = '';
    }

    // Reset styles so we measure unexpanded baseline geometry
    for (const item of items) {
      item.element.style.width = '';
      item.element.style.height = '';
      item.element.style.transform = '';
      item.element.dataset.dockNear = 'false';
    }

    // Single batched measurement pass
    const navRect = navElement.getBoundingClientRect();
    cachedNavRect = {
      left: navRect.left,
      right: navRect.right,
      top: navRect.top,
      bottom: navRect.bottom,
      width: navRect.width,
      height: navRect.height,
    };

    for (const item of items) {
      const rect = item.element.getBoundingClientRect();
      item.baseWidth = rect.width;
      item.baseHeight = rect.height;
      item.baseCenterX = rect.left + rect.width * 0.5;
      item.baseCenterY = rect.top + rect.height * 0.5;
      item.value = 0;
      item.velocity = 0;
      item.target = 0;
    }

    isDirty = false;
    hasPendingMove = false;

    if (opts.distribute && opts.axis !== 'y') {
      distributeItems();
    }

    if (opts.lockTrack) {
      navElement.style.width = `${cachedNavRect.width.toFixed(2)}px`;
    }

    navElement.dataset.dockState = isEnabled ? 'idle' : 'static';
    navElement.dataset.dockMax = '0.00';
  };

  const distributeItems = () => {
    const opts = getOpts();
    if (opts.distribute && opts.axis !== 'y') {
      const widths = items.map((s) => s.baseWidth + opts.widthGrowth * clamp(s.value, 0, 1.08));
      const totalWidth = widths.reduce((sum, w) => sum + w, 0);
      const clientW = navElement.clientWidth;
      const d = clientW >= totalWidth ? clientW : 0;
      items.forEach((s, idx) => {
        s.element.style.width = d ? `${((d * widths[idx]) / totalWidth).toFixed(2)}px` : '';
        s.element.style.height = '';
        s.element.style.transform = '';
      });
    }
  };

  const startLoop = () => {
    if (isDisposed || !isEnabled) return;
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(tick);
    }
  };

  // Compute targets relative to cached static baseline item centers
  // Zero DOM read phase - pure arithmetic calculation
  const updateTargets = (clientX: number, clientY: number) => {
    if (!isEnabled) return;
    const opts = getOpts();
    const isY = opts.axis === 'y';
    const pointerCoord = isY ? clientY : clientX;

    for (let i = 0; i < items.length; i++) {
      const itemCenter = isY ? items[i].baseCenterY : items[i].baseCenterX;
      const normalizedDist = clamp(
        1 - Math.abs(pointerCoord - itemCenter) / Math.max(1, opts.proximity),
        0,
        1
      );
      // Smoothstep curve: 3x^2 - 2x^3
      const smoothed = normalizedDist * normalizedDist * (3 - 2 * normalizedDist);
      items[i].target = smoothed;
      
      // Hysteresis threshold to prevent edge jitter/oscillation:
      const currentNear = items[i].element.dataset.dockNear === 'true';
      const isNear = currentNear ? smoothed > 0.05 : smoothed > 0.12;
      if (items[i].element.dataset.dockNear !== (isNear ? 'true' : 'false')) {
        items[i].element.dataset.dockNear = isNear ? 'true' : 'false';
      }
    }

    isHovering = true;
    isDirty = true;
    if (navElement.dataset.dockState !== 'active') {
      navElement.dataset.dockState = 'active';
    }
  };

  const onFocusIn = (targetEl: HTMLElement) => {
    if (!isEnabled) return;
    const idx = items.findIndex((it) => it.element === targetEl);
    if (idx < 0) return;

    items.forEach((it, i) => {
      it.target = i === idx ? 1 : Math.abs(i - idx) === 1 ? 0.24 : 0;
      const isNear = it.target > 0.08;
      if (it.element.dataset.dockNear !== (isNear ? 'true' : 'false')) {
        it.element.dataset.dockNear = isNear ? 'true' : 'false';
      }
    });

    isHovering = false;
    isDirty = true;
    if (navElement.dataset.dockState !== 'focus') {
      navElement.dataset.dockState = 'focus';
    }
    startLoop();
  };

  const resetTargets = () => {
    isHovering = false;
    hasPendingMove = false;
    isDirty = true;
    items.forEach((it) => {
      it.target = 0;
      if (it.element.dataset.dockNear !== 'false') {
        it.element.dataset.dockNear = 'false';
      }
    });
    startLoop();
  };

  const applyStyles = () => {
    for (const it of items) {
      const clampedVal = clamp(it.value, 0, 1);

      // Keep button dimensions completely stable - zero width/height layout manipulation
      if (it.element.style.width !== '') it.element.style.width = '';
      if (it.element.style.height !== '') it.element.style.height = '';

      // Subtle GPU-composited vertical transform (never shifts sibling layout)
      if (clampedVal > 0.01) {
        it.element.style.transform = `translateY(-${(clampedVal * 1.0).toFixed(2)}px)`;
      } else if (it.element.style.transform !== '') {
        it.element.style.transform = '';
      }

      // Proximity custom property for CSS styling
      it.element.style.setProperty('--dock-proximity', clampedVal.toFixed(3));
    }
  };

  const tick = () => {
    animFrameId = 0;
    if (!isEnabled || isDisposed) return;

    if (hasPendingMove) {
      updateTargets(pendingX, pendingY);
      hasPendingMove = false;
    }

    if (isDirty) {
      const opts = getOpts();
      let hasMovement = false;
      let maxVal = 0;

      for (const it of items) {
        it.velocity += (it.target - it.value) * opts.spring;
        it.velocity *= opts.damping;
        it.value += it.velocity;

        if (Math.abs(it.target - it.value) < 2e-3 && Math.abs(it.velocity) < 2e-3) {
          it.value = it.target;
          it.velocity = 0;
        } else {
          hasMovement = true;
        }

        maxVal = Math.max(maxVal, clamp(it.value, 0, 1.08));
      }

      applyStyles();
      const maxValStr = maxVal.toFixed(2);
      if (navElement.dataset.dockMax !== maxValStr) {
        navElement.dataset.dockMax = maxValStr;
      }

      if (!hasMovement) {
        isDirty = false;
        if (items.every((it) => it.target === 0)) {
          if (navElement.dataset.dockState !== 'idle') {
            navElement.dataset.dockState = 'idle';
          }
        }
      }
    }

    // Keep loop active while dirty, hovering or settling
    if (isDirty || isHovering) {
      animFrameId = requestAnimationFrame(tick);
    }
  };

  // Event handlers throttled via RAF
  const handleNavPointerMove = (e: PointerEvent) => {
    if (!isEnabled) return;
    pendingX = e.clientX;
    pendingY = e.clientY;
    hasPendingMove = true;
    isDirty = true;
    startLoop();
  };

  const handleNavPointerLeave = () => {
    resetTargets();
  };

  const handleWindowPointerMove = (e: PointerEvent) => {
    if (!isHovering) return;
    // Boundary check with hysteresis to prevent edge jitter/oscillation
    const padX = 48;
    const padY = 28;

    if (
      e.clientX < cachedNavRect.left - padX ||
      e.clientX > cachedNavRect.right + padX ||
      e.clientY < cachedNavRect.top - padY ||
      e.clientY > cachedNavRect.bottom + padY
    ) {
      resetTargets();
    }
  };

  const handleFocusIn = (e: FocusEvent) => {
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-dock-item]');
    if (target) onFocusIn(target);
  };

  const handleFocusOut = () => {
    requestAnimationFrame(() => {
      if (!navElement.contains(document.activeElement)) {
        resetTargets();
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-dock-item]');
    if (target && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      target.click();
    }
  };

  const handleClick = () => {
    resetTargets();
  };

  // Layout synchronization
  const onMediaChange = () => layout();
  const onFontReady = () => {
    if (!isDisposed) layout();
  };

  document.fonts?.ready.then(onFontReady);

  let lastObservedW = 0;
  let lastObservedH = 0;
  const resizeObserver = new ResizeObserver((entries) => {
    if (isHovering || isDisposed) return;
    for (const entry of entries) {
      const cr = entry.contentRect;
      if (Math.abs(cr.width - lastObservedW) > 4 || Math.abs(cr.height - lastObservedH) > 4) {
        lastObservedW = cr.width;
        lastObservedH = cr.height;
        layout();
      }
    }
  });
  const observeTarget = navElement.closest('[data-dock-frame]') || navElement.parentElement || navElement;
  resizeObserver.observe(observeTarget);

  // Bind event listeners
  navElement.addEventListener('pointermove', handleNavPointerMove);
  navElement.addEventListener('pointerleave', handleNavPointerLeave);
  navElement.addEventListener('focusin', handleFocusIn);
  navElement.addEventListener('focusout', handleFocusOut);
  navElement.addEventListener('keydown', handleKeyDown);
  navElement.addEventListener('click', handleClick);
  window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
  window.addEventListener('resize', onMediaChange, { passive: true });

  reducedMotionQuery.addEventListener('change', onMediaChange);
  finePointerQuery.addEventListener('change', onMediaChange);

  // Initialize layout and apply baseline styles
  layout();
  applyStyles();

  // Return unmount cleanup function
  return () => {
    isDisposed = true;
    navElement.style.width = '';
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = 0;
    }
    resizeObserver.disconnect();

    navElement.removeEventListener('pointermove', handleNavPointerMove);
    navElement.removeEventListener('pointerleave', handleNavPointerLeave);
    navElement.removeEventListener('focusin', handleFocusIn);
    navElement.removeEventListener('focusout', handleFocusOut);
    navElement.removeEventListener('keydown', handleKeyDown);
    navElement.removeEventListener('click', handleClick);
    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('resize', onMediaChange);

    reducedMotionQuery.removeEventListener('change', onMediaChange);
    finePointerQuery.removeEventListener('change', onMediaChange);
  };
}

