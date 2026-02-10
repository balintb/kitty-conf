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
