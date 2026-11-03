import * as React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Gust } from "../../src/gust";
import type { GustProps, GustTag } from "../../src/gust";

let host: HTMLElement | null = null;
const ref = (element: HTMLElement | null) => {
  host = element;
};
const container = document.getElementById("app")!;
const hydration = new URL(location.href).searchParams.get("hydrate");
const root = hydration
  ? hydrateRoot(
      container,
      <React.StrictMode>
        <Gust {...JSON.parse(hydration)} ref={ref} />
      </React.StrictMode>,
    )
  : createRoot(container);
const render = (props: GustProps<GustTag>) => {
  flushSync(() =>
    root.render(
      <React.StrictMode>
        <Gust {...props} ref={ref} />
      </React.StrictMode>,
    ),
  );
};

Object.assign(window, {
  gustTest: {
    render,
    unmount() {
      flushSync(() => root.unmount());
    },
    get host() {
      return host;
    },
    finish() {
      document.getAnimations().forEach((animation) => animation.finish());
    },
  },
});
