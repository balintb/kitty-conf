import { CATEGORIES, SETTINGS_MAP, type Setting } from "./schema";
import type { Mapping } from "./mappings";

const STORAGE_KEY = "kitty-conf-state";
const MAPPINGS_STORAGE_KEY = "kitty-conf-mappings";

const values: Map<string, string> = new Map();

for (const [key, setting] of SETTINGS_MAP) {
  values.set(key, setting.default);
}

type Listener = () => void;
const listeners: Listener[] = [];

function valuesEqual(setting: Setting, a: string, b: string): boolean {
  if (setting.type === "float" || setting.type === "int") {
    return Number(a) === Number(b);
  }
  return a === b;
}

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved: Record<string, string> = JSON.parse(raw);
    for (const [key, value] of Object.entries(saved)) {
      if (SETTINGS_MAP.has(key)) values.set(key, value);
    }
  } catch {}
}

function saveToStorage(): void {
  const changed: Record<string, string> = {};
  for (const [key, setting] of SETTINGS_MAP) {
    const value = values.get(key);
    if (value !== undefined && !valuesEqual(setting, value, setting.default)) {
      changed[key] = value;
    }
  }
  if (Object.keys(changed).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
  }
}

const mappings: Mapping[] = [];

export function getMappings(): readonly Mapping[] {
  return mappings;
}

export function addMapping(m: Mapping): void {
  mappings.push(m);
  saveMappingsToStorage();
  notify();
}

export function updateMapping(
  id: string,
  patch: Partial<Omit<Mapping, "id">>,
): void {
  const m = mappings.find((m) => m.id === id);
  if (!m) return;
  Object.assign(m, patch);
  saveMappingsToStorage();
  notify();
}

export function removeMapping(id: string): void {
  const idx = mappings.findIndex((m) => m.id === id);
  if (idx !== -1) {
    mappings.splice(idx, 1);
    saveMappingsToStorage();
    notify();
  }
}

export function setMappingsBatch(
  items: Omit<Mapping, "id">[],
): void {
  mappings.length = 0;
  for (const item of items) {
    mappings.push({ ...item, id: crypto.randomUUID() });
  }
  saveMappingsToStorage();
  notify();
}

function saveMappingsToStorage(): void {
  if (mappings.length === 0) {
    localStorage.removeItem(MAPPINGS_STORAGE_KEY);
  } else {
    const data = mappings.map(({ keys, action, args }) => ({
      keys,
      action,
      args,
    }));
    localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(data));
  }
}

function loadMappingsFromStorage(): void {
  try {
    const raw = localStorage.getItem(MAPPINGS_STORAGE_KEY);
    if (!raw) return;
    const saved: { keys: string; action: string; args: string }[] =
      JSON.parse(raw);
    for (const item of saved) {
      mappings.push({ ...item, id: crypto.randomUUID() });
    }
  } catch {}
}

loadFromStorage();
loadMappingsFromStorage();

const sidToKey = new Map<number, string>();
for (const category of CATEGORIES) {
  for (const setting of category.settings) {
    sidToKey.set(setting.sid, setting.key);
  }
}

function encodeCompact(): string {
  const parts: string[] = [];
  for (const [key, value] of getChangedEntries()) {
    const setting = SETTINGS_MAP.get(key);
    if (setting && setting.type !== "file") {
      parts.push(`${setting.sid}=${value}`);
    }
  }
  let result = parts.join("&");
  if (mappings.length > 0) {
    const m = mappings.map(({ keys, action, args }) => [keys, action, args]);
    result += "|" + JSON.stringify(m);
  }
  return result;
}

interface DecodedData {
  settings: Map<string, string>;
  mappings: { keys: string; action: string; args: string }[];
}

function decodeCompact(input: string): DecodedData {
  const pipeIdx = input.indexOf("|");
  const settingsPart = pipeIdx === -1 ? input : input.slice(0, pipeIdx);

  const settings = new Map<string, string>();
  if (settingsPart) {
    for (const part of settingsPart.split("&")) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      const sid = parseInt(part.slice(0, eq), 10);
      const value = part.slice(eq + 1);
      const key = sidToKey.get(sid);
      if (typeof value === "string" && key && SETTINGS_MAP.has(key)) {
        const setting = SETTINGS_MAP.get(key)!;
        if (setting.type !== "file") {
          settings.set(key, value);
        }
      }
    }
  }

  let parsedMappings: { keys: string; action: string; args: string }[] = [];
  if (pipeIdx !== -1) {
    try {
      const arr = JSON.parse(input.slice(pipeIdx + 1));
      parsedMappings = arr.map((m: string[]) => ({
        keys: m[0],
        action: m[1],
        args: m[2] || "",
      }));
    } catch {}
  }

  return { settings, mappings: parsedMappings };
}

async function compress(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  let b64 = btoa(String.fromCharCode(...compressed));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function decompress(encoded: string): Promise<string> {
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

let pendingUrlData: DecodedData | null = null;

export async function loadFromUrl(): Promise<"applied" | "conflict" | "none"> {
  const hash = location.hash.slice(1);
  if (!hash) return "none";
  const params = new URLSearchParams(hash);
  const configData = params.get("c");
  if (!configData) return "none";
  try {
    const compact = await decompress(configData);
    const urlData = decodeCompact(compact);
    if (urlData.settings.size === 0 && urlData.mappings.length === 0)
      return "none";

    const hasLocalChanges =
      getChangedEntries().length > 0 || mappings.length > 0;
    if (!hasLocalChanges) {
      for (const [key, value] of urlData.settings) values.set(key, value);
      if (urlData.mappings.length > 0) {
        mappings.length = 0;
        for (const item of urlData.mappings) {
          mappings.push({ ...item, id: crypto.randomUUID() });
        }
        saveMappingsToStorage();
      }
      saveToStorage();
      return "applied";
    }

    let differs = false;
    for (const [key, value] of urlData.settings) {
      if (values.get(key) !== value) {
        differs = true;
        break;
      }
    }
    if (!differs && urlData.mappings.length !== mappings.length) differs = true;
    if (!differs) {
      for (let i = 0; i < urlData.mappings.length; i++) {
        const a = urlData.mappings[i];
        const b = mappings[i];
        if (a.keys !== b.keys || a.action !== b.action || a.args !== b.args) {
          differs = true;
          break;
        }
      }
    }
    if (!differs) return "applied";

    pendingUrlData = urlData;
    return "conflict";
  } catch {
    return "none";
  }
}

export function applyPendingUrl(): void {
  if (!pendingUrlData) return;
  for (const [key, setting] of SETTINGS_MAP) {
    values.set(key, setting.default);
  }
  for (const [key, value] of pendingUrlData.settings) {
    values.set(key, value);
  }
  mappings.length = 0;
  for (const item of pendingUrlData.mappings) {
    mappings.push({ ...item, id: crypto.randomUUID() });
  }
  pendingUrlData = null;
  saveToStorage();
  saveMappingsToStorage();
  notify();
}

export function dismissPendingUrl(): void {
  pendingUrlData = null;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

export async function buildShareUrl(): Promise<string> {
  const base = location.href.split("#")[0];
  const compact = encodeCompact();
  if (!compact) return base;
  const encoded = await compress(compact);
  return `${base}#c=${encoded}`;
}

export function getValue(key: string): string {
  return values.get(key) ?? "";
}

export function setValue(key: string, value: string): void {
  if (values.get(key) === value) return;
  values.set(key, value);
  saveToStorage();
  notify();
}

export function resetAll(): void {
  for (const [key, setting] of SETTINGS_MAP) {
    values.set(key, setting.default);
  }
  mappings.length = 0;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(MAPPINGS_STORAGE_KEY);
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  notify();
}

const fileNames: Map<string, string> = new Map();

export function setFileName(key: string, name: string): void {
  fileNames.set(key, name);
}

export function getFileName(key: string): string {
  return fileNames.get(key) ?? "";
}

export function subscribe(fn: Listener): void {
  listeners.push(fn);
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function getChangedEntries(): [string, string][] {
  const changed: [string, string][] = [];
  for (const category of CATEGORIES) {
    for (const setting of category.settings) {
      const value = values.get(setting.key);
      if (value !== undefined && !valuesEqual(setting, value, setting.default)) {
        changed.push([setting.key, value]);
      }
    }
  }
  return changed;
}
