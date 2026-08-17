import type { Direction } from "@rtl-resolver/core";

export type LogicalEdge = "start" | "end";
export function logicalSign(edge: LogicalEdge, direction: Direction): 1 | -1 {
  const startIsPositive = direction === "ltr";
  return edge === "start" ? (startIsPositive ? 1 : -1) : (startIsPositive ? -1 : 1);
}
export function logicalTranslateX(edge: LogicalEdge, distance: number, direction: Direction): string {
  return `translateX(${logicalSign(edge, direction) * distance}px)`;
}
export function logicalSlideIn(edge: LogicalEdge, direction: Direction, distance = 100) {
  return { from: logicalTranslateX(edge, distance, direction), to: "translateX(0)" };
}
export function logicalSlideOut(edge: LogicalEdge, direction: Direction, distance = 100) {
  return { from: "translateX(0)", to: logicalTranslateX(edge, distance, direction) };
}

export function logicalTransition(edge: LogicalEdge, direction: Direction, options: {
  durationMs?: number;
  reducedMotion?: boolean;
} = {}): { transform: string; transition: string } {
  const duration = Math.max(0, options.durationMs ?? 180);
  return {
    transform: options.reducedMotion ? "none" : logicalTranslateX(edge, 0, direction),
    transition: options.reducedMotion ? "none" : `transform ${duration}ms ease-out`,
  };
}

export interface LogicalAnimationOptions {
  durationMs?: number;
  reducedMotion?: boolean;
  easing?: string;
}

/** Build direction-aware keyframes for drawers/carousels without a runtime dependency. */
export function logicalKeyframes(
  edge: LogicalEdge,
  direction: Direction,
  distance = 100,
  options: LogicalAnimationOptions = {},
): { keyframes: readonly [{ transform: string }, { transform: string }]; options: { duration: number; easing: string } } {
  const duration = Math.max(0, options.durationMs ?? 180);
  const easing = options.easing ?? "ease-out";
  const from = options.reducedMotion ? "none" : logicalTranslateX(edge, distance, direction);
  return { keyframes: [{ transform: from }, { transform: "translateX(0)" }], options: { duration, easing } };
}

export function logicalFade(options: LogicalAnimationOptions = {}): { from: { opacity: number }; to: { opacity: number }; duration: number } {
  const duration = Math.max(0, options.durationMs ?? 180);
  return { from: { opacity: options.reducedMotion ? 1 : 0 }, to: { opacity: 1 }, duration };
}

export function isDirectionNeutralAnimation(kind: "fade" | "opacity" | "scale" | "spinner" | "slide"): boolean {
  return kind !== "slide";
}

/** Framer Motion-compatible slide variants without importing framer-motion. */
export function framerSlide(edge: LogicalEdge, direction: Direction, distance = 24) {
  const x = logicalSign(edge, direction) * distance;
  return {
    initial: { x },
    animate: { x: 0 },
    exit: { x },
  };
}

/** Direction-neutral Framer Motion fade variants. */
export function framerFade(options: LogicalAnimationOptions = {}) {
  const opacity = options.reducedMotion ? 1 : 0;
  return {
    initial: { opacity },
    animate: { opacity: 1 },
    exit: { opacity },
    transition: { duration: Math.max(0, options.durationMs ?? 180) / 1000 },
  };
}
