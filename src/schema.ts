export type SettingType = "string" | "float" | "int" | "enum" | "bool" | "color" | "file";

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
interface FileSetting extends SettingBase {
  type: "file";
  accept?: string;
}

export type Setting =
  | StringSetting
  | FloatSetting
  | IntSetting
  | EnumSetting
  | BoolSetting
  | ColorSetting
  | FileSetting;

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
        key: "bold_italic_font",
        label: "Bold italic font",
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
      {
        key: "force_ltr",
        label: "Force LTR",
        type: "bool",
        default: "no",
        description: "Disable bidirectional text support",
      },
      {
        key: "font_features",
        label: "Font features",
        type: "string",
        default: "none",
        description: "OpenType features to enable/disable",
      },
      {
        key: "undercurl_style",
        label: "Undercurl style",
        type: "enum",
        default: "thin-sparse",
        options: ["thin-sparse", "thin-dense", "thick-sparse", "thick-dense"],
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
        key: "cursor_shape_unfocused",
        label: "Unfocused shape",
        type: "enum",
        default: "hollow",
        options: ["block", "beam", "underline", "hollow", "unchanged"],
      },
      {
        key: "cursor_beam_thickness",
        label: "Beam thickness",
        type: "float",
        default: "1.5",
        min: 0.5,
        step: 0.5,
        description: "Points",
      },
      {
        key: "cursor_underline_thickness",
        label: "Underline thickness",
        type: "float",
        default: "2.0",
        min: 0.5,
        step: 0.5,
        description: "Points",
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
      {
        key: "cursor_text_color",
        label: "Text color",
        type: "string",
        default: "#111111",
        description: "Color of text under cursor. 'background' or hex",
      },
      {
        key: "cursor_trail",
        label: "Trail",
        type: "int",
        default: "0",
        min: 0,
        description: "Trail duration in ms. 0 = disabled",
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
      {
        key: "scrollback_pager",
        label: "Pager",
        type: "string",
        default: "less --chop-long-lines --RAW-CONTROL-CHARS +INPUT_LINE_NUMBER",
        description: "Program to view scrollback",
      },
      {
        key: "scrollback_pager_history_size",
        label: "Pager history size",
        type: "int",
        default: "0",
        min: 0,
        description: "MB. 0 = disabled",
      },
      {
        key: "scrollback_fill_enlarged_window",
        label: "Fill enlarged window",
        type: "bool",
        default: "no",
        description: "Fill new space from scrollback after enlarging",
      },
      {
        key: "wheel_scroll_multiplier",
        label: "Wheel scroll multiplier",
        type: "float",
        default: "5.0",
        step: 0.5,
      },
      {
        key: "touch_scroll_multiplier",
        label: "Touch scroll multiplier",
        type: "float",
        default: "1.0",
        step: 0.5,
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
        key: "url_color",
        label: "URL color",
        type: "color",
        default: "#0087bd",
      },
      {
        key: "url_style",
        label: "URL style",
        type: "enum",
        default: "curly",
        options: ["curly", "straight", "double", "dotted", "dashed", "none"],
      },
      {
        key: "open_url_with",
        label: "Open URL with",
        type: "string",
        default: "default",
        description: "Program to open URLs. 'default' = system handler",
      },
      {
        key: "detect_urls",
        label: "Detect URLs",
        type: "bool",
        default: "yes",
      },
      {
        key: "show_hyperlink_targets",
        label: "Show hyperlink targets",
        type: "bool",
        default: "no",
      },
      {
        key: "underline_hyperlinks",
        label: "Underline hyperlinks",
        type: "enum",
        default: "hover",
        options: ["hover", "always", "never"],
      },
      {
        key: "copy_on_select",
        label: "Copy on select",
        type: "enum",
        default: "no",
        options: ["no", "yes", "clipboard"],
      },
      {
        key: "paste_actions",
        label: "Paste actions",
        type: "string",
        default: "quote-urls-at-prompt,confirm",
      },
      {
        key: "strip_trailing_spaces",
        label: "Strip trailing spaces",
        type: "enum",
        default: "never",
        options: ["never", "smart", "always"],
      },
      {
        key: "focus_follows_mouse",
        label: "Focus follows mouse",
        type: "bool",
        default: "no",
      },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    settings: [
      {
        key: "repaint_delay",
        label: "Repaint delay",
        type: "int",
        default: "10",
        min: 0,
        description: "Milliseconds",
      },
      {
        key: "input_delay",
        label: "Input delay",
        type: "int",
        default: "3",
        min: 0,
        description: "Milliseconds",
      },
      {
        key: "sync_to_monitor",
        label: "Sync to monitor",
        type: "bool",
        default: "yes",
      },
    ],
  },
  {
    id: "bell",
    title: "Bell",
    settings: [
      {
        key: "enable_audio_bell",
        label: "Audio bell",
        type: "bool",
        default: "yes",
      },
      {
        key: "visual_bell_duration",
        label: "Visual bell duration",
        type: "float",
        default: "0.0",
        min: 0,
        step: 0.1,
        description: "Seconds. 0 = disabled",
      },
      {
        key: "visual_bell_color",
        label: "Visual bell color",
        type: "string",
        default: "none",
        description: "'none' or hex color",
      },
      {
        key: "window_alert_on_bell",
        label: "Window alert on bell",
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
        key: "remember_window_size",
        label: "Remember size",
        type: "bool",
        default: "yes",
      },
      {
        key: "initial_window_width",
        label: "Initial width",
        type: "int",
        default: "640",
        min: 1,
      },
      {
        key: "initial_window_height",
        label: "Initial height",
        type: "int",
        default: "400",
        min: 1,
      },
      {
        key: "enabled_layouts",
        label: "Enabled layouts",
        type: "string",
        default: "*",
        description: "Comma-separated. * = all",
      },
      {
        key: "window_border_width",
        label: "Border width",
        type: "string",
        default: "0.5pt",
        description: "e.g. 0.5pt, 1px",
      },
      {
        key: "window_margin_width",
        label: "Margin",
        type: "int",
        default: "0",
        min: 0,
        description: "Points",
      },
      {
        key: "window_padding_width",
        label: "Padding",
        type: "int",
        default: "0",
        min: 0,
        description: "Points. Single value = all sides",
      },
      {
        key: "placement_strategy",
        label: "Placement",
        type: "enum",
        default: "center",
        options: ["center", "top-left"],
      },
      {
        key: "active_border_color",
        label: "Active border color",
        type: "color",
        default: "#00ff00",
      },
      {
        key: "inactive_border_color",
        label: "Inactive border color",
        type: "color",
        default: "#cccccc",
      },
      {
        key: "inactive_text_alpha",
        label: "Inactive text alpha",
        type: "float",
        default: "1.0",
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "hide_window_decorations",
        label: "Hide decorations",
        type: "enum",
        default: "no",
        options: ["no", "yes", "titlebar-only", "titlebar-and-corners"],
      },
      {
        key: "confirm_os_window_close",
        label: "Confirm close",
        type: "int",
        default: "-1",
        description: "-1 = confirm if multiple windows, 0 = never",
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
        key: "dynamic_background_opacity",
        label: "Dynamic background opacity",
        type: "bool",
        default: "no",
        description: "Allow changing opacity at runtime",
      },
      {
        key: "background_image",
        label: "Background image",
        type: "file",
        default: "none",
        accept: "image/*",
      },
      {
        key: "background_image_layout",
        label: "Image layout",
        type: "enum",
        default: "tiled",
        options: ["tiled", "mirror-tiled", "scaled", "clamped", "centered", "cscaled"],
      },
      {
        key: "background_image_linear",
        label: "Image linear filtering",
        type: "bool",
        default: "no",
        description: "Smooth scaling instead of pixelated",
      },
      {
        key: "background_tint",
        label: "Background tint",
        type: "float",
        default: "0.0",
        min: 0,
        max: 1,
        step: 0.05,
        description: "Tint image with background color for readability",
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
        key: "tab_bar_align",
        label: "Alignment",
        type: "enum",
        default: "left",
        options: ["left", "center", "right"],
      },
      {
        key: "tab_bar_margin_width",
        label: "Margin width",
        type: "float",
        default: "0.0",
        min: 0,
        step: 0.5,
      },
      {
        key: "tab_powerline_style",
        label: "Powerline style",
        type: "enum",
        default: "angled",
        options: ["angled", "slanted", "round"],
      },
      {
        key: "active_tab_foreground",
        label: "Active tab fg",
        type: "color",
        default: "#000000",
      },
      {
        key: "active_tab_background",
        label: "Active tab bg",
        type: "color",
        default: "#eeeeee",
      },
      {
        key: "active_tab_font_style",
        label: "Active font style",
        type: "enum",
        default: "bold-italic",
        options: ["normal", "bold", "italic", "bold-italic"],
      },
      {
        key: "inactive_tab_foreground",
        label: "Inactive tab fg",
        type: "color",
        default: "#444444",
      },
      {
        key: "inactive_tab_background",
        label: "Inactive tab bg",
        type: "color",
        default: "#999999",
      },
      {
        key: "inactive_tab_font_style",
        label: "Inactive font style",
        type: "enum",
        default: "normal",
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
        key: "close_on_child_death",
        label: "Close on child death",
        type: "bool",
        default: "no",
      },
      {
        key: "allow_remote_control",
        label: "Remote control",
        type: "enum",
        default: "no",
        options: ["no", "yes", "socket-only", "socket", "password"],
      },
      {
        key: "allow_hyperlinks",
        label: "Allow hyperlinks",
        type: "bool",
        default: "yes",
      },
      {
        key: "shell_integration",
        label: "Shell integration",
        type: "string",
        default: "enabled",
      },
      {
        key: "term",
        label: "TERM",
        type: "string",
        default: "xterm-kitty",
      },
      {
        key: "update_check_interval",
        label: "Update check interval",
        type: "int",
        default: "24",
        min: 0,
        description: "Hours. 0 = disabled",
      },
      {
        key: "startup_session",
        label: "Startup session",
        type: "string",
        default: "none",
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
        label: "Quit on last close",
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
      {
        key: "macos_hide_from_tasks",
        label: "Hide from tasks",
        type: "bool",
        default: "no",
      },
      {
        key: "macos_window_resizable",
        label: "Window resizable",
        type: "bool",
        default: "yes",
      },
      {
        key: "macos_thicken_font",
        label: "Thicken font",
        type: "float",
        default: "0",
        min: 0,
        step: 0.25,
      },
      {
        key: "macos_traditional_fullscreen",
        label: "Traditional fullscreen",
        type: "bool",
        default: "no",
      },
    ],
  },
  {
    id: "linux",
    title: "Linux",
    settings: [
      {
        key: "linux_display_server",
        label: "Display server",
        type: "enum",
        default: "auto",
        options: ["auto", "x11", "wayland"],
      },
      {
        key: "wayland_titlebar_color",
        label: "Wayland titlebar color",
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
