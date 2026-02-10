export interface Mapping {
  id: string;
  keys: string;
  action: string;
  args: string;
}

export interface ActionDef {
  aid: number;
  value: string;
  label: string;
  hint?: string;
}

export interface ActionGroup {
  label: string;
  actions: ActionDef[];
}

export const ACTION_GROUPS: ActionGroup[] = [
  {
    label: "Clipboard",
    actions: [
      { aid: 1, value: "copy_to_clipboard", label: "Copy to clipboard" },
      { aid: 2, value: "copy_or_interrupt", label: "Copy or interrupt" },
      { aid: 3, value: "paste_from_clipboard", label: "Paste from clipboard" },
      { aid: 4, value: "paste_from_selection", label: "Paste from selection" },
      {
        aid: 5,
        value: "copy_and_clear_or_interrupt",
        label: "Copy+clear or interrupt",
      },
    ],
  },
  {
    label: "Scrolling",
    actions: [
      { aid: 6, value: "scroll_line_up", label: "Scroll line up" },
      { aid: 7, value: "scroll_line_down", label: "Scroll line down" },
      { aid: 8, value: "scroll_page_up", label: "Scroll page up" },
      { aid: 9, value: "scroll_page_down", label: "Scroll page down" },
      { aid: 10, value: "scroll_home", label: "Scroll home" },
      { aid: 11, value: "scroll_end", label: "Scroll end" },
      { aid: 12, value: "show_scrollback", label: "Show scrollback" },
    ],
  },
  {
    label: "Window",
    actions: [
      { aid: 13, value: "new_window", label: "New window" },
      { aid: 14, value: "close_window", label: "Close window" },
      { aid: 15, value: "next_window", label: "Next window" },
      { aid: 16, value: "previous_window", label: "Previous window" },
      { aid: 17, value: "move_window_forward", label: "Move window forward" },
      { aid: 18, value: "move_window_backward", label: "Move window backward" },
      { aid: 19, value: "start_resizing_window", label: "Resize window" },
    ],
  },
  {
    label: "Tab",
    actions: [
      { aid: 20, value: "new_tab", label: "New tab" },
      { aid: 21, value: "close_tab", label: "Close tab" },
      { aid: 22, value: "next_tab", label: "Next tab" },
      { aid: 23, value: "previous_tab", label: "Previous tab" },
      { aid: 24, value: "move_tab_forward", label: "Move tab forward" },
      { aid: 25, value: "move_tab_backward", label: "Move tab backward" },
      { aid: 26, value: "goto_tab", label: "Go to tab", hint: "1" },
      { aid: 27, value: "set_tab_title", label: "Set tab title" },
    ],
  },
  {
    label: "Layout",
    actions: [
      { aid: 28, value: "next_layout", label: "Next layout" },
      { aid: 29, value: "goto_layout", label: "Go to layout", hint: "tall" },
      { aid: 30, value: "toggle_layout", label: "Toggle layout", hint: "stack" },
    ],
  },
  {
    label: "Font Size",
    actions: [
      {
        aid: 31,
        value: "change_font_size",
        label: "Change font size",
        hint: "all +2.0",
      },
    ],
  },
  {
    label: "Misc",
    actions: [
      { aid: 32, value: "send_text", label: "Send text", hint: "all \\x1b" },
      {
        aid: 33,
        value: "clear_terminal",
        label: "Clear terminal",
        hint: "reset active",
      },
      { aid: 34, value: "load_config_file", label: "Reload config" },
      { aid: 35, value: "edit_config_file", label: "Edit config" },
      { aid: 36, value: "toggle_fullscreen", label: "Toggle fullscreen" },
      { aid: 37, value: "toggle_maximized", label: "Toggle maximized" },
      { aid: 38, value: "open_url_with_hints", label: "Open URL with hints" },
      { aid: 39, value: "input_unicode_character", label: "Input Unicode character" },
      { aid: 40, value: "quit", label: "Quit" },
    ],
  },
];

export const ACTION_VALUES: Set<string> = new Set(
  ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.value)),
);

// action string -> numeric id
export const ACTION_TO_ID = new Map<string, number>();

// numeric id -> action string
export const ID_TO_ACTION = new Map<number, string>();

for (const group of ACTION_GROUPS) {
  for (const action of group.actions) {
    ACTION_TO_ID.set(action.value, action.aid);
    ID_TO_ACTION.set(action.aid, action.value);
  }
}

export function getActionHint(value: string): string | undefined {
  for (const group of ACTION_GROUPS) {
    for (const action of group.actions) {
      if (action.value === value) return action.hint;
    }
  }
  return undefined;
}

export const MODIFIERS = ["kitty_mod", "ctrl", "shift", "alt", "super"] as const;
export type Modifier = (typeof MODIFIERS)[number];

export interface KeyGroup {
  label: string;
  keys: { value: string; label: string }[];
}

export const KEY_GROUPS: KeyGroup[] = [
  {
    label: "Letters",
    keys: Array.from({ length: 26 }, (_, i) => {
      const ch = String.fromCharCode(97 + i);
      return { value: ch, label: ch };
    }),
  },
  {
    label: "Numbers",
    keys: Array.from({ length: 10 }, (_, i) => ({
      value: String(i),
      label: String(i),
    })),
  },
  {
    label: "Function",
    keys: Array.from({ length: 12 }, (_, i) => ({
      value: `f${i + 1}`,
      label: `F${i + 1}`,
    })),
  },
  {
    label: "Navigation",
    keys: [
      { value: "up", label: "Up" },
      { value: "down", label: "Down" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
      { value: "home", label: "Home" },
      { value: "end", label: "End" },
      { value: "page_up", label: "Page Up" },
      { value: "page_down", label: "Page Down" },
      { value: "insert", label: "Insert" },
      { value: "delete", label: "Delete" },
    ],
  },
  {
    label: "Whitespace",
    keys: [
      { value: "enter", label: "Enter" },
      { value: "escape", label: "Escape" },
      { value: "tab", label: "Tab" },
      { value: "backspace", label: "Backspace" },
      { value: "space", label: "Space" },
    ],
  },
  {
    label: "Punctuation",
    keys: [
      { value: "minus", label: "- minus" },
      { value: "equal", label: "= equal" },
      { value: "left_bracket", label: "[ bracket" },
      { value: "right_bracket", label: "] bracket" },
      { value: "backslash", label: "\\ backslash" },
      { value: "semicolon", label: "; semicolon" },
      { value: "apostrophe", label: "' apostrophe" },
      { value: "grave_accent", label: "` grave" },
      { value: "comma", label: ", comma" },
      { value: "period", label: ". period" },
      { value: "slash", label: "/ slash" },
      { value: "plus", label: "+ plus" },
    ],
  },
];

const ALL_KEY_VALUES = new Set(KEY_GROUPS.flatMap((g) => g.keys.map((k) => k.value)));
const MODIFIER_SET: Set<string> = new Set(MODIFIERS);

export function parseKeys(keys: string): { modifiers: Set<Modifier>; key: string } | null {
  if (!keys || keys.includes(">")) return null;
  const parts = keys.split(/[+-]/);
  if (parts.length === 0) return null;
  const key = parts[parts.length - 1].toLowerCase();
  const modifiers = new Set<Modifier>();
  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i].toLowerCase();
    if (!MODIFIER_SET.has(mod)) return null; // unknown modifier
    modifiers.add(mod as Modifier);
  }
  if (!key) return null;
  return { modifiers, key };
}

export function buildKeys(modifiers: Set<Modifier>, key: string): string {
  const parts: string[] = [];
  for (const mod of MODIFIERS) {
    if (modifiers.has(mod)) parts.push(mod);
  }
  parts.push(key);
  return parts.join("+");
}

export function isStructuredKeys(keys: string): boolean {
  if (!keys) return true;
  const parsed = parseKeys(keys);
  if (!parsed) return false;
  return ALL_KEY_VALUES.has(parsed.key) || parsed.key.length === 1;
}
