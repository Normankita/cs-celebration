import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./launch.css";
import "./app.css";
import "./transitions.css";

// Browsers without View Transitions get a CSS fallback (see transitions.css)
if (!document.startViewTransition) document.documentElement.classList.add("no-vt");

createRoot(document.getElementById("root")).render(<App />);
