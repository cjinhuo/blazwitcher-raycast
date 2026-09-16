import type { Scope } from "../types";

export function parseQuery(input: string, selected: Scope, fixed?: Scope) {
  const match = input.trim().match(/^\/([tbh])(?:\s+|$)/i);
  const prefix = match
    ? ({ t: "tab", b: "bookmark", h: "history" } as const)[
        match[1].toLowerCase() as "t" | "b" | "h"
      ]
    : undefined;
  return {
    scope: fixed && fixed !== "all" ? fixed : (prefix ?? selected),
    text: (match ? input.trim().slice(match[0].length) : input).trim(),
  };
}
