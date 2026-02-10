export interface Mapping {
  id: string;
  keys: string;
  action: string;
  args: string;
}

export interface ActionDef {
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
      { value: "copy_to_clipboard", label: "Copy to clipboard" },
      { value: "copy_or_interrupt", label: "Copy or interrupt" },
      { value: "paste_from_clipboard", label: "Paste from clipboard" },
      { value: "paste_from_selection", label: "Paste from selection" },
      {
        value: "copy_and_clear_or_interrupt",
        label: "Copy+clear or interrupt",
      },
    ],
  },
  {
    label: "Scrolling",
    actions: [
      { value: "scroll_line_up", label: "Scroll line up" },
      { value: "scroll_line_down", label: "Scroll line down" },
      { value: "scroll_page_up", label: "Scroll page up" },
      { value: "scroll_page_down", label: "Scroll page down" },
      { value: "scroll_home", label: "Scroll home" },
      { value: "scroll_end", label: "Scroll end" },
      { value: "show_scrollback", label: "Show scrollback" },
    ],
  },
  {
    label: "Window",
    actions: [
      { value: "new_window", label: "New window" },
      { value: "close_window", label: "Close window" },
      { value: "next_window", label: "Next window" },
      { value: "previous_window", label: "Previous window" },
      { value: "move_window_forward", label: "Move window forward" },
      { value: "move_window_backward", label: "Move window backward" },
      { value: "start_resizing_window", label: "Resize window" },
    ],
  },
  {
    label: "Tab",
    actions: [
      { value: "new_tab", label: "New tab" },
      { value: "close_tab", label: "Close tab" },
      { value: "next_tab", label: "Next tab" },
      { value: "previous_tab", label: "Previous tab" },
      { value: "move_tab_forward", label: "Move tab forward" },
      { value: "move_tab_backward", label: "Move tab backward" },
      { value: "goto_tab", label: "Go to tab", hint: "1" },
      { value: "set_tab_title", label: "Set tab title" },
    ],
  },
  {
    label: "Layout",
    actions: [
      { value: "next_layout", label: "Next layout" },
      { value: "goto_layout", label: "Go to layout", hint: "tall" },
      { value: "toggle_layout", label: "Toggle layout", hint: "stack" },
    ],
  },
  {
    label: "Font Size",
    actions: [
      {
        value: "change_font_size",
        label: "Change font size",
        hint: "all +2.0",
      },
    ],
  },
  {
    label: "Misc",
    actions: [
      { value: "send_text", label: "Send text", hint: "all \\x1b" },
      {
        value: "clear_terminal",
        label: "Clear terminal",
        hint: "reset active",
      },
      { value: "load_config_file", label: "Reload config" },
      { value: "edit_config_file", label: "Edit config" },
      { value: "toggle_fullscreen", label: "Toggle fullscreen" },
      { value: "toggle_maximized", label: "Toggle maximized" },
      { value: "open_url_with_hints", label: "Open URL with hints" },
      { value: "input_unicode_character", label: "Input Unicode character" },
      { value: "quit", label: "Quit" },
    ],
  },
];

export const ACTION_VALUES: Set<string> = new Set(
  ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.value)),
);

export function getActionHint(value: string): string | undefined {
  for (const group of ACTION_GROUPS) {
    for (const action of group.actions) {
      if (action.value === value) return action.hint;
    }
  }
  return undefined;
}
