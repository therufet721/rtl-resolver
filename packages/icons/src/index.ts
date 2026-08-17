import type { Direction } from "@rtl-resolver/core";

export type IconDirectionPolicy = "mirrors" | "rotates" | "neverMirrors";
export interface IconMetadata { name: string; directional: boolean; policy?: IconDirectionPolicy; }
export const DEFAULT_ICON_METADATA: Record<string, IconMetadata> = {
  "arrow-forward": { name: "arrow-forward", directional: true, policy: "mirrors" },
  "arrow-back": { name: "arrow-back", directional: true, policy: "mirrors" },
  "chevron-start": { name: "chevron-start", directional: true, policy: "mirrors" },
  "chevron-end": { name: "chevron-end", directional: true, policy: "mirrors" },
  undo: { name: "undo", directional: true, policy: "mirrors" },
  redo: { name: "redo", directional: true, policy: "mirrors" },
  refresh: { name: "refresh", directional: false, policy: "neverMirrors" },
  check: { name: "check", directional: false, policy: "neverMirrors" },
  reply: { name: "reply", directional: false, policy: "neverMirrors" },
  send: { name: "send", directional: false, policy: "neverMirrors" },
  logo: { name: "logo", directional: false, policy: "neverMirrors" },
  clock: { name: "clock", directional: false, policy: "neverMirrors" },
};

export function iconPolicy(icon: IconMetadata | string, metadata = DEFAULT_ICON_METADATA): IconDirectionPolicy | undefined {
  return (typeof icon === "string" ? metadata[icon] : icon)?.policy;
}

/** Return true when an icon needs an explicit policy before it can be mirrored. */
export function requiresIconPolicy(icon: IconMetadata | string, metadata = DEFAULT_ICON_METADATA): boolean {
  const value = typeof icon === "string" ? metadata[icon] : icon;
  return Boolean(value?.directional && !value.policy);
}

export function shouldMirrorIcon(icon: IconMetadata | string, direction: Direction, metadata = DEFAULT_ICON_METADATA): boolean {
  if (direction !== "rtl") return false;
  const value = typeof icon === "string" ? metadata[icon] : icon;
  return Boolean(value?.directional && value.policy === "mirrors");
}

export function iconTransform(icon: IconMetadata | string, direction: Direction, metadata = DEFAULT_ICON_METADATA): string {
  const value = typeof icon === "string" ? metadata[icon] : icon;
  if (direction !== "rtl" || !value?.directional) return "none";
  if (value.policy === "rotates") return "rotate(180deg)";
  return value.policy === "mirrors" ? "scaleX(-1)" : "none";
}

export function iconAttributes(icon: IconMetadata | string, direction: Direction, metadata = DEFAULT_ICON_METADATA): {
  style?: { transform: string; transformOrigin: "center" };
} {
  const transform = iconTransform(icon, direction, metadata);
  return transform === "none" ? {} : { style: { transform, transformOrigin: "center" } };
}
