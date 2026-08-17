import { resolveDirection, type Direction } from "@rtl-resolver/core";

export type LogicalPlacement = "start" | "end" | "top" | "bottom";
export type PhysicalPlacement = "left" | "right" | "top" | "bottom";

export function physicalPlacement(placement: LogicalPlacement, direction: Direction): PhysicalPlacement {
  if (placement === "start") return direction === "rtl" ? "right" : "left";
  if (placement === "end") return direction === "rtl" ? "left" : "right";
  return placement;
}

export function logicalPlacement(placement: PhysicalPlacement, direction: Direction): LogicalPlacement {
  if (placement === "left") return direction === "rtl" ? "end" : "start";
  if (placement === "right") return direction === "rtl" ? "start" : "end";
  return placement;
}

export function resolveOverlayPlacement(preferred: LogicalPlacement, direction: Direction, available: readonly PhysicalPlacement[]): PhysicalPlacement {
  const desired = physicalPlacement(preferred, direction);
  if (available.includes(desired)) return desired;
  const fallback = preferred === "start" ? "end" : preferred === "end" ? "start" : preferred;
  return physicalPlacement(fallback, direction);
}

/** Resolve text input direction independently from the surrounding UI. */
export function resolveInputDirection(uiDirection: Direction, value = ""): Direction {
  return value ? resolveDirection({ direction: "auto", text: value, fallback: uiDirection }) : uiDirection;
}

/** Keep semantic/DOM column order stable while exposing a visual RTL order. */
export function visualColumnOrder<T>(columns: readonly T[], direction: Direction): T[] {
  return direction === "rtl" ? [...columns].reverse() : [...columns];
}

/** Return the original order for accessible DOM/table navigation. */
export function semanticColumnOrder<T>(columns: readonly T[]): T[] {
  return [...columns];
}

export type InputKind = "text" | "search" | "email" | "url" | "tel" | "number" | "date" | "time";

export interface FormDirectionResult {
  direction: Direction;
  dirAttribute: Direction;
  inputMode: "text" | "numeric";
  reason: "content" | "ui";
}

/** Resolve a form field while keeping the surrounding UI direction intact. */
export function resolveFormDirection(
  uiDirection: Direction,
  value = "",
  kind: InputKind = "text",
): FormDirectionResult {
  const direction = kind === "number" || kind === "date" || kind === "time"
    ? uiDirection
    : resolveInputDirection(uiDirection, value);
  return {
    direction,
    dirAttribute: direction,
    inputMode: kind === "number" ? "numeric" : "text",
    reason: direction === uiDirection && !value ? "ui" : "content",
  };
}

export interface TableDirectionModel {
  direction: Direction;
  domOrder: readonly number[];
  visualOrder: readonly number[];
  ariaSort: "ascending" | "descending" | undefined;
}

/** Keep table DOM order stable while deriving a visual column order. */
export function tableDirectionModel(
  columnCount: number,
  direction: Direction,
  sort?: "ascending" | "descending",
): TableDirectionModel {
  const domOrder = Array.from({ length: Math.max(0, columnCount) }, (_, index) => index);
  return { direction, domOrder, visualOrder: visualColumnOrder(domOrder, direction), ariaSort: sort };
}

export function stickyColumnModel(
  columnCount: number,
  stickyStart = 0,
  stickyEnd = 0,
  direction: Direction = "ltr",
): { domOrder: readonly number[]; stickyStart: readonly number[]; stickyEnd: readonly number[]; reverseDom: false } {
  const model = tableDirectionModel(columnCount, direction);
  return {
    domOrder: model.domOrder,
    stickyStart: model.domOrder.slice(0, Math.max(0, stickyStart)),
    stickyEnd: model.domOrder.slice(Math.max(0, columnCount - stickyEnd)),
    reverseDom: false,
  };
}

export function shouldReverseDomOrder(): { reverse: false; reason: string } {
  return { reverse: false, reason: "Keep DOM/accessibility order stable; mirror with CSS and visual-order helpers." };
}

export function mixedAccessibleName(parts: readonly { text: string; lang?: string }[]): {
  isolate: boolean;
  parts: readonly { text: string; lang?: string; isolate: boolean }[];
} {
  const languages = new Set(parts.map((part) => part.lang).filter(Boolean));
  return {
    isolate: languages.size > 1,
    parts: parts.map((part) => ({ ...part, isolate: Boolean(part.lang) && languages.size > 1 })),
  };
}

export function formControlAttributes(
  uiDirection: Direction,
  value = "",
  kind: InputKind = "text",
): { dir: Direction; inputMode: "text" | "numeric"; autoComplete?: string } {
  const resolved = resolveFormDirection(uiDirection, value, kind);
  const autoComplete = kind === "email" ? "email" : kind === "tel" ? "tel" : kind === "url" ? "url" : undefined;
  return { dir: resolved.dirAttribute, inputMode: resolved.inputMode, autoComplete };
}

export const SEARCH_FIXTURES = {
  arabicQuery: "مرحبا",
  hebrewQuery: "שלום",
  persianQuery: "سلام",
  urduQuery: "سلام",
  mixedResults: [
    { title: "John Smith", snippet: "https://example.com", lang: "en" },
    { title: "محمد علي", snippet: "مستخدم@مثال.عربي", lang: "ar" },
  ],
} as const;

export const EDITOR_FIXTURES = {
  arabicParagraph: "هذا نص عربي مع English في الوسط.",
  hebrewParagraph: "זה עברית עם URL https://example.com בפנים.",
  list: ["أولاً", "ثانياً", "ثالثاً"],
  quote: "قال: مرحبا بالعالم",
} as const;

/** Focus order follows DOM order even when the visual layout is RTL. */
export function focusSequence<T>(items: readonly T[], _direction?: Direction): T[] {
  return [...items];
}

/** Roving tabindex values for a DOM-stable widget. */
export function tabIndexList(activeIndex: number, length: number): readonly number[] {
  return Array.from({ length: Math.max(0, length) }, (_, index) => (index === activeIndex ? 0 : -1));
}

export function focusTrapModel(open: boolean): { trap: boolean; restoreFocus: true; reverseDom: false } {
  return { trap: open, restoreFocus: true, reverseDom: false };
}

export const LANDMARK_ORDER = ["banner", "navigation", "main", "complementary", "contentinfo"] as const;

export function stickyColumnStyle(
  side: "start" | "end",
  offsetPx = 0,
): { position: "sticky"; insetInlineStart?: string; insetInlineEnd?: string; zIndex: number } {
  return side === "start"
    ? { position: "sticky", insetInlineStart: `${Math.max(0, offsetPx)}px`, zIndex: 1 }
    : { position: "sticky", insetInlineEnd: `${Math.max(0, offsetPx)}px`, zIndex: 1 };
}

export function accessibleTableModel(columns: readonly string[], direction: Direction) {
  return {
    headers: [...columns],
    visualHeaders: visualColumnOrder(columns, direction),
    scope: "col" as const,
    reverseDom: false as const,
  };
}

export function overlayPlacementOrder(
  preferred: LogicalPlacement,
  direction: Direction,
): PhysicalPlacement[] {
  const first = physicalPlacement(preferred, direction);
  const oppositeLogical = preferred === "start" ? "end" : preferred === "end" ? "start" : preferred === "top" ? "bottom" : "top";
  const opposite = physicalPlacement(oppositeLogical, direction);
  const candidates: PhysicalPlacement[] = ["top", "bottom", "left", "right"];
  const rest = candidates.filter((placement) => placement !== first && placement !== opposite);
  const order: PhysicalPlacement[] = [first, opposite];
  for (const placement of rest) {
    if (!order.includes(placement)) order.push(placement);
  }
  return order;
}

export function sliderKeys(direction: Direction): {
  decrease: "ArrowLeft" | "ArrowRight";
  increase: "ArrowLeft" | "ArrowRight";
} {
  return direction === "rtl"
    ? { decrease: "ArrowRight", increase: "ArrowLeft" }
    : { decrease: "ArrowLeft", increase: "ArrowRight" };
}

export const FOCUS_FIXTURES = {
  dialog: { role: "dialog", ariaModal: true, reverseDom: false },
  menu: { role: "menu", orientation: "vertical" as const, reverseDom: false },
} as const;

export {
  floatingUiPlacement,
  headlessUiDirectionProps,
  muiDialogProps,
  muiEmotionCacheOptions,
  muiThemeOptions,
  radixDirectionProps,
} from "./libraries.js";
