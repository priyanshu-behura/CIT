import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface FadeContentProps {
  children: React.ReactNode;
  className?: string;
  effect?: 'focus' | 'fade' | 'slide-up' | 'none';
  blur?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  stagger?: number;
  staggerFrom?: 'start' | 'center' | 'end' | 'edges' | 'random';
  trigger?: 'scroll' | 'load';
  once?: boolean;
  exit?: boolean;
  scrub?: boolean | number;
  animateChildren?: boolean;
  as?: React.ElementType;
  style?: React.CSSProperties;
}

export const FadeContent = React.forwardRef<HTMLElement, FadeContentProps>(function FadeContent(
  {
    children,
    className = '',
    effect = 'focus',
    blur = 6,
    duration = 0.9,
    ease = 'power2.out',
    delay = 0,
    threshold = 0.15,
    initialOpacity = 0,
    stagger = 0.12,
    staggerFrom = 'start',
    trigger = 'scroll',
    once = true,
    exit = false,
    scrub = false,
    animateChildren,
    as: Component = 'div',
    style,
  },
  ref
) {
  const containerRef = useRef<HTMLElement | null>(null);

  useImperativeHandle(ref, () => containerRef.current as HTMLElement);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || effect === 'none') {
      gsap.set(container, { opacity: 1, filter: 'none', y: 0, clearProps: 'all' });
      return;
    }

    // Use gsap.context for bulletproof React 19 StrictMode cleanup and zero memory leaks
    const ctx = gsap.context(() => {
      const childElements = Array.from(container.children) as HTMLElement[];
      const shouldStaggerChildren = animateChildren ?? (childElements.length > 1 && stagger > 0);
      const targets = shouldStaggerChildren ? childElements : container;

      const fromVars: gsap.TweenVars = {
        opacity: initialOpacity,
        duration,
        ease,
        delay,
      };

      const toVars: gsap.TweenVars = {
        opacity: 1,
        duration,
        ease,
        delay,
        clearProps: 'filter,transform', // Clean up GPU rasterization properties after animation settles
      };

      if (effect === 'focus') {
        fromVars.filter = `blur(${blur}px)`;
        fromVars.y = 12;
        toVars.filter = 'blur(0px)';
        toVars.y = 0;
      } else if (effect === 'slide-up') {
        fromVars.y = 20;
        toVars.y = 0;
      }

      if (shouldStaggerChildren && stagger > 0) {
        toVars.stagger = {
          each: stagger,
          from: staggerFrom,
        };
      }

      if (trigger === 'scroll') {
        const startPercent = Math.max(10, Math.min(95, Math.round((1 - threshold) * 100)));
        toVars.scrollTrigger = {
          trigger: container,
          start: `top ${startPercent}%`,
          once,
          scrub,
          toggleActions: once
            ? 'play none none none'
            : exit
            ? 'play reverse play reverse'
            : 'play none none none',
        };
      }

      gsap.fromTo(targets, fromVars, toVars);
    }, containerRef);

    return () => ctx.revert();
  }, [
    effect,
    blur,
    duration,
    ease,
    delay,
    threshold,
    initialOpacity,
    stagger,
    staggerFrom,
    trigger,
    once,
    exit,
    scrub,
    animateChildren,
  ]);

  return (
    <Component ref={containerRef} className={className} style={style}>
      {children}
    </Component>
  );
});
