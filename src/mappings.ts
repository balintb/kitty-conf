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
