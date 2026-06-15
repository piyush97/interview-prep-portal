import { StrictMode, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import { getTheme } from "./store";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

declare global {
  interface Window {
    __INTERVIEW_PREP_ROOT__?: Root;
  }
}

function applyTheme() {
  const theme = getTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

// Listen for OS theme changes (handles "system" mode + macOS auto-switch)
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

function KeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    applyTheme();
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const routes: Record<string, string> = {
          d: "/",
          a: "/applications",
          i: "/interviews",
          s: "/skills",
          f: "/flashcards",
          r: "/resources",
          e: "/evaluate",
          o: "/offers",
          j: "/journal",
          ",": "/settings",
        };
        if (routes[e.key.toLowerCase()]) {
          e.preventDefault();
          navigate(routes[e.key.toLowerCase()]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
  return null;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* ignore */ });
  });
}

const container = document.getElementById("root")!;
const root = window.__INTERVIEW_PREP_ROOT__ ?? createRoot(container);
window.__INTERVIEW_PREP_ROOT__ = root;

root.render(
  <StrictMode>
    <BrowserRouter basename={routerBasename || undefined}>
      <KeyboardShortcuts />
      <App />
    </BrowserRouter>
  </StrictMode>
);
