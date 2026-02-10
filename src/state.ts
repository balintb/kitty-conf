import { CATEGORIES, SETTINGS_MAP, type Setting } from "./schema";

const STORAGE_KEY = "kitty-conf-state";

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

loadFromStorage();

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
  return parts.join("&");
}

function decodeCompact(input: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of input.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const sid = parseInt(part.slice(0, eq), 10);
    const value = part.slice(eq + 1);
    const key = sidToKey.get(sid);
    if (typeof value === "string" && key && SETTINGS_MAP.has(key)) {
      const setting = SETTINGS_MAP.get(key)!;
      if (setting.type !== "file") {
        result.set(key, value);
      }
    }
  }
  return result;
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

let pendingUrlData: Map<string, string> | null = null;

export async function loadFromUrl(): Promise<"applied" | "conflict" | "none"> {
  const hash = location.hash.slice(1);
  if (!hash) return "none";
  const params = new URLSearchParams(hash);
  const configData = params.get("c");
  if (!configData) return "none";
  try {
    const compact = await decompress(configData);
    const urlData = decodeCompact(compact);
    if (urlData.size === 0) return "none";

    const hasLocalChanges = getChangedEntries().length > 0;
    if (!hasLocalChanges) {
      for (const [key, value] of urlData) values.set(key, value);
      saveToStorage();
      return "applied";
    }

    let differs = false;
    for (const [key, value] of urlData) {
      if (values.get(key) !== value) { differs = true; break; }
    }
    if (!differs) return "applied"; // URL matches localStorage already

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
  for (const [key, value] of pendingUrlData) {
    values.set(key, value);
  }
  pendingUrlData = null;
  saveToStorage();
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
  localStorage.removeItem(STORAGE_KEY);
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
