import React, { useRef, useEffect, useImperativeHandle } from 'react';

export interface StarBorderProps<T extends React.ElementType = 'button'> {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  trailColor?: string;
  duration?: number;
  thickness?: number;
  radius?: number;
  trailLength?: number;
  stars?: number;
  glow?: number;
  sparkle?: boolean;
  direction?: 'clockwise' | 'counter-clockwise';
  hover?: 'lap' | 'speed' | 'pause' | 'reverse' | 'none';
  clickPulse?: boolean;
  theme?: 'light' | 'dark';
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

/**
 * Calculates a 2D coordinate on a rounded rectangle perimeter given a distance from the top-center.
 */
function getPointOnRoundedRect(
  d: number,
  w: number,
  h: number,
  r: number
): { x: number; y: number } {
  // 4 Straight edges
  const topEdge = Math.max(0, w - 2 * r);
  const rightEdge = Math.max(0, h - 2 * r);
  const bottomEdge = Math.max(0, w - 2 * r);
  const leftEdge = Math.max(0, h - 2 * r);
  const cornerArc = (Math.PI / 2) * r;

  const L1 = topEdge / 2; // top-center to top-right corner start
  const L2 = L1 + cornerArc; // through top-right corner
  const L3 = L2 + rightEdge; // down right edge
  const L4 = L3 + cornerArc; // through bottom-right corner
  const L5 = L4 + bottomEdge; // across bottom edge
  const L6 = L5 + cornerArc; // through bottom-left corner
  const L7 = L6 + leftEdge; // up left edge
  const L8 = L7 + cornerArc; // through top-left corner
  const total = L8 + topEdge / 2; // back to top-center

  // Normalize distance into [0, total)
  let norm = d % total;
  if (norm < 0) norm += total;

  // Segment 1: top-center to top-right straight start
  if (norm < L1) {
    return { x: w / 2 + norm, y: 0 };
  }
  // Segment 2: top-right corner arc (-PI/2 to 0)
  if (norm < L2) {
    const angle = -Math.PI / 2 + (norm - L1) / r;
    return {
      x: w - r + r * Math.cos(angle),
      y: r + r * Math.sin(angle),
    };
  }
  // Segment 3: right edge down
  if (norm < L3) {
    return { x: w, y: r + (norm - L2) };
  }
  // Segment 4: bottom-right corner arc (0 to PI/2)
  if (norm < L4) {
    const angle = (norm - L3) / r;
    return {
      x: w - r + r * Math.cos(angle),
      y: h - r + r * Math.sin(angle),
    };
  }
  // Segment 5: bottom edge across (right to left)
  if (norm < L5) {
    return { x: w - r - (norm - L4), y: h };
  }
  // Segment 6: bottom-left corner arc (PI/2 to PI)
  if (norm < L6) {
    const angle = Math.PI / 2 + (norm - L5) / r;
    return {
      x: r + r * Math.cos(angle),
      y: h - r + r * Math.sin(angle),
    };
  }
  // Segment 7: left edge up
  if (norm < L7) {
    return { x: 0, y: h - r - (norm - L6) };
  }
  // Segment 8: top-left corner arc (PI to 3*PI/2)
  if (norm < L8) {
    const angle = Math.PI + (norm - L7) / r;
    return {
      x: r + r * Math.cos(angle),
      y: r + r * Math.sin(angle),
    };
  }
  // Segment 9: top-left to top-center
  return { x: r + (norm - L8), y: 0 };
}

export const StarBorder = React.forwardRef<HTMLElement, StarBorderProps<any>>(
  function StarBorder(
    {
      as,
      className = '',
      children,
      color = '#C8693F', // Secondary terracotta head
      trailColor = '#A9502B', // Primary terracotta trail
      duration = 4, // 4s complete perimeter cycle
      thickness = 1.2, // 1.2px crisp path thickness
      radius = 12, // 12px rounded corner radius
      trailLength = 0.3, // 30% of perimeter trail
      stars = 1,
      glow = 0.45,
      sparkle = false,
      direction = 'clockwise',
      hover = 'lap',
      clickPulse = true,
      theme = 'light',
      disabled = false,
      style,
      onClick,
      type,
      ...restProps
    },
    ref
  ) {
    const Component = as || ('button' as React.ElementType);
    const containerRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLElement);

    // Refs for hover and focus to avoid triggering re-renders and canvas teardowns
    const isHoveredRef = useRef(false);
    const isFocusedRef = useRef(false);

    // Cached container dimensions to avoid calling getBoundingClientRect on every animation frame
    const sizeRef = useRef({ w: 0, h: 0 });

    // Speed multiplier for hover 'lap' animation
    const speedRef = useRef(1);
    const progressRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);
    const pulseRef = useRef(0);
    const isVisibleRef = useRef(true);

    // Handle click pulse
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      if (clickPulse) {
        pulseRef.current = 1;
      }
      if (onClick) onClick(e);
    };

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Detect user's reduced-motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Track size via ResizeObserver
      const updateSize = () => {
        if (!container) return;
        sizeRef.current = {
          w: container.offsetWidth,
          h: container.offsetHeight,
        };
      };
      updateSize();

      const resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(container);

      // IntersectionObserver to avoid rendering when off-screen
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisibleRef.current = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      let animationFrameId: number;

      const render = (time: number) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = sizeRef.current.w;
        const h = sizeRef.current.h;

        if (w <= 0 || h <= 0) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Handle canvas resize
        const targetCanvasW = Math.round(w * dpr);
        const targetCanvasH = Math.round(h * dpr);
        if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
          canvas.width = targetCanvasW;
          canvas.height = targetCanvasH;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);

        // Clamp radius so corners never collapse
        const r = Math.min(radius, w / 2, h / 2);

        // Base static perimeter path
        const basePerimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;

        // Draw subtle underlying boundary guide
        ctx.beginPath();
        ctx.roundRect(thickness / 2, thickness / 2, w - thickness, h - thickness, r);
        ctx.strokeStyle =
          theme === 'dark'
            ? 'rgba(243, 236, 226, 0.12)'
            : 'rgba(30, 25, 21, 0.1)';
        ctx.lineWidth = thickness;
        ctx.stroke();

        // If disabled or reduced motion, render static subdued border and exit loop
        if (prefersReducedMotion && !disabled) {
          ctx.beginPath();
          ctx.roundRect(thickness / 2, thickness / 2, w - thickness, h - thickness, r);
          ctx.strokeStyle = trailColor;
          ctx.lineWidth = thickness;
          ctx.stroke();
          ctx.restore();
          return;
        }

        if (disabled) {
          ctx.restore();
          return; // No animation loop needed
        }

        if (!isVisibleRef.current) {
          ctx.restore();
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        // Delta time calculation
        if (lastTimeRef.current === null) lastTimeRef.current = time;
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = time;

        // Target speed calculation based on hover prop (reading ref without component re-render)
        let targetSpeed = 1;
        if (isHoveredRef.current || isFocusedRef.current) {
          if (hover === 'lap') targetSpeed = 2.4;
          else if (hover === 'speed') targetSpeed = 1.8;
          else if (hover === 'pause') targetSpeed = 0;
          else if (hover === 'reverse') targetSpeed = -1.2;
        }
        speedRef.current += (targetSpeed - speedRef.current) * 0.12;

        // Advance orbital progress
        const cycleTime = Math.max(duration, 0.5);
        const dirSign = direction === 'counter-clockwise' ? -1 : 1;
        progressRef.current =
          (progressRef.current + dirSign * (dt / cycleTime) * speedRef.current) % 1;
        if (progressRef.current < 0) progressRef.current += 1;

        // Animate click pulse wave
        if (pulseRef.current > 0) {
          pulseRef.current = Math.max(0, pulseRef.current - dt * 2.2); // ~450ms pulse
          const pulseExpand = (1 - pulseRef.current) * 8;
          const pulseAlpha = pulseRef.current * 0.55;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(
            -pulseExpand,
            -pulseExpand,
            w + pulseExpand * 2,
            h + pulseExpand * 2,
            r + pulseExpand
          );
          ctx.strokeStyle = trailColor;
          ctx.globalAlpha = pulseAlpha;
          ctx.lineWidth = thickness * 1.5;
          ctx.shadowColor = trailColor;
          ctx.shadowBlur = glow * 12;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Orbiting Light Trails
        const trailDistance = basePerimeter * trailLength;
        const numSegments = 32;

        for (let s = 0; s < stars; s++) {
          const starOffset = s / stars;
          const headDistance = ((progressRef.current + starOffset) % 1) * basePerimeter;

          // Draw segmented fading trail
          for (let i = 0; i < numSegments; i++) {
            const t1 = i / numSegments;
            const t2 = (i + 1) / numSegments;

            // Distance from tail (t=0) to head (t=1)
            const d1 = headDistance - (1 - t1) * trailDistance;
            const d2 = headDistance - (1 - t2) * trailDistance;

            const p1 = getPointOnRoundedRect(d1, w - thickness, h - thickness, r);
            const p2 = getPointOnRoundedRect(d2, w - thickness, h - thickness, r);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x + thickness / 2, p1.y + thickness / 2);
            ctx.lineTo(p2.x + thickness / 2, p2.y + thickness / 2);

            // Quadratic ease-in alpha towards the head
            const alpha = Math.pow(t2, 2.2);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = t2 > 0.75 ? color : trailColor;
            ctx.lineWidth = thickness * (0.8 + 0.5 * t2);

            if (t2 > 0.5) {
              ctx.shadowColor = trailColor;
              ctx.shadowBlur = glow * 10 * t2;
            }

            ctx.stroke();
            ctx.restore();
          }

          // Draw Star Head Glow
          const headPt = getPointOnRoundedRect(headDistance, w - thickness, h - thickness, r);
          const hx = headPt.x + thickness / 2;
          const hy = headPt.y + thickness / 2;

          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = glow * 22;

          // Outer glow aura
          ctx.beginPath();
          ctx.arc(hx, hy, thickness * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Bright white-gold core
          ctx.beginPath();
          ctx.arc(hx, hy, thickness * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF8EE';
          ctx.fill();

          // Optional micro-sparkles
          if (sparkle) {
            const sparkleA = (time * 0.005) % (Math.PI * 2);
            const sx = hx + Math.cos(sparkleA) * (thickness * 2.5);
            const sy = hy + Math.sin(sparkleA) * (thickness * 2.5);
            ctx.beginPath();
            ctx.arc(sx, sy, thickness * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          }

          ctx.restore();
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        resizeObserver.disconnect();
        observer.disconnect();
        cancelAnimationFrame(animationFrameId);
      };
    }, [
      color,
      trailColor,
      duration,
      thickness,
      radius,
      trailLength,
      stars,
      glow,
      sparkle,
      direction,
      hover,
      theme,
      disabled,
    ]);

    // If Component is a native button, default type to 'button' unless provided
    const buttonTypeProps =
      Component === 'button'
        ? { type: type || 'button' }
        : type
        ? { type }
        : {};

    return (
      <Component
        ref={containerRef}
        className={`relative inline-flex items-center justify-center transition-all duration-200 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        style={{
          borderRadius: radius,
          ...style,
        }}
        onClick={handleClick}
        onMouseEnter={(e: any) => {
          isHoveredRef.current = true;
          restProps.onMouseEnter?.(e);
        }}
        onMouseLeave={(e: any) => {
          isHoveredRef.current = false;
          restProps.onMouseLeave?.(e);
        }}
        onFocus={(e: any) => {
          isFocusedRef.current = true;
          restProps.onFocus?.(e);
        }}
        onBlur={(e: any) => {
          isFocusedRef.current = false;
          restProps.onBlur?.(e);
        }}
        {...buttonTypeProps}
        {...restProps}
      >
        {/* Light Trail Canvas Border Overlay */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-[inherit] overflow-visible"
        />

        {/* Button Content Slot */}
        <span className="relative z-10 inline-flex items-center justify-center gap-2 w-full h-full font-inherit text-inherit">
          {children}
        </span>
      </Component>
    );
  }
);
