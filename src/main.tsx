import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";
const root = document.getElementById("root")!;
const application = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if (root.hasChildNodes() && window.__MRC_INITIAL_SITE_DATA__)
  hydrateRoot(root, application);
else createRoot(root).render(application);
