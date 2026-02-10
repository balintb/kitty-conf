declare global {
  interface Window {
    queryLocalFonts?: () => Promise<{ family: string }[]>;
  }
}

const COMMON_MONOSPACE_FONTS = [
  "Andale Mono",
  "Anonymous Pro",
  "Berkeley Mono",
  "Cascadia Code",
  "Cascadia Mono",
  "Comic Mono",
  "Consolas",
  "Courier New",
  "DejaVu Sans Mono",
  "Droid Sans Mono",
  "Fantasque Sans Mono",
  "Fira Code",
  "Fira Mono",
  "Geist Mono",
  "Hack",
  "Hasklig",
  "IBM Plex Mono",
  "Inconsolata",
  "Input Mono",
  "Iosevka",
  "JetBrains Mono",
  "Liberation Mono",
  "Menlo",
  "Meslo LG S",
  "Monaco",
  "Monaspace Neon",
  "Monaspace Argon",
  "Monaspace Radon",
  "Noto Sans Mono",
  "Operator Mono",
  "PragmataPro",
  "Rec Mono",
  "Roboto Mono",
  "SF Mono",
  "Source Code Pro",
  "Space Mono",
  "Ubuntu Mono",
  "Victor Mono",
  "monospace",
];

function detectAvailable(fonts: string[]): string[] {
  if (typeof document === "undefined") return fonts;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fonts;

  const testStr = "mmmmmmmmmmlli";
  const fallback = "monospace";
  ctx.font = `72px ${fallback}`;
  const fallbackWidth = ctx.measureText(testStr).width;

  return fonts.filter((f) => {
    if (f === fallback) return true;
    ctx.font = `72px "${f}", ${fallback}`;
    return ctx.measureText(testStr).width !== fallbackWidth;
  });
}

export async function getLocalFonts(): Promise<string[]> {
  if (window.queryLocalFonts) {
    try {
      const fonts = await window.queryLocalFonts();
      const families = [...new Set(fonts.map((f) => f.family))];
      if (families.length > 0) {
        return families.sort((a, b) => a.localeCompare(b));
      }
    } catch {
      // fall through
    }
  }

  // detect which common monospace fonts are installed via canvas
  return detectAvailable(COMMON_MONOSPACE_FONTS);
}
