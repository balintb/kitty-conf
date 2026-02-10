import { getValue, subscribe } from "./state";

const urlStyleMap: Record<string, string> = {
  curly: "wavy",
  straight: "solid",
  double: "double",
  dotted: "dotted",
  dashed: "dashed",
};

const layoutCss: Record<string, { size: string; repeat: string; position: string }> = {
  tiled: { size: "auto", repeat: "repeat", position: "top left" },
  "mirror-tiled": { size: "auto", repeat: "repeat", position: "top left" },
  scaled: { size: "100% 100%", repeat: "no-repeat", position: "top left" },
  clamped: { size: "auto", repeat: "no-repeat", position: "top left" },
  centered: { size: "auto", repeat: "no-repeat", position: "center" },
  cscaled: { size: "cover", repeat: "no-repeat", position: "center" },
};

let root: HTMLElement;
let titlebar: HTMLElement;
let tabBarTop: HTMLElement;
let tabBarBottom: HTMLElement;
let terminal: HTMLElement;
let terminalInner: HTMLElement;
let tintOverlay: HTMLElement;

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function buildTabBar(): HTMLElement {
  const bar = el("div", "kitty-tab-bar");
  const tabs = el("div", "kitty-tabs");

  const tab1 = el("div", "kitty-tab active");
  tab1.innerHTML = `<span class="kitty-tab-label">~ zsh</span>`;

  const tab2 = el("div", "kitty-tab inactive");
  tab2.innerHTML = `<span class="kitty-tab-label">nvim</span>`;

  tabs.appendChild(tab1);
  tabs.appendChild(tab2);
  bar.appendChild(tabs);
  return bar;
}

function buildTerminalContent(): HTMLElement {
  const inner = el("div", "kitty-terminal-inner");
  inner.innerHTML = `<div class="line"><span class="c2">~</span> <span class="c4">$</span> <span class="fg">ls -la</span></div>
<div class="line"><span class="c8">total 32</span></div>
<div class="line"><span class="c4">drwxr-xr-x</span>  <span class="c6">5</span> <span class="c3">user</span> <span class="c3">staff</span>  <span class="fg">160</span> <span class="c5">Jan 10</span> <span class="c12">.</span></div>
<div class="line"><span class="c4">drwxr-xr-x</span> <span class="c6">12</span> <span class="c3">user</span> <span class="c3">staff</span>  <span class="fg">384</span> <span class="c5">Jan  9</span> <span class="c12">..</span></div>
<div class="line"><span class="c4">-rw-r--r--</span>  <span class="c6">1</span> <span class="c3">user</span> <span class="c3">staff</span> <span class="fg">2048</span> <span class="c5">Jan 10</span> <span class="c10">kitty.conf</span></div>
<div class="line"><span class="c4">-rwxr-xr-x</span>  <span class="c6">1</span> <span class="c3">user</span> <span class="c3">staff</span>  <span class="fg">512</span> <span class="c5">Jan  8</span> <span class="c2">setup.sh</span></div>
<div class="line"><span class="c4">drwxr-xr-x</span>  <span class="c6">3</span> <span class="c3">user</span> <span class="c3">staff</span>   <span class="fg">96</span> <span class="c5">Jan  7</span> <span class="c12">src/</span></div>
<div class="line"><span class="c8">See </span><span class="url">https://sw.kovidgoyal.net/kitty/</span></div>
<div class="line"></div>
<div class="line"><span class="c2">~</span> <span class="c4">$</span> <span class="cursor-char">&nbsp;</span></div>`;
  return inner;
}

export function createPreview(container: HTMLElement): void {
  root = el("div", "kitty-preview");

  titlebar = el("div", "kitty-titlebar");
  const lights = el("div", "traffic-lights");
  lights.appendChild(el("span", "tl-close"));
  lights.appendChild(el("span", "tl-minimize"));
  lights.appendChild(el("span", "tl-zoom"));
  titlebar.appendChild(lights);
  titlebar.appendChild(el("span", "kitty-title", "kitty (drag me!)"));
  root.appendChild(titlebar);

  tabBarTop = buildTabBar();
  tabBarTop.classList.add("position-top");
  root.appendChild(tabBarTop);

  terminal = el("div", "kitty-terminal");
  terminalInner = buildTerminalContent();
  tintOverlay = el("div", "kitty-bg-tint");
  terminal.appendChild(tintOverlay);
  terminal.appendChild(terminalInner);
  root.appendChild(terminal);

  tabBarBottom = buildTabBar();
  tabBarBottom.classList.add("position-bottom");
  root.appendChild(tabBarBottom);

  container.appendChild(root);

  setupDrag();
  subscribe(updatePreview);
  updatePreview();
}

function setupDrag(): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let isFloating = false;

  titlebar.style.cursor = "grab";

  titlebar.addEventListener("mousedown", (e) => {
    if ((e.target as HTMLElement).closest(".traffic-lights")) return;
    e.preventDefault();
    isDragging = true;
    titlebar.style.cursor = "grabbing";

    if (!isFloating) {
      const rect = root.getBoundingClientRect();
      root.classList.add("floating");
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.width = `${rect.width}px`;
      isFloating = true;
    }

    offsetX = e.clientX - root.getBoundingClientRect().left;
    offsetY = e.clientY - root.getBoundingClientRect().top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    root.style.left = `${e.clientX - offsetX}px`;
    root.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    titlebar.style.cursor = "grab";
  });

  titlebar.addEventListener("dblclick", (e) => {
    if ((e.target as HTMLElement).closest(".traffic-lights")) return;
    if (!isFloating) return;
    root.classList.remove("floating");
    root.style.left = "";
    root.style.top = "";
    root.style.width = "";
    isFloating = false;
  });
}

function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return null;
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

function updatePreview(): void {
  const s = root.style;

  s.setProperty("--p-fg", getValue("foreground"));
  s.setProperty("--p-bg", getValue("background"));
  s.setProperty("--p-cursor", getValue("cursor"));

  for (let i = 0; i <= 15; i++) {
    s.setProperty(`--p-c${i}`, getValue(`color${i}`));
  }

  const opacity = getValue("background_opacity");
  const bgRgb = hexToRgb(getValue("background"));
  if (bgRgb) {
    s.setProperty("--p-bg-rgba", `rgba(${bgRgb}, ${opacity})`);
  } else {
    s.setProperty("--p-bg-rgba", getValue("background"));
  }

  const fontFamily = getValue("font_family");
  s.setProperty("--p-font", `"${fontFamily}", monospace`);
  s.setProperty("--p-font-size", `${getValue("font_size")}px`);

  s.setProperty("--p-padding", `${getValue("window_padding_width")}px`);

  const cursorEl = terminalInner.querySelector(".cursor-char");
  if (cursorEl) {
    cursorEl.className = "cursor-char";
    cursorEl.classList.add(`cursor-${getValue("cursor_shape")}`);

    const blinkInterval = parseFloat(getValue("cursor_blink_interval"));
    // negative = system default (~0.5s), 0 = no blink, positive = custom interval
    if (blinkInterval === 0) {
      s.setProperty("--p-cursor-blink", "none");
    } else {
      const duration = blinkInterval < 0 ? 1 : blinkInterval * 2;
      s.setProperty("--p-cursor-blink", `cursor-blink ${duration}s step-end infinite`);
    }
  }

  // URL styling — depends on detect_urls and underline_hyperlinks
  const detectUrls = getValue("detect_urls") === "yes";
  const urlStyle = getValue("url_style");
  const urlColor = getValue("url_color");
  const underlineHyperlinks = getValue("underline_hyperlinks");
  if (!detectUrls || urlStyle === "none") {
    s.setProperty("--p-url-decoration", "none");
  } else {
    s.setProperty("--p-url-decoration", "underline");
    s.setProperty("--p-url-style", urlStyleMap[urlStyle] ?? "wavy");
    s.setProperty("--p-url-decoration-color", urlColor);
  }
  const urlEl = terminalInner.querySelector(".url") as HTMLElement | null;
  if (urlEl) {
    urlEl.style.cursor = detectUrls ? "pointer" : "";
    // underline_hyperlinks: hover = show on mouseover, always = always show, never = no decoration
    if (!detectUrls || underlineHyperlinks === "never") {
      urlEl.dataset.urlMode = "never";
    } else if (underlineHyperlinks === "always") {
      urlEl.dataset.urlMode = "always";
    } else {
      urlEl.dataset.urlMode = "hover";
    }
  }

  // Tab bar position and style
  const edge = getValue("tab_bar_edge");
  tabBarTop.classList.toggle("hidden", edge !== "top");
  tabBarBottom.classList.toggle("hidden", edge !== "bottom");

  const style = getValue("tab_bar_style");
  for (const bar of [tabBarTop, tabBarBottom]) {
    bar.dataset.style = style;
    bar.classList.toggle("hidden", style === "hidden" || (edge === "top" ? bar === tabBarBottom : bar === tabBarTop));
  }

  // Tab bar colors
  s.setProperty("--p-active-tab-fg", getValue("active_tab_foreground"));
  s.setProperty("--p-active-tab-bg", getValue("active_tab_background"));
  s.setProperty("--p-inactive-tab-fg", getValue("inactive_tab_foreground"));
  s.setProperty("--p-inactive-tab-bg", getValue("inactive_tab_background"));

  // Tab bar alignment
  const tabAlign = getValue("tab_bar_align");
  const justifyMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };
  s.setProperty("--p-tab-align", justifyMap[tabAlign] ?? "flex-start");

  // Active tab font style
  const fontStyle = getValue("active_tab_font_style");
  for (const tab of root.querySelectorAll<HTMLElement>(".kitty-tab.active")) {
    tab.style.fontWeight = fontStyle.includes("bold") ? "bold" : "normal";
    tab.style.fontStyle = fontStyle.includes("italic") ? "italic" : "normal";
  }

  // Inactive tab font style
  const inactiveFontStyle = getValue("inactive_tab_font_style");
  for (const tab of root.querySelectorAll<HTMLElement>(".kitty-tab.inactive")) {
    tab.style.fontWeight = inactiveFontStyle.includes("bold") ? "bold" : "normal";
    tab.style.fontStyle = inactiveFontStyle.includes("italic") ? "italic" : "normal";
  }

  // Window decorations
  const decorations = getValue("hide_window_decorations");
  titlebar.classList.toggle("hidden", decorations === "yes");
  titlebar.classList.toggle("transparent", decorations === "titlebar-only" || decorations === "titlebar-and-corners");
  root.classList.toggle("no-radius", decorations === "titlebar-and-corners" || decorations === "yes");

  // Background image
  const bgImage = getValue("background_image");
  if (bgImage !== "none" && bgImage !== "" && bgImage.startsWith("data:")) {
    terminal.style.backgroundImage = `url(${bgImage})`;
    const layout = layoutCss[getValue("background_image_layout")] ?? layoutCss.tiled;
    terminal.style.backgroundSize = layout.size;
    terminal.style.backgroundRepeat = layout.repeat;
    terminal.style.backgroundPosition = layout.position;

    const linear = getValue("background_image_linear") === "yes";
    terminal.style.imageRendering = linear ? "auto" : "pixelated";

    // Tint overlay
    const tint = parseFloat(getValue("background_tint")) || 0;
    if (tint > 0 && bgRgb) {
      tintOverlay.style.display = "block";
      tintOverlay.style.background = `rgba(${bgRgb}, ${tint})`;
    } else {
      tintOverlay.style.display = "none";
    }
  } else {
    terminal.style.backgroundImage = "";
    terminal.style.backgroundSize = "";
    terminal.style.backgroundRepeat = "";
    terminal.style.backgroundPosition = "";
    terminal.style.imageRendering = "";
    tintOverlay.style.display = "none";
  }
}
