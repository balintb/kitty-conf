import "./style.css";
import { loadFromUrl, applyPendingUrl, dismissPendingUrl } from "./state";
import { render } from "./ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  loadFromUrl().then((result) => {
    render(app);
    if (result === "conflict") showConflictBanner(app);
  });
}

function showConflictBanner(root: HTMLElement): void {
  const banner = document.createElement("div");
  banner.className = "url-conflict-banner";

  const text = document.createElement("span");
  text.textContent = "A shared config was found in the URL. Import it or keep your current settings?";

  const actions = document.createElement("div");
  actions.className = "url-conflict-actions";

  const importBtn = document.createElement("button");
  importBtn.textContent = "Import shared config";
  importBtn.addEventListener("click", () => {
    applyPendingUrl();
    banner.remove();
  });

  const keepBtn = document.createElement("button");
  keepBtn.textContent = "Keep mine";
  keepBtn.className = "btn-secondary";
  keepBtn.addEventListener("click", () => {
    dismissPendingUrl();
    banner.remove();
  });

  actions.appendChild(importBtn);
  actions.appendChild(keepBtn);
  banner.appendChild(text);
  banner.appendChild(actions);
  root.prepend(banner);
}
