export type SettingType = "string" | "float" | "int" | "enum" | "bool" | "color";

interface SettingBase {
  key: string;
  label: string;
  type: SettingType;
  default: string;
  description?: string;
}

interface StringSetting extends SettingBase {
  type: "string";
}
interface FloatSetting extends SettingBase {
  type: "float";
  min?: number;
  max?: number;
  step?: number;
}
interface IntSetting extends SettingBase {
  type: "int";
  min?: number;
  max?: number;
}
interface EnumSetting extends SettingBase {
  type: "enum";
  options: string[];
}
interface BoolSetting extends SettingBase {
  type: "bool";
}
interface ColorSetting extends SettingBase {
  type: "color";
}

export type Setting =
  | StringSetting
  | FloatSetting
  | IntSetting
  | EnumSetting
  | BoolSetting
  | ColorSetting;

export interface Category {
  id: string;
  title: string;
  settings: Setting[];
}

export const CATEGORIES: Category[] = [
  {
    id: "fonts",
    title: "Fonts",
    settings: [
      {
        key: "font_family",
        label: "Font family",
        type: "string",
        default: "monospace",
      },
      {
        key: "font_size",
        label: "Font size",
        type: "float",
        default: "11.0",
        min: 1,
        max: 72,
        step: 0.5,
      },
      {
        key: "bold_font",
        label: "Bold font",
        type: "string",
        default: "auto",
      },
      {
        key: "italic_font",
        label: "Italic font",
        type: "string",
        default: "auto",
      },
      {
        key: "disable_ligatures",
        label: "Disable ligatures",
        type: "enum",
        default: "never",
        options: ["never", "cursor", "always"],
      },
    ],
  },
  {
    id: "cursor",
    title: "Cursor",
    settings: [
      {
        key: "cursor_shape",
        label: "Shape",
        type: "enum",
        default: "block",
        options: ["block", "beam", "underline"],
      },
      {
        key: "cursor_blink_interval",
        label: "Blink interval",
        type: "float",
        default: "-1",
        step: 0.1,
        description: "Seconds. 0 = no blink, negative = system default",
      },
      {
        key: "cursor_stop_blinking_after",
        label: "Stop blinking after",
        type: "float",
        default: "15.0",
        min: 0,
        step: 1,
        description: "Seconds of inactivity. 0 = never stop",
      },
    ],
  },
  {
    id: "scrollback",
    title: "Scrollback",
    settings: [
      {
        key: "scrollback_lines",
        label: "Lines",
        type: "int",
        default: "2000",
        min: 0,
      },
    ],
  },
  {
    id: "mouse",
    title: "Mouse",
    settings: [
      {
        key: "mouse_hide_wait",
        label: "Hide wait",
        type: "float",
        default: "3.0",
        step: 0.5,
        description: "Seconds. 0 = disabled, negative = hide immediately",
      },
      {
        key: "url_style",
        label: "URL style",
        type: "enum",
        default: "curly",
        options: ["curly", "straight", "double", "dotted", "dashed", "none"],
      },
      {
        key: "copy_on_select",
        label: "Copy on select",
        type: "enum",
        default: "no",
        options: ["no", "yes", "clipboard"],
      },
      {
        key: "detect_urls",
        label: "Detect URLs",
        type: "bool",
        default: "yes",
      },
    ],
  },
  {
    id: "window",
    title: "Window",
    settings: [
      {
        key: "window_padding_width",
        label: "Padding",
        type: "int",
        default: "0",
        min: 0,
        description: "Points. Single value = all sides",
      },
      {
        key: "background_opacity",
        label: "Background opacity",
        type: "float",
        default: "1.0",
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "placement_strategy",
        label: "Placement",
        type: "enum",
        default: "center",
        options: ["center", "top-left"],
      },
      {
        key: "hide_window_decorations",
        label: "Hide decorations",
        type: "enum",
        default: "no",
        options: ["no", "yes", "titlebar-only", "titlebar-and-corners"],
      },
      {
        key: "remember_window_size",
        label: "Remember size",
        type: "bool",
        default: "yes",
      },
      {
        key: "confirm_os_window_close",
        label: "Confirm close",
        type: "int",
        default: "-1",
        description: "-1 = confirm if multiple windows, 0 = never",
      },
    ],
  },
  {
    id: "tab_bar",
    title: "Tab Bar",
    settings: [
      {
        key: "tab_bar_edge",
        label: "Edge",
        type: "enum",
        default: "bottom",
        options: ["top", "bottom"],
      },
      {
        key: "tab_bar_style",
        label: "Style",
        type: "enum",
        default: "fade",
        options: [
          "fade",
          "hidden",
          "powerline",
          "separator",
          "slant",
          "custom",
        ],
      },
      {
        key: "active_tab_font_style",
        label: "Active font style",
        type: "enum",
        default: "bold-italic",
        options: ["normal", "bold", "italic", "bold-italic"],
      },
    ],
  },
  {
    id: "colors",
    title: "Colors",
    settings: [
      {
        key: "foreground",
        label: "Foreground",
        type: "color",
        default: "#dddddd",
      },
      {
        key: "background",
        label: "Background",
        type: "color",
        default: "#000000",
      },
      {
        key: "selection_foreground",
        label: "Selection fg",
        type: "color",
        default: "#000000",
      },
      {
        key: "selection_background",
        label: "Selection bg",
        type: "color",
        default: "#fffacd",
      },
      {
        key: "cursor",
        label: "Cursor",
        type: "color",
        default: "#cccccc",
      },
      { key: "color0", label: "Black", type: "color", default: "#000000" },
      { key: "color1", label: "Red", type: "color", default: "#cc0403" },
      { key: "color2", label: "Green", type: "color", default: "#19cb00" },
      { key: "color3", label: "Yellow", type: "color", default: "#cecb00" },
      { key: "color4", label: "Blue", type: "color", default: "#0d73cc" },
      { key: "color5", label: "Magenta", type: "color", default: "#cb1ed1" },
      { key: "color6", label: "Cyan", type: "color", default: "#0dcdcd" },
      { key: "color7", label: "White", type: "color", default: "#dddddd" },
      {
        key: "color8",
        label: "Bright black",
        type: "color",
        default: "#767676",
      },
      {
        key: "color9",
        label: "Bright red",
        type: "color",
        default: "#f2201f",
      },
      {
        key: "color10",
        label: "Bright green",
        type: "color",
        default: "#23fd00",
      },
      {
        key: "color11",
        label: "Bright yellow",
        type: "color",
        default: "#fffd00",
      },
      {
        key: "color12",
        label: "Bright blue",
        type: "color",
        default: "#1a8fff",
      },
      {
        key: "color13",
        label: "Bright magenta",
        type: "color",
        default: "#fd28ff",
      },
      {
        key: "color14",
        label: "Bright cyan",
        type: "color",
        default: "#14ffff",
      },
      {
        key: "color15",
        label: "Bright white",
        type: "color",
        default: "#ffffff",
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    settings: [
      {
        key: "shell",
        label: "Shell",
        type: "string",
        default: ".",
        description: ". = system default",
      },
      {
        key: "editor",
        label: "Editor",
        type: "string",
        default: ".",
        description: ". = $VISUAL or $EDITOR",
      },
      {
        key: "allow_remote_control",
        label: "Remote control",
        type: "enum",
        default: "no",
        options: ["no", "yes", "socket-only", "socket", "password"],
      },
      {
        key: "term",
        label: "TERM",
        type: "string",
        default: "xterm-kitty",
      },
      {
        key: "shell_integration",
        label: "Shell integration",
        type: "string",
        default: "enabled",
      },
    ],
  },
  {
    id: "macos",
    title: "macOS",
    settings: [
      {
        key: "macos_option_as_alt",
        label: "Option as Alt",
        type: "enum",
        default: "left",
        options: ["no", "yes", "left", "right", "both"],
      },
      {
        key: "macos_quit_when_last_window_closed",
        label: "Quit on Last Close",
        type: "bool",
        default: "yes",
      },
      {
        key: "macos_titlebar_color",
        label: "Titlebar color",
        type: "string",
        default: "system",
        description: "system, background, or hex color",
      },
    ],
  },
];

export const SETTINGS_MAP: Map<string, Setting> = new Map(
  CATEGORIES.flatMap((c) => c.settings.map((s) => [s.key, s] as const))
);
