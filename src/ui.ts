import { CATEGORIES, SETTINGS_MAP, type Setting } from "./schema";
import {
  getValue,
  setValue,
  setFileName,
  resetAll,
  buildShareUrl,
  subscribe,
  isValid,
  getMappings,
  addMapping,
  updateMapping,
  removeMapping,
} from "./state";
import { generateConfig } from "./generate";
import { copyToClipboard } from "./clipboard";
import { createPreview } from "./preview";
import { parseConfig } from "./parse";
import { getLocalFonts } from "./fonts";
import {
  ACTION_GROUPS,
  ACTION_VALUES,
  getActionHint,
  MODIFIERS,
  KEY_GROUPS,
  parseKeys,
  buildKeys,
  type Mapping,
  type Modifier,
} from "./mappings";

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

const ADVANCED_KEY = "kitty-conf-mappings-advanced";
let advancedMode = localStorage.getItem(ADVANCED_KEY) === "1";

function buildActionSelect(mapping: Mapping): HTMLSelectElement {
  const actionSelect = document.createElement("select");
  actionSelect.className = "mapping-action";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Choose action\u2026";
  actionSelect.appendChild(emptyOpt);

  if (mapping.action && !ACTION_VALUES.has(mapping.action)) {
    const unknownOpt = document.createElement("option");
    unknownOpt.value = mapping.action;
    unknownOpt.textContent = mapping.action;
    actionSelect.appendChild(unknownOpt);
  }

  for (const group of ACTION_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const action of group.actions) {
      const opt = document.createElement("option");
      opt.value = action.value;
      opt.textContent = action.label;
      optgroup.appendChild(opt);
    }
    actionSelect.appendChild(optgroup);
  }
  actionSelect.value = mapping.action;
  return actionSelect;
}

function buildKeySelect(currentKey: string): HTMLSelectElement {
  const keySelect = document.createElement("select");
  keySelect.className = "mapping-key-select";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Key\u2026";
  keySelect.appendChild(emptyOpt);

  let foundInGroups = !currentKey || currentKey === "";
  for (const group of KEY_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const key of group.keys) {
      const opt = document.createElement("option");
      opt.value = key.value;
      opt.textContent = key.label;
      optgroup.appendChild(opt);
      if (key.value === currentKey) foundInGroups = true;
    }
    keySelect.appendChild(optgroup);
  }

  if (currentKey && !foundInGroups) {
    const unknownOpt = document.createElement("option");
    unknownOpt.value = currentKey;
    unknownOpt.textContent = currentKey;
    keySelect.insertBefore(unknownOpt, keySelect.children[1]);
  }

  keySelect.value = currentKey;
  return keySelect;
}

const MOD_LABELS: Record<Modifier, string> = {
  kitty_mod: "km",
  ctrl: "ctrl",
  shift: "shift",
  alt: "alt",
  super: "super",
};

function createMappingRow(mapping: Mapping, isAdvanced: boolean): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "mapping-row";
  row.dataset.id = mapping.id;

  if (isAdvanced) {
    const keysInput = document.createElement("input");
    keysInput.type = "text";
    keysInput.className = "mapping-keys";
    keysInput.placeholder = "ctrl+shift+c";
    keysInput.value = mapping.keys;
    keysInput.addEventListener("input", () => {
      updateMapping(mapping.id, { keys: keysInput.value });
    });
    row.appendChild(keysInput);
  } else {
    const parsed = parseKeys(mapping.keys);
    const activeModifiers = parsed?.modifiers ?? new Set<Modifier>();
    const activeKey = parsed?.key ?? "";

    const modsGroup = document.createElement("div");
    modsGroup.className = "mapping-mods";

    for (const mod of MODIFIERS) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "mod-pill";
      pill.textContent = MOD_LABELS[mod];
      pill.dataset.mod = mod;
      if (activeModifiers.has(mod)) pill.classList.add("active");
      pill.addEventListener("click", () => {
        pill.classList.toggle("active");
        const mods = getModifiersFromRow(row);
        const key = row.querySelector<HTMLSelectElement>(".mapping-key-select")!.value;
        updateMapping(mapping.id, { keys: key || mods.size ? buildKeys(mods, key) : "" });
      });
      modsGroup.appendChild(pill);
    }
    row.appendChild(modsGroup);

    const keySelect = buildKeySelect(activeKey);
    keySelect.addEventListener("change", () => {
      const mods = getModifiersFromRow(row);
      updateMapping(mapping.id, { keys: keySelect.value || mods.size ? buildKeys(mods, keySelect.value) : "" });
    });
    row.appendChild(keySelect);
  }

  const actionSelect = buildActionSelect(mapping);

  const argsInput = document.createElement("input");
  argsInput.type = "text";
  argsInput.className = "mapping-args";
  argsInput.value = mapping.args;
  const hint = getActionHint(mapping.action);
  if (hint) argsInput.placeholder = hint;

  actionSelect.addEventListener("change", () => {
    updateMapping(mapping.id, { action: actionSelect.value });
    const newHint = getActionHint(actionSelect.value);
    argsInput.placeholder = newHint || "";
  });

  argsInput.addEventListener("input", () => {
    updateMapping(mapping.id, { args: argsInput.value });
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-secondary btn-icon mapping-delete";
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Remove</title><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  deleteBtn.title = "Remove mapping";
  deleteBtn.addEventListener("click", () => {
    removeMapping(mapping.id);
  });

  row.appendChild(actionSelect);
  row.appendChild(argsInput);
  row.appendChild(deleteBtn);

  return row;
}

function getModifiersFromRow(row: HTMLElement): Set<Modifier> {
  const mods = new Set<Modifier>();
  for (const pill of row.querySelectorAll<HTMLButtonElement>(".mod-pill.active")) {
    if (pill.dataset.mod) mods.add(pill.dataset.mod as Modifier);
  }
  return mods;
}

function syncMappingsList(listEl: HTMLElement): void {
  const current = getMappings();
  const existingRows = listEl.querySelectorAll<HTMLDivElement>(".mapping-row");

  // If the set of IDs changed (add/remove/reorder/import), do a full rebuild
  const existingIds = Array.from(existingRows, (r) => r.dataset.id);
  const currentIds = current.map((m) => m.id);
  if (
    existingIds.length !== currentIds.length ||
    existingIds.some((id, i) => id !== currentIds[i])
  ) {
    rebuildMappingRows(listEl);
    return;
  }

  for (let i = 0; i < current.length; i++) {
    const mapping = current[i];
    const row = existingRows[i];

    const actionSelect = row.querySelector<HTMLSelectElement>(".mapping-action")!;
    if (document.activeElement !== actionSelect && actionSelect.value !== mapping.action) {
      if (mapping.action && !ACTION_VALUES.has(mapping.action)) {
        let hasOption = false;
        for (const opt of actionSelect.options) {
          if (opt.value === mapping.action) { hasOption = true; break; }
        }
        if (!hasOption) {
          const unknownOpt = document.createElement("option");
          unknownOpt.value = mapping.action;
          unknownOpt.textContent = mapping.action;
          actionSelect.insertBefore(unknownOpt, actionSelect.children[1]);
        }
      }
      actionSelect.value = mapping.action;
    }

    const argsInput = row.querySelector<HTMLInputElement>(".mapping-args")!;
    if (document.activeElement !== argsInput && argsInput.value !== mapping.args) {
      argsInput.value = mapping.args;
      const argHint = getActionHint(mapping.action);
      argsInput.placeholder = argHint || "";
    }

    if (advancedMode) {
      const keysInput = row.querySelector<HTMLInputElement>(".mapping-keys");
      if (keysInput && document.activeElement !== keysInput && keysInput.value !== mapping.keys) {
        keysInput.value = mapping.keys;
      }
    }
  }
}

function rebuildMappingRows(listEl: HTMLElement): void {
  listEl.innerHTML = "";
  for (const mapping of getMappings()) {
    listEl.appendChild(createMappingRow(mapping, advancedMode));
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
  repoLink.href = "https://go.balintb.com/kitty-conf";
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

  const PANELS_KEY = "kitty-conf-panels";
  function loadPanelStates(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(PANELS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  function savePanelState(id: string, open: boolean): void {
    const states = loadPanelStates();
    states[id] = open;
    localStorage.setItem(PANELS_KEY, JSON.stringify(states));
  }
  const panelStates = loadPanelStates();

  for (const category of CATEGORIES) {
    const panelId = category.title;
    const details = document.createElement("details");
    details.className = "controls-group";
    details.open = panelStates[panelId] ?? true;
    const summary = document.createElement("summary");
    summary.textContent = category.title;
    details.appendChild(summary);
    details.addEventListener("toggle", () => {
      savePanelState(panelId, details.open);
    });

    for (const setting of category.settings) {
      details.appendChild(createField(setting));
    }
    controls.appendChild(details);
  }

  const mappingsId = "Key Mappings";
  const mappingsDetails = document.createElement("details");
  mappingsDetails.className = "controls-group";
  mappingsDetails.open = panelStates[mappingsId] ?? true;
  const mappingsSummary = document.createElement("summary");
  mappingsSummary.textContent = "Key Mappings";
  mappingsDetails.appendChild(mappingsSummary);
  mappingsDetails.addEventListener("toggle", () => {
    savePanelState(mappingsId, mappingsDetails.open);
  });

  const advancedToggle = document.createElement("label");
  advancedToggle.className = "mapping-advanced-toggle";
  const advancedCheckbox = document.createElement("input");
  advancedCheckbox.type = "checkbox";
  advancedCheckbox.checked = advancedMode;
  advancedToggle.appendChild(advancedCheckbox);
  advancedToggle.appendChild(document.createTextNode("Advanced mode"));
  mappingsDetails.appendChild(advancedToggle);

  const mappingsList = document.createElement("div");
  mappingsList.className = "mappings-list";
  mappingsDetails.appendChild(mappingsList);

  advancedCheckbox.addEventListener("change", () => {
    advancedMode = advancedCheckbox.checked;
    localStorage.setItem(ADVANCED_KEY, advancedMode ? "1" : "0");
    rebuildMappingRows(mappingsList);
  });

  const addMappingBtn = document.createElement("button");
  addMappingBtn.type = "button";
  addMappingBtn.textContent = "+ Add mapping";
  addMappingBtn.className = "btn-secondary";
  addMappingBtn.addEventListener("click", () => {
    addMapping({ id: crypto.randomUUID(), keys: "", action: "", args: "" });
  });
  mappingsDetails.appendChild(addMappingBtn);

  controls.appendChild(mappingsDetails);

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

  const icon = (svg: string, title: string): string =>
    `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>${title}</title>${svg}</svg>`;

  const checkIcon = icon('<polyline points="20 6 9 17 4 12"/>', "Done");

  function flashSuccess(btn: HTMLButtonElement, originalHtml: string, tooltip: string): void {
    btn.innerHTML = checkIcon;
    btn.classList.add("btn-success");
    btn.title = tooltip;
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.classList.remove("btn-success");
      btn.title = btn.dataset.title ?? "";
    }, 1500);
  }

  function flashError(btn: HTMLButtonElement, tooltip: string): void {
    btn.classList.add("btn-error");
    btn.title = tooltip;
    setTimeout(() => {
      btn.classList.remove("btn-error");
      btn.title = btn.dataset.title ?? "";
    }, 1500);
  }

  const importSvg = icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', "Import");
  const importBtn = document.createElement("button");
  importBtn.innerHTML = importSvg;
  importBtn.className = "btn-icon btn-secondary";
  importBtn.title = "Import";
  importBtn.dataset.title = "Import";

  const resetBtn = document.createElement("button");
  resetBtn.innerHTML = icon('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>', "Reset");
  resetBtn.className = "btn-icon btn-secondary";
  resetBtn.title = "Reset";
  resetBtn.dataset.title = "Reset";
  resetBtn.addEventListener("click", () => {
    resetAll();
  });

  const shareSvg = icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', "Share");
  const shareBtn = document.createElement("button");
  shareBtn.innerHTML = shareSvg;
  shareBtn.className = "btn-icon btn-secondary";
  shareBtn.title = "Share";
  shareBtn.dataset.title = "Share";
  shareBtn.addEventListener("click", async () => {
    const url = await buildShareUrl();
    if (!url.includes("#")) {
      flashError(shareBtn, "Nothing to share");
      return;
    }
    if (url.length > 2000) {
      flashError(shareBtn, "URL too long");
      return;
    }
    const ok = await copyToClipboard(url);
    if (ok) flashSuccess(shareBtn, shareSvg, "Link copied!");
    else flashError(shareBtn, "Failed");
  });

  const copySvg = icon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', "Copy");
  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = copySvg;
  copyBtn.className = "btn-icon btn-secondary";
  copyBtn.title = "Copy";
  copyBtn.dataset.title = "Copy";
  copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(codeEl.textContent ?? "");
    if (ok) flashSuccess(copyBtn, copySvg, "Copied!");
    else flashError(copyBtn, "Failed");
  });

  const downloadSvg = icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', "Download");
  const downloadBtn = document.createElement("button");
  downloadBtn.innerHTML = downloadSvg;
  downloadBtn.className = "btn-icon btn-secondary";
  downloadBtn.title = "Download";
  downloadBtn.dataset.title = "Download";
  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([codeEl.textContent ?? ""], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kitty.conf";
    a.click();
    URL.revokeObjectURL(a.href);
    flashSuccess(downloadBtn, downloadSvg, "Downloaded!");
  });

  buttons.appendChild(importBtn);
  buttons.appendChild(shareBtn);
  buttons.appendChild(resetBtn);
  buttons.appendChild(shareBtn);
  buttons.appendChild(copyBtn);
  buttons.appendChild(downloadBtn);
  outputHeader.appendChild(h2);
  outputHeader.appendChild(buttons);
  output.appendChild(outputHeader);

  const permalinkRow = document.createElement("label");
  permalinkRow.className = "permalink-toggle";
  const permalinkCheckbox = document.createElement("input");
  permalinkCheckbox.type = "checkbox";
  permalinkCheckbox.checked = localStorage.getItem("kitty-conf-permalink") === "1";
  permalinkCheckbox.addEventListener("change", () => {
    localStorage.setItem("kitty-conf-permalink", permalinkCheckbox.checked ? "1" : "0");
    syncAll();
  });
  const permalinkLabel = document.createTextNode("Include permalink in config");
  permalinkRow.appendChild(permalinkCheckbox);
  permalinkRow.appendChild(permalinkLabel);
  output.appendChild(permalinkRow);

  const importSection = document.createElement("div");
  importSection.className = "import-section hidden";

  const importTabs = document.createElement("div");
  importTabs.className = "import-tabs";

  const pastePanel = document.createElement("div");
  pastePanel.className = "import-panel";
  const importTextarea = document.createElement("textarea");
  importTextarea.placeholder = "Paste your kitty.conf here...";
  importTextarea.rows = 8;
  pastePanel.appendChild(importTextarea);

  const filePanel = document.createElement("div");
  filePanel.className = "import-panel hidden";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".conf,.txt";
  filePanel.appendChild(fileInput);

  const urlPanel = document.createElement("div");
  urlPanel.className = "import-panel hidden";
  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.placeholder = "https://github.com/user/repo/blob/main/kitty.conf";
  urlInput.className = "import-url-input";
  urlPanel.appendChild(urlInput);

  const panels = [pastePanel, filePanel, urlPanel];
  const tabLabels = ["Paste", "File", "URL"];
  const tabBtns: HTMLButtonElement[] = [];

  for (let i = 0; i < tabLabels.length; i++) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.textContent = tabLabels[i];
    tab.className = i === 0 ? "import-tab active" : "import-tab";
    tab.addEventListener("click", () => {
      for (const t of tabBtns) t.classList.remove("active");
      tab.classList.add("active");
      for (const p of panels) p.classList.add("hidden");
      panels[i].classList.remove("hidden");
    });
    tabBtns.push(tab);
    importTabs.appendChild(tab);
  }

  importSection.appendChild(importTabs);
  for (const p of panels) importSection.appendChild(p);

  const importActions = document.createElement("div");
  importActions.className = "import-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "btn-secondary";
  cancelBtn.addEventListener("click", () => {
    importTextarea.value = "";
    urlInput.value = "";
    fileInput.value = "";
    importSection.classList.add("hidden");
  });

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";

  function applyConfig(text: string): void {
    resetAll();
    const count = parseConfig(text);
    applyBtn.textContent = `Applied ${count} settings`;
    setTimeout(() => { applyBtn.textContent = "Apply"; }, 1500);
    importTextarea.value = "";
    urlInput.value = "";
    fileInput.value = "";
    importSection.classList.add("hidden");
  }

  function toRawGitHub(url: string): string | null {
    const blob = url.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)/,
    );
    if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
    const raw = url.match(
      /^https?:\/\/raw\.githubusercontent\.com\/.+/,
    );
    if (raw) return url;
    return null;
  }

  applyBtn.addEventListener("click", async () => {
    const activeIdx = tabBtns.findIndex((t) => t.classList.contains("active"));
    if (activeIdx === 0) {
      applyConfig(importTextarea.value);
    } else if (activeIdx === 1) {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      applyConfig(text);
    } else if (activeIdx === 2) {
      const raw = urlInput.value.trim();
      if (!raw) return;
      const fetchUrl = toRawGitHub(raw);
      if (!fetchUrl) {
        applyBtn.textContent = "GitHub URLs only";
        setTimeout(() => { applyBtn.textContent = "Apply"; }, 1500);
        return;
      }
      applyBtn.textContent = "Fetching...";
      try {
        const resp = await fetch(fetchUrl);
        if (!resp.ok) throw new Error(resp.statusText);
        const text = await resp.text();
        applyConfig(text);
      } catch {
        applyBtn.textContent = "Fetch failed";
        setTimeout(() => { applyBtn.textContent = "Apply"; }, 1500);
      }
    }
  });

  importActions.appendChild(cancelBtn);
  importActions.appendChild(applyBtn);
  importSection.appendChild(importActions);
  output.appendChild(importSection);

  importBtn.addEventListener("click", () => {
    importSection.classList.toggle("hidden");
    if (!importSection.classList.contains("hidden")) {
      const activeIdx = tabBtns.findIndex((t) => t.classList.contains("active"));
      if (activeIdx === 0) importTextarea.focus();
      else if (activeIdx === 2) urlInput.focus();
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

  const projectLinks = document.createElement("div");
  projectLinks.className = "footer-projects";
  const kittyLink2 = document.createElement("a");
  kittyLink2.href = "https://kitty-conf.balintb.com/";
  kittyLink2.textContent = "kitty-conf";
  kittyLink2.className = "footer-project active";
  const wezLink2 = document.createElement("a");
  wezLink2.href = "https://wez-conf.balintb.com/";
  wezLink2.target = "_blank";
  wezLink2.rel = "noopener";
  wezLink2.textContent = "wez-conf";
  wezLink2.className = "footer-project";
  projectLinks.appendChild(kittyLink2);
  projectLinks.appendChild(wezLink2);
  footer.appendChild(projectLinks);

  const footerText = document.createElement("code");
  footerText.textContent = "$ made with <3 | ";
  footer.appendChild(footerText);
  const footerLink = document.createElement("a");
  footerLink.href = "https://go.balintb.com/jXeIxM";
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
      const setting = SETTINGS_MAP.get(key);
      if (setting && val !== setting.default) {
        el.classList.toggle("invalid", !isValid(setting, val));
      } else {
        el.classList.remove("invalid");
      }
    }
    for (const [key, picker] of colorPickers) {
      const val = getValue(key);
      if (/^#[0-9a-fA-F]{6}$/.test(val) && picker.value !== val) {
        picker.value = val;
      }
    }
    syncMappingsList(mappingsList);
    const config = generateConfig();
    if (permalinkCheckbox.checked) {
      const base = location.href.split("#")[0];
      codeEl.textContent = config.replace(
        /^(# Generated by .*\n)/,
        `$1# Permalink: ${base}#c=\n`,
      );
      buildShareUrl().then((url) => {
        if (url.includes("#")) {
          codeEl.textContent = config.replace(
            /^(# Generated by .*\n)/,
            `$1# Permalink: ${url}\n`,
          );
        } else {
          codeEl.textContent = config;
        }
      });
    } else {
      codeEl.textContent = config;
    }
  }

  subscribe(syncAll);
  syncAll();
}
