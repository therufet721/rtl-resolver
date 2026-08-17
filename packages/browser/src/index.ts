import type { Direction } from "@rtl-resolver/core";

export type RtlScrollType = "negative" | "default" | "reverse";

let cachedRtlScrollType: RtlScrollType | undefined;

export function getRtlScrollType(): RtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === "undefined") return "default";
  const outer = document.createElement("div");
  const inner = document.createElement("div");
  outer.dir = "rtl";
  outer.style.cssText = "width:4px; overflow:scroll; position:absolute; top:-9999px;";
  inner.style.width = "8px";
  outer.appendChild(inner);
  document.body.appendChild(outer);
  const initial = outer.scrollLeft;
  outer.scrollLeft = 1;
  const type: RtlScrollType = outer.scrollLeft === 0 ? "negative" : initial > 0 ? "reverse" : "default";
  outer.remove();
  cachedRtlScrollType = type;
  return cachedRtlScrollType;
}

/** Clear the cached probe result after a test environment or browser mode changes. */
export function resetRtlScrollTypeCache(): void { cachedRtlScrollType = undefined; }

export function getLogicalScrollPosition(element: HTMLElement, direction: Direction = "ltr"): number {
  if (direction === "ltr") return element.scrollLeft;
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const type = getRtlScrollType();
  if (type === "negative") return Math.max(0, -element.scrollLeft);
  if (type === "reverse") return Math.max(0, max - element.scrollLeft);
  return Math.max(0, element.scrollLeft);
}

export function setLogicalScrollPosition(element: HTMLElement, position: number, direction: Direction = "ltr"): void {
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const value = Math.max(0, Math.min(max, position));
  if (direction === "ltr") { element.scrollLeft = value; return; }
  const type = getRtlScrollType();
  element.scrollLeft = type === "negative" ? -value : type === "reverse" ? max - value : value;
}

export function scrollToLogicalStart(element: HTMLElement, direction: Direction = "ltr", behavior: ScrollBehavior = "auto") {
  setLogicalScrollPosition(element, direction === "rtl" ? element.scrollWidth - element.clientWidth : 0, direction);
  if (behavior !== "auto") element.scrollTo({ left: element.scrollLeft, behavior });
}

export function scrollToLogicalEnd(element: HTMLElement, direction: Direction = "ltr", behavior: ScrollBehavior = "auto") {
  setLogicalScrollPosition(element, direction === "rtl" ? 0 : element.scrollWidth - element.clientWidth, direction);
  if (behavior !== "auto") element.scrollTo({ left: element.scrollLeft, behavior });
}

export function getLogicalArrowKey(key: "ArrowLeft" | "ArrowRight", direction: Direction): "previous" | "next" {
  const nextKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  return key === nextKey ? "next" : "previous";
}

export type NavigationAction = "previous" | "next" | "up" | "down" | "none";

/** Normalize arrow-key semantics for horizontal controls and vertical grids. */
export function getLogicalNavigationAction(
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  direction: Direction,
  axis: "horizontal" | "vertical" = "horizontal",
): NavigationAction {
  if (axis === "vertical") return key === "ArrowUp" ? "up" : key === "ArrowDown" ? "down" : "none";
  if (key === "ArrowLeft" || key === "ArrowRight") return getLogicalArrowKey(key, direction);
  return "none";
}

export function logicalDeltaX(deltaX: number, direction: Direction): number {
  return direction === "rtl" ? -deltaX : deltaX;
}

export function getLogicalSwipeDirection(deltaX: number, direction: Direction): "previous" | "next" | "none" {
  if (deltaX === 0) return "none";
  return logicalDeltaX(deltaX, direction) < 0 ? "previous" : "next";
}

export function normalizePointerDelta(startX: number, endX: number, direction: Direction): number {
  return logicalDeltaX(endX - startX, direction);
}

export interface SwipeRecognizerOptions {
  direction: Direction;
  threshold?: number;
  onSwipe: (direction: "previous" | "next") => void;
}

export interface SwipeRecognizer {
  start(clientX: number): void;
  end(clientX: number): "previous" | "next" | "none";
}

/** Create a framework-neutral horizontal swipe recognizer. */
export function createSwipeRecognizer(options: SwipeRecognizerOptions): SwipeRecognizer {
  const threshold = Math.max(1, options.threshold ?? 24);
  let startX: number | undefined;
  return {
    start(clientX) { startX = clientX; },
    end(clientX) {
      if (startX === undefined) return "none";
      const distance = clientX - startX;
      startX = undefined;
      if (Math.abs(distance) < threshold) return "none";
      const result = getLogicalSwipeDirection(distance, options.direction);
      if (result !== "none") options.onSwipe(result);
      return result;
    },
  };
}

/** Return the next logical scroll position by one viewport. */
export function nextLogicalPage(element: HTMLElement, direction: Direction = "ltr"): number {
  const current = getLogicalScrollPosition(element, direction);
  const page = Math.max(1, element.clientWidth);
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const next = Math.min(max, current + page);
  setLogicalScrollPosition(element, next, direction);
  return next;
}

/** Return the previous logical scroll position by one viewport. */
export function previousLogicalPage(element: HTMLElement, direction: Direction = "ltr"): number {
  const current = getLogicalScrollPosition(element, direction);
  const page = Math.max(1, element.clientWidth);
  const previous = Math.max(0, current - page);
  setLogicalScrollPosition(element, previous, direction);
  return previous;
}

/** Move by a logical inline delta and return the resulting logical position. */
export function scrollByLogical(element: HTMLElement, delta: number, direction: Direction = "ltr"): number {
  const current = getLogicalScrollPosition(element, direction);
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const next = Math.max(0, Math.min(max, current + delta));
  setLogicalScrollPosition(element, next, direction);
  return next;
}

export function getNextDirection(direction: Direction): "left" | "right" {
  return direction === "rtl" ? "left" : "right";
}

export function getPreviousDirection(direction: Direction): "left" | "right" {
  return direction === "rtl" ? "right" : "left";
}

export function getLogicalPageDelta(direction: Direction, pageSize: number): number {
  return pageSize;
}

export type NavigationMode = "logical" | "physical";

/** Physical arrows ignore reading direction; logical arrows follow it. */
export function resolveArrowNavigation(
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  direction: Direction,
  mode: NavigationMode = "logical",
  axis: "horizontal" | "vertical" = "horizontal",
): NavigationAction {
  if (mode === "physical") {
    if (key === "ArrowLeft") return "previous";
    if (key === "ArrowRight") return "next";
    if (key === "ArrowUp") return "up";
    return key === "ArrowDown" ? "down" : "none";
  }
  return getLogicalNavigationAction(key, direction, axis);
}

export function isNextSwipe(deltaX: number, direction: Direction): boolean {
  return getLogicalSwipeDirection(deltaX, direction) === "next";
}

export function isPreviousSwipe(deltaX: number, direction: Direction): boolean {
  return getLogicalSwipeDirection(deltaX, direction) === "previous";
}

export function getLogicalSwipeDirectionFromPointer(
  event: { deltaX: number } | { movementX: number },
  direction: Direction,
): "previous" | "next" | "none" {
  const deltaX = "deltaX" in event ? event.deltaX : event.movementX;
  return getLogicalSwipeDirection(deltaX, direction);
}

export function nextRovingIndex(current: number, length: number, action: NavigationAction, wrap = true): number {
  if (length <= 0) return 0;
  const delta = action === "next" || action === "down" ? 1 : action === "previous" || action === "up" ? -1 : 0;
  if (!delta) return current;
  const next = current + delta;
  if (wrap) return (next + length) % length;
  return Math.max(0, Math.min(length - 1, next));
}

export function attachPointerSwipe(element: HTMLElement, options: SwipeRecognizerOptions): { destroy(): void } {
  const recognizer = createSwipeRecognizer(options);
  const down = (event: PointerEvent) => recognizer.start(event.clientX);
  const up = (event: PointerEvent) => recognizer.end(event.clientX);
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", up);
  return {
    destroy() {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
    },
  };
}

export function getViewportInlineSize(root: { clientWidth: number } = typeof document === "undefined" ? { clientWidth: 0 } : document.documentElement): number {
  return Math.max(0, root.clientWidth);
}

export function logicalPagingState(index: number, count: number): {
  atStart: boolean;
  atEnd: boolean;
  previousIndex: number | null;
  nextIndex: number | null;
} {
  const safeCount = Math.max(0, count);
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, safeCount - 1));
  return {
    atStart: safeIndex <= 0,
    atEnd: safeCount === 0 || safeIndex >= safeCount - 1,
    previousIndex: safeIndex > 0 ? safeIndex - 1 : null,
    nextIndex: safeIndex + 1 < safeCount ? safeIndex + 1 : null,
  };
}
