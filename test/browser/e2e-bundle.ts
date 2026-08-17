import {
  attachPointerSwipe,
  getLogicalScrollPosition,
  getRtlScrollType,
  getViewportInlineSize,
  resetRtlScrollTypeCache,
  resolveArrowNavigation,
  setLogicalScrollPosition,
} from "../../packages/browser/src/index";
import {
  accessibleTableModel,
  focusSequence,
  formControlAttributes,
  physicalPlacement,
  shouldReverseDomOrder,
  stickyColumnStyle,
} from "../../packages/adapters/src/index";
import { iconAttributes } from "../../packages/icons/src/index";
import { directionFromLocale } from "../../packages/core/src/index";
import type { Direction } from "../../packages/core/src/index";

export {
  accessibleTableModel,
  attachPointerSwipe,
  directionFromLocale,
  focusSequence,
  formControlAttributes,
  getLogicalScrollPosition,
  getRtlScrollType,
  getViewportInlineSize,
  iconAttributes,
  physicalPlacement,
  resetRtlScrollTypeCache,
  resolveArrowNavigation,
  setLogicalScrollPosition,
  shouldReverseDomOrder,
  stickyColumnStyle,
};

export function bootFixture(): void {
  const app = document.getElementById("app");
  if (!app) return;
  const direction: Direction = app.getAttribute("dir") === "rtl" ? "rtl" : "ltr";
  const pad = document.getElementById("swipe-pad");
  const status = document.getElementById("swipe-status");
  if (pad && status) {
    (window as unknown as { __lastSwipe: string }).__lastSwipe = "none";
    attachPointerSwipe(pad as HTMLElement, {
      direction,
      threshold: 8,
      onSwipe(value) {
        (window as unknown as { __lastSwipe: string }).__lastSwipe = value;
        status.textContent = value;
      },
    });
  }
  const popover = document.getElementById("popover");
  if (popover) popover.dataset.side = physicalPlacement("start", direction);
  const icon = document.getElementById("forward-icon");
  if (icon) {
    const attributes = iconAttributes("arrow-forward", direction);
    icon.style.transform = attributes.style?.transform ?? "none";
  }
}
