import { SETTINGS_MAP } from "./schema";
import { setValue, setMappingsBatch } from "./state";

export function parseConfig(text: string): number {
  let applied = 0;
  const parsedMappings: { keys: string; action: string; args: string }[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("map ")) {
      const rest = trimmed.slice(4).trim();
      const parts = rest.split(/\s+/);
      if (parts.length >= 2) {
        const keys = parts[0];
        const action = parts[1];
        const args = parts.slice(2).join(" ");
        parsedMappings.push({ keys, action, args });
        applied++;
      }
      continue;
    }

    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) continue;
    const key = trimmed.slice(0, spaceIdx);
    const value = trimmed.slice(spaceIdx + 1).trim();
    if (SETTINGS_MAP.has(key)) {
      setValue(key, value);
      applied++;
    }
  }

  if (parsedMappings.length > 0) {
    setMappingsBatch(parsedMappings);
  }

  return applied;
}
