import { SETTINGS_MAP } from "./schema";
import { setValue } from "./state";

export function parseConfig(text: string): number {
  let applied = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) continue;
    const key = trimmed.slice(0, spaceIdx);
    const value = trimmed.slice(spaceIdx + 1).trim();
    if (SETTINGS_MAP.has(key)) {
      setValue(key, value);
      applied++;
    }
  }
  return applied;
}
