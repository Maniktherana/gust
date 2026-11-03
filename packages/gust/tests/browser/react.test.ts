import { afterAll, beforeAll, expect, test } from "bun:test";
import { chromium, firefox, webkit } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import * as React from "react";
import { Gust } from "../../src/gust";
import type { GustProps, GustTag } from "../../src/gust";
type AnyGustProps = GustProps<GustTag>;

declare global {
  interface Window {
    gustResources: { listeners: number; observers: number };
    gustTest: {
      render(props: AnyGustProps): void;
      unmount(): void;
      finish(): void;
      host: HTMLElement | null;
    };
  }
}

let browser: Browser;
let server: ReturnType<typeof Bun.serve>;
let script: string;

beforeAll(async () => {
  const consumer = fileURLToPath(new URL("../../../../apps/site", import.meta.url));
  const consumerRequire = createRequire(`${consumer}/package.json`);
  const { renderToString } = consumerRequire("react-dom/server") as {
    renderToString(element: React.ReactElement): string;
  };
  const build = await Bun.build({
    entrypoints: [fileURLToPath(new URL("harness.tsx", import.meta.url))],
    target: "browser",
    loader: { ".css": "text" },
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [
      {
        name: "consumer-assets",
        setup(builder) {
          builder.onResolve({ filter: /^react-dom(?:\/client)?$/ }, ({ path }) => ({
            path: Bun.resolveSync(path, consumer),
          }));
          builder.onResolve({ filter: /\.css\?inline$/ }, ({ path, importer }) => ({
            path: resolve(dirname(importer), path.replace(/\?inline$/, "")),
          }));
        },
      },
    ],
  });
  if (!build.success) throw new Error(build.logs.join("\n"));
  script = await build.outputs[0].text();
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/app.js")
        return new Response(script, { headers: { "Content-Type": "text/javascript" } });
      const hydration = url.searchParams.get("hydrate");
      const content = hydration
        ? renderToString(React.createElement(Gust, JSON.parse(hydration)))
        : "";
      return new Response(
        `<!doctype html><html><head></head><body><div id="app">${content}</div><script src="/app.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    },
  });
  const engine = process.env.GUST_BROWSER ?? "chromium";
  const launcher = engine === "webkit" ? webkit : engine === "firefox" ? firefox : chromium;
  browser = await launcher.launch(
    process.env.GUST_BROWSER_CHANNEL ? { channel: process.env.GUST_BROWSER_CHANNEL } : {},
  );
});

afterAll(async () => {
  await browser?.close();
  await server?.stop();
});

async function pageWith(props: AnyGustProps) {
  const page = await browser.newPage();
  await page.goto(server.url.toString());
  await page.evaluate((props) => window.gustTest.render(props), props);
  return page;
}

async function render(page: Page, props: AnyGustProps) {
  await page.evaluate((props) => window.gustTest.render(props), props);
}

async function finish(page: Page) {
  await page.evaluate(() => window.gustTest.finish());
  await page.waitForFunction(
    () =>
      document.getAnimations().length === 0 &&
      document.querySelector('[data-gust-part="exit-batch"]') === null,
  );
}

test("SSR hydrates escaped text without mismatches or entrance animations", async () => {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const url = new URL(server.url);
  url.searchParams.set(
    "hydrate",
    JSON.stringify({ children: " <strong>👩🏽‍💻 & text ", as: "h2", nonce: "nonce-test" }),
  );
  await page.goto(url.toString());
  await page.waitForFunction(() => window.gustTest.host !== null);
  expect(errors).toEqual([]);
  expect(await page.locator('[data-gust-part="sr-only"]').textContent()).toBe(
    " <strong>👩🏽‍💻 & text ",
  );
  expect(await page.locator("strong").count()).toBe(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.close();
});

test("initial text is static, consumer refs and layout belong to the semantic outer host", async () => {
  const page = await pageWith({
    as: "p",
    children: "  first  ",
    id: "copy",
    style: { width: 300, color: "rgb(20, 30, 40)" },
  });
  const result = await page.evaluate(() => {
    const host = window.gustTest.host!;
    const motion = host.querySelector<HTMLElement>('[data-gust-part="motion"]')!;
    return {
      tag: host.tagName,
      id: host.id,
      width: host.getBoundingClientRect().width,
      motionWidth: motion.getBoundingClientRect().width,
      color: getComputedStyle(motion).color,
      animations: document.getAnimations().length,
      text: host.querySelector('[data-gust-part="sr-only"]')?.textContent,
      glyphs: Array.from(
        host.querySelectorAll('[data-gust-part="glyph"]'),
        (glyph) => glyph.textContent,
      ).join(""),
    };
  });
  expect(result).toMatchObject({
    tag: "P",
    id: "copy",
    width: 300,
    color: "rgb(20, 30, 40)",
    animations: 0,
    text: "  first  ",
    glyphs: "  first  ",
  });
  expect(result.motionWidth).toBeLessThan(300);
  await page.close();
});

test("shifted suffix glyphs retain their node and in-flight entrance across simultaneous config updates", async () => {
  const page = await pageWith({ children: "" });
  await render(page, { children: "tail", motion: { duration: 1000 } });
  const glyph = await page.locator('[data-gust-part="glyph"]').first().elementHandle();
  const entrance = await glyph!.evaluateHandle((node) => {
    const animation = node.getAnimations()[0];
    animation.pause();
    animation.currentTime = 120;
    return animation;
  });
  await render(page, { children: "long tail", motion: { duration: 2000, enterAngle: 45 } });
  expect(
    await glyph!.evaluate(
      (node) => node.isConnected && node.getAttribute("data-gust-index") === "5",
    ),
  ).toBe(true);
  expect(
    await entrance.evaluate((animation) => ({
      time: animation.currentTime,
      state: animation.playState,
    })),
  ).toEqual({ time: 120, state: "paused" });
  expect(await page.locator('[data-gust-part="exit"]').count()).toBe(0);
  await finish(page);
  expect(await page.locator('[data-gust-part="exit-batch"]').count()).toBe(0);
  await page.close();
});

test("only the changed middle exits, including repeated and grapheme-cluster edges", async () => {
  const page = await pageWith({ children: "$1,234.00" });
  await render(page, { children: "$1,235.00", motion: { duration: 1000, exitDuration: 1000 } });
  expect(await page.locator('[data-gust-part="exit"]').allTextContents()).toEqual(["4"]);
  await finish(page);
  await render(page, { children: "👩🏽‍💻 one é" });
  await finish(page);
  await render(page, { children: "👩🏽‍💻 two é", motion: { duration: 1000, exitDuration: 1000 } });
  expect(await page.locator('[data-gust-part="exit"]').allTextContents()).toEqual(["o", "n", "e"]);
  await finish(page);
  await page.close();
});

test("rapid replacements remove completed exits and release every animation", async () => {
  const page = await pageWith({ children: "first" });
  await render(page, { children: "second", motion: { duration: 2000, exitDuration: 2000 } });
  await render(page, { children: "third", motion: { duration: 2000, exitDuration: 2000 } });
  expect(await page.locator('[data-gust-part="exit-batch"]').count()).toBe(2);
  await finish(page);
  expect(await page.locator('[data-gust-part="exit"]').count()).toBe(0);
  expect(await page.locator('[data-gust-part="exit-carry"]').count()).toBe(0);
  expect(await page.locator('[data-gust-part="sr-only"]').textContent()).toBe("third");
  await page.close();
});

test("reduced-motion changes settle the unchanged value and do not replay on re-enable", async () => {
  const page = await pageWith({ children: "first" });
  await render(page, { children: "second", motion: { duration: 2000, exitDuration: 2000 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.getAnimations().length === 0);
  expect(await page.locator('[data-gust-part="exit"]').count()).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await render(page, { children: "second", motion: { duration: 300 } });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.close();
});

test("hidden documents and animated=false settle active work without a text change", async () => {
  const page = await pageWith({ children: "first" });
  await render(page, { children: "second", motion: { duration: 2000 } });
  await render(page, { children: "second", animated: false });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(await page.locator('[data-gust-part="exit"]').count()).toBe(0);
  await render(page, { children: "third", motion: { duration: 2000 } });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(await page.locator('[data-gust-part="exit"]').count()).toBe(0);
  await page.close();
});

test("author timing, reverse stagger, layout easing, and transform origin reach native effects", async () => {
  const page = await pageWith({ children: "A tail" });
  await render(page, {
    children: "BC tail",
    duration: 2000,
    motion: {
      duration: 440,
      exitDuration: 400,
      enterDelay: 80,
      exitDelay: 50,
      staggerMode: "fixed",
      enterStagger: 20,
      exitStagger: 10,
      staggerDirection: "reverse",
      layoutDuration: 120,
      layoutEasing: "linear",
      transformOrigin: "bottom",
    },
  });
  const timings = await page.evaluate(() => {
    document.getAnimations().forEach((animation) => animation.pause());
    const glyphs = Array.from(document.querySelectorAll<HTMLElement>('[data-gust-part="glyph"]'));
    const entering = glyphs.filter((glyph) => glyph.getAnimations().length > 0);
    const layout = Array.from(document.querySelectorAll('[data-gust-part="slot"]')).flatMap(
      (slot) => slot.getAnimations(),
    )[0];
    const exit = document.querySelector('[data-gust-part="exit"]')!;
    return {
      enters: entering.map(
        (glyph) =>
          glyph
            .getAnimations()
            .find(
              (animation) =>
                (animation.effect as KeyframeEffect).getKeyframes()[0].transform !== undefined,
            )
            ?.effect?.getTiming().duration,
      ),
      origin: entering.map((glyph) => glyph.style.transformOrigin),
      exit: exit.getAnimations()[0].effect?.getTiming().duration,
      layout: layout.effect?.getTiming(),
    };
  });
  expect(timings.enters).toEqual([540, 520]);
  expect(timings.origin).toEqual(["center bottom", "center bottom"]);
  expect(timings.exit).toBe(450);
  expect(timings.layout).toMatchObject({ duration: 120, easing: "linear" });
  await page.close();
});

test("bounded stagger reaches native effects using only changed non-whitespace glyphs", async () => {
  for (const spread of [undefined, 0, 1.5]) {
    const page = await pageWith({ children: "A B tail" });
    await render(page, {
      children: "C D E tail",
      motion: {
        duration: 1000,
        exitDuration: 2000,
        enterDelay: 40,
        exitDelay: 80,
        staggerSpread: spread,
      },
    });
    const timings = await page.evaluate(() => {
      document.getAnimations().forEach((animation) => animation.pause());
      const glyphs = Array.from(document.querySelectorAll<HTMLElement>('[data-gust-part="glyph"]'));
      const entrances = glyphs.flatMap((glyph) =>
        glyph
          .getAnimations()
          .filter(
            (animation) =>
              (animation.effect as KeyframeEffect).getKeyframes()[0].transform !== undefined,
          )
          .map((animation) => ({
            text: glyph.textContent,
            duration: animation.effect!.getTiming().duration,
          })),
      );
      const exits = Array.from(document.querySelectorAll('[data-gust-part="exit"]'), (glyph) => ({
        text: glyph.textContent,
        duration: glyph.getAnimations()[0].effect!.getTiming().duration,
      }));
      return {
        entrances,
        exits,
        spacesStable: glyphs
          .filter((glyph) => /^\s+$/u.test(glyph.textContent!))
          .every((glyph) => glyph.dataset.gustStable === "true"),
        layout: Array.from(document.querySelectorAll('[data-gust-part="slot"]'))
          .flatMap((slot) => slot.getAnimations())[0]
          .effect!.getTiming().duration,
      };
    });
    const fraction = spread ?? 0.3;
    expect(timings.entrances).toEqual([
      { text: "C", duration: 1040 },
      { text: "D", duration: 1040 + (1000 * fraction) / 3 },
      { text: "E", duration: 1040 + (2 * 1000 * fraction) / 3 },
    ]);
    expect(timings.exits).toEqual([
      { text: "A", duration: 2080 },
      { text: "B", duration: 2080 + (2000 * fraction) / 2 },
    ]);
    expect(timings.spacesStable).toBe(true);
    expect(timings.layout).toBe(1040 + (2 * 1000 * fraction) / 3);
    await page.close();
  }
});

test("bounded exit-only batches exclude whitespace without scheduling an empty layout effect", async () => {
  const page = await pageWith({ children: "A B" });
  await render(page, {
    children: " ",
    motion: { duration: 1000, exitDuration: 2000, exitDelay: 80, preserveMatching: false },
  });
  const timings = await page.evaluate(() => {
    document.getAnimations().forEach((animation) => animation.pause());
    return {
      exits: Array.from(document.querySelectorAll('[data-gust-part="exit"]'), (glyph) => ({
        text: glyph.textContent,
        duration: glyph.getAnimations()[0].effect!.getTiming().duration,
      })),
      entranceCount: Array.from(document.querySelectorAll('[data-gust-part="glyph"]'))
        .flatMap((glyph) => glyph.getAnimations())
        .filter(
          (animation) =>
            (animation.effect as KeyframeEffect).getKeyframes()[0].transform !== undefined,
        ).length,
      layoutCount: Array.from(
        document.querySelectorAll('[data-gust-part="slot"], [data-gust-part="motion"]'),
      ).flatMap((element) => element.getAnimations()).length,
    };
  });
  expect(timings.exits).toEqual([
    { text: "A", duration: 2080 },
    { text: "B", duration: 2380 },
  ]);
  expect(timings.entranceCount).toBe(0);
  expect(timings.layoutCount).toBe(0);
  await page.close();
});

test("font loading events preserve active motion when text metrics are unchanged", async () => {
  const page = await pageWith({ children: "Agentsims" });
  await render(page, { children: "Gust", motion: { duration: 2000, exitDuration: 2000 } });
  const result = await page.evaluate(() => {
    const animations = document.getAnimations();
    animations.forEach((animation) => animation.pause());
    document.fonts.dispatchEvent(new Event("loadingdone"));
    return {
      count: animations.length,
      preserved: animations.every((animation) => animation.playState === "paused"),
    };
  });
  expect(result.count).toBeGreaterThan(0);
  expect(result.preserved).toBe(true);
  await page.close();
});

test("ancestor scale changes do not turn a pending resize notification into a text resize", async () => {
  const page = await pageWith({ children: "Copy prompt" });
  const result = await page.evaluate(async () => {
    const parent = document.getElementById("app")!;
    parent.style.transform = "scale(0.96)";
    window.gustTest.render({
      children: "Prompt copied",
      motion: { duration: 2000, exitDuration: 2000 },
    });
    const animations = document.getAnimations();
    animations.forEach((animation) => animation.pause());
    parent.style.transform = "scale(1)";
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return {
      count: animations.length,
      preserved: animations.every((animation) => animation.playState === "paused"),
    };
  });
  expect(result.count).toBeGreaterThan(0);
  expect(result.preserved).toBe(true);
  await page.close();
});

test("center/right alignment and scaled ancestors keep vertical entrances and exits anchored", async () => {
  for (const alignment of ["center", "right"] as const) {
    for (const scale of [0.8, 1, 2.5]) {
      const page = await pageWith({ children: "1", style: { fontSize: 24 } });
      await page.evaluate(
        ({ alignment, scale }) => {
          const app = document.getElementById("app")!;
          Object.assign(app.style, {
            width: "300px",
            textAlign: alignment,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          });
        },
        { alignment, scale },
      );
      const oldX = await page
        .locator('[data-gust-part="glyph"]')
        .evaluate((glyph) => glyph.getBoundingClientRect().left);
      await render(page, {
        children: "22",
        style: { fontSize: 24 },
        motion: { scale: false, blur: false },
      });
      const samples = await page.evaluate(async () => {
        const animations = document.getAnimations();
        const geometryAnimated = animations.some((animation) =>
          (animation.effect as KeyframeEffect)
            .getKeyframes()
            .some((frame) =>
              ["width", "height", "left", "top"].some((property) => property in frame),
            ),
        );
        if (geometryAnimated)
          throw new Error("Text transitions must not animate layout properties");
        animations.forEach((animation) => animation.pause());
        const glyph = document.querySelector('[data-gust-part="glyph"]')!;
        const exit = document.querySelector('[data-gust-part="exit"]')!;
        const samples = [];
        for (const time of [0, 16, 80, 160, 240]) {
          animations.forEach((animation) => {
            animation.currentTime = time;
          });
          await new Promise(requestAnimationFrame);
          samples.push({
            enter: glyph.getBoundingClientRect().left,
            exit: exit.getBoundingClientRect().left,
            width: document.querySelector('[data-gust-part="motion"]')!.getBoundingClientRect()
              .width,
            naturalWidth: document
              .querySelector('[data-gust-part="sizer"]')!
              .getBoundingClientRect().width,
          });
        }
        return samples;
      });
      for (const sample of samples) {
        expect(Math.abs(sample.enter - samples[0].enter)).toBeLessThan(0.15);
        expect(Math.abs(sample.exit - oldX)).toBeLessThan(0.15);
        expect(Math.abs(sample.width - sample.naturalWidth)).toBeLessThan(0.15);
      }
      await page.close();
    }
  }
});

test("a shifted suffix starts at its live position when a second layout transition interrupts", async () => {
  const page = await pageWith({ children: "a", style: { fontFamily: "monospace", fontSize: 24 } });
  await page.evaluate(() => {
    Object.assign(document.getElementById("app")!.style, {
      width: "300px",
      textAlign: "right",
      transform: "scale(0.8)",
    });
  });
  const props = {
    style: { fontFamily: "monospace", fontSize: 24 },
    motion: { layoutDuration: 1000, scale: false },
  };
  await render(page, { ...props, children: "Xa" });
  const before = await page.evaluate(async () => {
    document.getAnimations().forEach((animation) => {
      animation.pause();
      animation.currentTime = 100;
    });
    await new Promise(requestAnimationFrame);
    return document.querySelector('[data-gust-character="a"]')!.getBoundingClientRect().left;
  });
  await render(page, { ...props, children: "long Xa" });
  const after = await page.evaluate(async () => {
    document.getAnimations().forEach((animation) => {
      if (animation.playState !== "paused") {
        animation.pause();
        animation.currentTime = 0;
      }
    });
    await new Promise(requestAnimationFrame);
    return document.querySelector('[data-gust-character="a"]')!.getBoundingClientRect().left;
  });
  expect(Math.abs(after - before)).toBeLessThan(0.15);
  await page.close();
});

test("native inline bidi ordering survives direction changes and mixed numeric text", async () => {
  const page = await pageWith({ children: "אב 12 cd", dir: "rtl" });
  for (const dir of ["rtl", "ltr"] as const) {
    await render(page, { children: "אב 12 cd", dir });
    const errors = await page.evaluate(() => {
      const sizer = document.querySelector('[data-gust-part="sizer"]')!;
      const text = sizer.firstChild!;
      return Array.from(document.querySelectorAll('[data-gust-part="slot"]'), (slot, index) => {
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        return Math.abs(slot.getBoundingClientRect().left - range.getBoundingClientRect().left);
      });
    });
    expect(Math.max(...errors), `${dir}: ${JSON.stringify(errors)}`).toBeLessThan(0.2);
  }
  await page.close();
});

test("typography changes remeasure an unchanged value and settle active layout", async () => {
  const page = await pageWith({ children: "before" });
  await render(page, { children: "after", motion: { duration: 2000, layoutDuration: 2000 } });
  await render(page, { children: "after", style: { fontSize: 32, letterSpacing: 2 } });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  const positions = await page.evaluate(() => {
    const range = document.createRange();
    const text = document.querySelector('[data-gust-part="sizer"]')!.firstChild!;
    range.setStart(text, 2);
    range.setEnd(text, 3);
    return {
      expected: range.getBoundingClientRect().left,
      actual: document.querySelector('[data-gust-index="2"]')!.getBoundingClientRect().left,
    };
  });
  expect(Math.abs(positions.actual - positions.expected)).toBeLessThan(0.15);
  await page.close();
});

test("StrictMode and unmount balance every observer and environmental listener", async () => {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const subscriptions: {
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject | null;
    }[] = [];
    const observed = new Set<ResizeObserver>();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (
        type === "visibilitychange" ||
        type === "loadingdone" ||
        (this instanceof MediaQueryList && type === "change")
      ) {
        subscriptions.push({ target: this, type, listener });
      }
      if (listener) add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      const index = subscriptions.findIndex(
        (entry) => entry.target === this && entry.type === type && entry.listener === listener,
      );
      if (index !== -1) subscriptions.splice(index, 1);
      if (listener) remove.call(this, type, listener, options);
    };
    const NativeObserver = ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      observe(target: Element, options?: ResizeObserverOptions) {
        observed.add(this);
        super.observe(target, options);
      }
      disconnect() {
        observed.delete(this);
        super.disconnect();
      }
    };
    window.gustResources = {
      get listeners() {
        return subscriptions.length;
      },
      get observers() {
        return observed.size;
      },
    };
  });
  await page.goto(server.url.toString());
  await render(page, { children: "initial" });
  expect(await page.evaluate(() => ({ ...window.gustResources }))).toEqual({
    listeners: 3,
    observers: 1,
  });
  await render(page, { children: "next" });
  await render(page, { children: "again" });
  expect(await page.evaluate(() => ({ ...window.gustResources }))).toEqual({
    listeners: 3,
    observers: 1,
  });
  await page.evaluate(() => window.gustTest.unmount());
  expect(await page.evaluate(() => ({ ...window.gustResources }))).toEqual({
    listeners: 0,
    observers: 0,
  });
  await page.close();
});

test("unmount cancels live native effects and clears forwarded refs after StrictMode replay", async () => {
  const page = await pageWith({ children: "first" });
  await render(page, { children: "second", motion: { duration: 2000, exitDuration: 2000 } });
  const states = await page.evaluate(() => {
    const animations = document.getAnimations();
    window.gustTest.unmount();
    return {
      states: animations.map((animation) => animation.playState),
      ref: window.gustTest.host,
    };
  });
  expect(states.states.length).toBeGreaterThan(0);
  expect(states.states.every((state) => state === "idle")).toBe(true);
  expect(states.ref).toBeNull();
  await page.close();
});
