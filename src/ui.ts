import { CATEGORIES, type Setting } from "./schema";
import { getValue, setValue, setFileName, resetAll, buildShareUrl, subscribe } from "./state";
import { generateConfig } from "./generate";
import { copyToClipboard } from "./clipboard";
import { createPreview } from "./preview";
import { parseConfig } from "./parse";
import { getLocalFonts } from "./fonts";

const inputElements: Map<string, HTMLInputElement | HTMLSelectElement> = new Map();

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return getSystemTheme();
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function buildThemeToggle(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "theme-toggle";

  const current = getTheme();

  for (const value of ["light", "dark"] as Theme[]) {
    const btn = document.createElement("button");
    btn.className = "theme-btn";
    btn.textContent = value.charAt(0).toUpperCase() + value.slice(1);
    if (value === current) btn.classList.add("active");

    btn.addEventListener("click", () => {
      wrapper.querySelector(".theme-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      applyTheme(value);
    });

    wrapper.appendChild(btn);
  }

  applyTheme(current);
  return wrapper;
}
const colorPickers: Map<string, HTMLInputElement> = new Map();

let fontDatalist: HTMLDataListElement | null = null;

function createField(setting: Setting): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "field";

  const label = document.createElement("label");
  label.textContent = setting.label;
  label.htmlFor = `field-${setting.key}`;
  if (setting.description) label.title = setting.description;
  div.appendChild(label);

  if (setting.type === "color") {
    const wrapper = document.createElement("div");
    wrapper.className = "color-pair";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = getValue(setting.key);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.id = `field-${setting.key}`;
    textInput.value = getValue(setting.key);

    colorInput.addEventListener("input", () => {
      textInput.value = colorInput.value;
      setValue(setting.key, colorInput.value);
    });
    textInput.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) {
        colorInput.value = textInput.value;
      }
      setValue(setting.key, textInput.value);
    });

    wrapper.appendChild(colorInput);
    wrapper.appendChild(textInput);
    div.appendChild(wrapper);

    inputElements.set(setting.key, textInput);
    colorPickers.set(setting.key, colorInput);
    return div;
  }

  let control: HTMLInputElement | HTMLSelectElement;

  switch (setting.type) {
    case "enum":
    case "bool": {
      const select = document.createElement("select");
      const options = setting.type === "bool" ? ["yes", "no"] : setting.options;
      for (const opt of options) {
        const optEl = document.createElement("option");
        optEl.value = opt;
        optEl.textContent = opt;
        select.appendChild(optEl);
      }
      select.value = getValue(setting.key);
      control = select;
      break;
    }
    case "float": {
      const input = document.createElement("input");
      input.type = "number";
      input.step = String(setting.step ?? 0.1);
      if (setting.min !== undefined) input.min = String(setting.min);
      if (setting.max !== undefined) input.max = String(setting.max);
      input.value = getValue(setting.key);
      control = input;
      break;
    }
    case "int": {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "1";
      if (setting.min !== undefined) input.min = String(setting.min);
      if (setting.max !== undefined) input.max = String(setting.max);
      input.value = getValue(setting.key);
      control = input;
      break;
    }
    case "file": {
      const wrapper = document.createElement("div");
      wrapper.className = "file-pair";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.id = `field-${setting.key}`;
      if (setting.type === "file" && setting.accept) {
        fileInput.accept = setting.accept;
      }

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.textContent = "Clear";
      clearBtn.className = "btn-secondary btn-sm";

      const current = getValue(setting.key);
      if (current === "none" || current === "") {
        clearBtn.style.display = "none";
      }

      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setFileName(setting.key, file.name);
          setValue(setting.key, reader.result as string);
          clearBtn.style.display = "";
        };
        reader.readAsDataURL(file);
      });

      clearBtn.addEventListener("click", () => {
        setValue(setting.key, "none");
        fileInput.value = "";
        clearBtn.style.display = "none";
      });

      wrapper.appendChild(fileInput);
      wrapper.appendChild(clearBtn);
      div.appendChild(wrapper);
      return div;
    }
    default: {
      const input = document.createElement("input");
      input.type = "text";
      input.value = getValue(setting.key);
      if (setting.key === "font_family") {
        fontDatalist = document.createElement("datalist");
        fontDatalist.id = "font-families";
        input.setAttribute("list", "font-families");
        div.appendChild(fontDatalist);
        loadFonts();
      }
      control = input;
      break;
    }
  }

  control.id = `field-${setting.key}`;
  if (setting.description) control.title = setting.description;
  control.addEventListener("input", () => {
    setValue(setting.key, control.value);
  });

  div.appendChild(control);
  inputElements.set(setting.key, control);
  return div;
}

async function loadFonts(): Promise<void> {
  if (!fontDatalist) return;
  const families = await getLocalFonts();
  for (const family of families) {
    const opt = document.createElement("option");
    opt.value = family;
    fontDatalist.appendChild(opt);
  }
}

export function render(root: HTMLElement): void {
  const header = document.createElement("header");

  const headerRow = document.createElement("div");
  headerRow.className = "header-row";

  const h1 = document.createElement("h1");
  const code = document.createElement("code");
  code.textContent = "kitty.conf";
  h1.appendChild(code);
  h1.appendChild(document.createTextNode(" generator"));

  const themeToggle = buildThemeToggle();
  headerRow.appendChild(h1);
  headerRow.appendChild(themeToggle);
  header.appendChild(headerRow);

  const tagline = document.createElement("p");
  tagline.appendChild(document.createTextNode("Configure your "));
  const kittyLink = document.createElement("a");
  kittyLink.href = "https://sw.kovidgoyal.net/kitty/";
  kittyLink.target = "_blank";
  kittyLink.rel = "noopener";
  const kittyCode = document.createElement("code");
  kittyCode.textContent = "kitty";
  kittyLink.appendChild(kittyCode);
  tagline.appendChild(kittyLink);
  tagline.appendChild(
    document.createTextNode(
      " terminal. Only changed settings are included in the output. ",
    ),
  );
  const repoLink = document.createElement("a");
  repoLink.href = "https://balint.click/kitty-conf";
  repoLink.target = "_blank";
  repoLink.rel = "noopener";
  repoLink.className = "byline-link";
  repoLink.textContent = "GitHub";
  tagline.appendChild(repoLink);
  header.appendChild(tagline);
  root.appendChild(header);

  const main = document.createElement("main");

  const controls = document.createElement("section");
  controls.className = "controls";

  for (const category of CATEGORIES) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = category.title;
    fieldset.appendChild(legend);

    for (const setting of category.settings) {
      fieldset.appendChild(createField(setting));
    }
    controls.appendChild(fieldset);
  }
  main.appendChild(controls);

  const rightCol = document.createElement("div");
  rightCol.className = "right-col";

  const previewSection = document.createElement("section");
  previewSection.className = "preview-section";
  createPreview(previewSection);
  rightCol.appendChild(previewSection);

  const output = document.createElement("section");
  output.className = "output";

  const outputHeader = document.createElement("div");
  outputHeader.className = "output-header";
  const h2 = document.createElement("h2");
  h2.textContent = "Generated Config";

  const buttons = document.createElement("div");
  buttons.className = "output-buttons";

  const importBtn = document.createElement("button");
  importBtn.textContent = "Import";
  importBtn.className = "btn-secondary";

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.className = "btn-secondary";
  resetBtn.addEventListener("click", () => {
    resetAll();
  });

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(codeEl.textContent ?? "");
    copyBtn.textContent = ok ? "Copied!" : "Failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1500);
  });

  const shareBtn = document.createElement("button");
  shareBtn.textContent = "Share";
  shareBtn.className = "btn-secondary";
  shareBtn.addEventListener("click", async () => {
    const url = await buildShareUrl();
    if (!url.includes("#")) {
      shareBtn.textContent = "Nothing to share";
      setTimeout(() => { shareBtn.textContent = "Share"; }, 1500);
      return;
    }
    if (url.length > 2000) {
      shareBtn.textContent = "URL too long";
      setTimeout(() => { shareBtn.textContent = "Share"; }, 2000);
      return;
    }
    const ok = await copyToClipboard(url);
    shareBtn.textContent = ok ? "Link Copied!" : "Failed";
    setTimeout(() => {
      shareBtn.textContent = "Share";
    }, 1500);
  });

  buttons.appendChild(importBtn);
  buttons.appendChild(shareBtn);
  buttons.appendChild(resetBtn);
  buttons.appendChild(copyBtn);
  outputHeader.appendChild(h2);
  outputHeader.appendChild(buttons);
  output.appendChild(outputHeader);

  const importSection = document.createElement("div");
  importSection.className = "import-section hidden";

  const importTextarea = document.createElement("textarea");
  importTextarea.placeholder = "Paste your kitty.conf here...";
  importTextarea.rows = 8;

  const importActions = document.createElement("div");
  importActions.className = "import-actions";

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";
  applyBtn.addEventListener("click", () => {
    const count = parseConfig(importTextarea.value);
    applyBtn.textContent = `Applied ${count} settings`;
    setTimeout(() => {
      applyBtn.textContent = "Apply";
    }, 1500);
    importTextarea.value = "";
    importSection.classList.add("hidden");
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "btn-secondary";
  cancelBtn.addEventListener("click", () => {
    importTextarea.value = "";
    importSection.classList.add("hidden");
  });

  importActions.appendChild(cancelBtn);
  importActions.appendChild(applyBtn);
  importSection.appendChild(importTextarea);
  importSection.appendChild(importActions);
  output.appendChild(importSection);

  importBtn.addEventListener("click", () => {
    importSection.classList.toggle("hidden");
    if (!importSection.classList.contains("hidden")) {
      importTextarea.focus();
    }
  });

  const preEl = document.createElement("pre");
  const codeEl = document.createElement("code");
  preEl.appendChild(codeEl);
  output.appendChild(preEl);
  rightCol.appendChild(output);
  main.appendChild(rightCol);

  root.appendChild(main);

  const footer = document.createElement("footer");
  const footerText = document.createElement("code");
  footerText.textContent = "$ made with <3 | ";
  footer.appendChild(footerText);
  const footerLink = document.createElement("a");
  footerLink.href = "https://balint.click/jXeIxM";
  footerLink.target = "_blank";
  footerLink.rel = "noopener";
  footerLink.textContent = "balintb";
  footer.appendChild(footerLink);
  const footerExit = document.createElement("code");
  footerExit.textContent = " | exit 0";
  footer.appendChild(footerExit);
  root.appendChild(footer);

  function syncAll(): void {
    for (const [key, el] of inputElements) {
      const val = getValue(key);
      if (el.value !== val) el.value = val;
    }
    for (const [key, picker] of colorPickers) {
      const val = getValue(key);
      if (/^#[0-9a-fA-F]{6}$/.test(val) && picker.value !== val) {
        picker.value = val;
      }
    }
    codeEl.textContent = generateConfig();
  }

  subscribe(syncAll);
  codeEl.textContent = generateConfig();
}
