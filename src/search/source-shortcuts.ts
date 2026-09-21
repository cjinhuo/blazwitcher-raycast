import type { Keyboard } from "@raycast/api";
import type { Scope } from "../types";

const keys = { all: "0", tab: "1", bookmark: "2", history: "3" } as const;

export function sourceShortcut(
  scope: Scope,
  preference = "cmd-shift",
): Keyboard.Shortcut | undefined {
  if (preference === "none") return undefined;
  return {
    modifiers: [preference === "ctrl-shift" ? "ctrl" : "cmd", "shift"],
    key: keys[scope],
  };
}
