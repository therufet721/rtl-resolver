import type { Direction } from "@rtl-resolver/core";

type LogicalPlacement = "start" | "end" | "top" | "bottom";
type PhysicalPlacement = "left" | "right" | "top" | "bottom";

function physical(placement: LogicalPlacement, direction: Direction): PhysicalPlacement {
  if (placement === "start") return direction === "rtl" ? "right" : "left";
  if (placement === "end") return direction === "rtl" ? "left" : "right";
  return placement;
}

/** Map toolkit direction onto MUI `createTheme({ direction })`. */
export function muiThemeOptions(direction: Direction): { direction: Direction } {
  return { direction };
}

/** Props for MUI emotion cache / stylis RTL plugin enablement. Does not load stylis. */
export function muiEmotionCacheOptions(direction: Direction): { key: string; stylisPlugins: readonly string[] } {
  return {
    key: direction === "rtl" ? "muirtl" : "muiltr",
    stylisPlugins: direction === "rtl" ? ["stylis-plugin-rtl"] : [],
  };
}

export function radixDirectionProps(direction: Direction): { dir: Direction } {
  return { dir: direction };
}

export function headlessUiDirectionProps(direction: Direction): { dir: Direction } {
  return { dir: direction };
}

export function floatingUiPlacement(preferred: LogicalPlacement, direction: Direction): PhysicalPlacement {
  return physical(preferred, direction);
}

export function muiDialogProps(direction: Direction): { dir: Direction; PaperProps: { dir: Direction } } {
  return { dir: direction, PaperProps: { dir: direction } };
}
