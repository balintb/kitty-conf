import { CATEGORIES, SETTINGS_MAP, type Setting } from "./schema";

const values: Map<string, string> = new Map();

for (const [key, setting] of SETTINGS_MAP) {
  values.set(key, setting.default);
}

type Listener = () => void;
const listeners: Listener[] = [];

export function getValue(key: string): string {
  return values.get(key) ?? "";
}

export function setValue(key: string, value: string): void {
  if (values.get(key) === value) return;
  values.set(key, value);
  notify();
}

export function resetAll(): void {
  for (const [key, setting] of SETTINGS_MAP) {
    values.set(key, setting.default);
  }
  notify();
}

export function subscribe(fn: Listener): void {
  listeners.push(fn);
}

function notify(): void {
  for (const fn of listeners) fn();
}

function valuesEqual(setting: Setting, a: string, b: string): boolean {
  if (setting.type === "float" || setting.type === "int") {
    return Number(a) === Number(b);
  }
  return a === b;
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
