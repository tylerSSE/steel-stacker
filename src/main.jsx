import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* Vercel Web Analytics. Auto-tracks page views and visitor counts. No
        configuration needed; reads project ID from the Vercel deployment env.
        Loads asynchronously and won't block render. */}
    <Analytics />
  </React.StrictMode>
);
