import "./style.css";
import { render } from "./ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) render(app);
