export type AssistiveTechnology = "voiceover" | "nvda";

/** Host screen reader implied by the current OS. */
export function hostAssistiveTechnology(): AssistiveTechnology | undefined {
  if (process.platform === "darwin") return "voiceover";
  if (process.platform === "win32") return "nvda";
  return undefined;
}

/**
 * Explicit AT request. `RTL_AT=voiceover|nvda` selects a reader.
 * `RTL_AT=1` selects the host reader. Linux has no NVDA/VoiceOver host.
 */
export function requestedAssistiveTechnology(): AssistiveTechnology | undefined {
  const value = (process.env.RTL_AT ?? "").trim().toLowerCase();
  if (value === "voiceover" || value === "nvda") return value;
  if (value === "1" || value === "true") return hostAssistiveTechnology();
  return undefined;
}

export function assistiveTechnologyReady(kind: AssistiveTechnology): { ready: boolean; reason: string } {
  if (kind === "voiceover" && process.platform !== "darwin") {
    return { ready: false, reason: "VoiceOver only runs on macOS." };
  }
  if (kind === "nvda" && process.platform !== "win32") {
    return { ready: false, reason: "NVDA only runs on Windows." };
  }
  if (requestedAssistiveTechnology() !== kind) {
    return { ready: false, reason: `Set RTL_AT=${kind} after installing the screen reader (npx @guidepup/setup).` };
  }
  return { ready: true, reason: `${kind} is requested on a compatible host.` };
}
