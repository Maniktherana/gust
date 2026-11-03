import { expect, test } from "bun:test";
import * as React from "react";
import { createRequire } from "node:module";
import { Gust, resolveTrendConfig } from "../src/gust";
import type { GustProps } from "../src/gust";

// React DOM is provided by the workspace's consumer, not a Gust runtime dependency.
const consumerRequire = createRequire(new URL("../../../apps/site/package.json", import.meta.url));
const { renderToStaticMarkup } = consumerRequire("react-dom/server") as {
  renderToStaticMarkup(element: React.ReactElement): string;
};

test("SSR renders escaped real text, semantic attributes, and automatic nonce styles", () => {
  const html = renderToStaticMarkup(
    React.createElement(Gust, {
      as: "h2",
      children: " <script>& hi ",
      className: "title",
      id: "heading",
      style: { color: "red", width: 200 },
      nonce: "test-nonce",
      "aria-live": "polite",
    }),
  );
  expect(
    html.startsWith(
      '<h2 class="title" id="heading" style="color:red;width:200px" aria-live="polite" data-slot="gust">',
    ),
  ).toBe(true);
  expect(html).toContain('<style data-gust-styles="" nonce="test-nonce">');
  expect(html).toContain(':where([data-gust-part="motion"])');
  expect(html).toContain('<span data-gust-part="sr-only"> &lt;script&gt;&amp; hi </span>');
  expect(html).toContain('data-gust-part="motion"');
  expect(html).not.toContain('role="img"');
  expect(html).not.toContain('data-animated="true"');
  expect(html).not.toContain("<script>");
  expect(html.match(/<span data-gust-part="sr-only"/g)).toHaveLength(1);
});

test("children accept zero, and the published value input remains compatible", () => {
  expect(renderToStaticMarkup(React.createElement(Gust, { children: 0 }))).toContain(
    'data-gust-part="sr-only">0</span>',
  );
  expect(renderToStaticMarkup(React.createElement(Gust, { value: "legacy" }))).toContain(
    'data-gust-part="sr-only">legacy</span>',
  );
});

test("invalid runtime inputs are rejected instead of being stringified", () => {
  const render = (props: unknown) =>
    renderToStaticMarkup(React.createElement(Gust, props as GustProps));
  expect(() => render({ children: "a", value: "b" })).toThrow("either children or value");
  expect(() => render({ children: React.createElement("em", null, "rich") })).toThrow(
    "string or number",
  );
  expect(() => render({ children: "plain", dangerouslySetInnerHTML: { __html: "html" } })).toThrow(
    "plain text",
  );
});

test("automatic direction compares only raw finite numbers", () => {
  const resolve = (before: string | number, after: string | number) =>
    resolveTrendConfig({}, before, after, "auto", false);
  expect(resolve(10, 9).enterAngle).toBe(90);
  expect(resolve(9, 10).enterAngle).toBe(-90);
  expect(resolve("10", "9").enterAngle).toBe(-90);
  expect(resolve("$10.00", "$9.00").enterAngle).toBe(-90);
  expect(resolve(10, "9").enterAngle).toBe(-90);
  expect(resolve(Infinity, 9).enterAngle).toBe(-90);
  expect(resolve(Number.NaN, 9).enterAngle).toBe(-90);
  expect(resolveTrendConfig({}, 10, 9, "up", true).enterAngle).toBe(-90);
  expect(resolveTrendConfig({}, "a", "b", "auto", true).enterAngle).toBe(90);
  expect(resolveTrendConfig({ enterAngle: 30, exitAngle: 45 }, 10, 9, "down", false)).toMatchObject(
    { enterAngle: 30, exitAngle: 45 },
  );
});

test("explicit direction overrides authored angles and numeric trend", () => {
  for (const [direction, angle] of [
    ["up", -90],
    ["down", 90],
    ["left", -180],
    ["right", 0],
  ] as const) {
    for (const trend of ["auto", "up", "down"] as const) {
      expect(
        resolveTrendConfig({ enterAngle: 30, exitAngle: 45 }, 10, 9, trend, true, direction),
      ).toMatchObject({
        enterAngle: angle,
        exitAngle: angle,
      });
    }
  }
});

test("direction and preservePrefix are consumed rather than forwarded as DOM attributes", () => {
  for (const direction of ["up", "down", "left", "right"] as const) {
    for (const preservePrefix of [false, true]) {
      const props = {
        children: "Text",
        direction,
        preservePrefix,
        motion: { preserveMatching: !preservePrefix },
        "data-testid": "directional-text",
      };
      const html = renderToStaticMarkup(React.createElement(Gust, props));
      expect(html).toContain('data-testid="directional-text"');
      expect(html).not.toMatch(/\s(?:direction|preservePrefix|preservematching|motion)=/i);
    }
  }
});

// Compile-time consumer contracts, without rendering test-only invalid props.
const headingProps: GustProps<"h2"> = {
  children: 42,
  as: "h2",
  onClick: (event) => {
    event.currentTarget.align = "left";
  },
};
const labelProps: GustProps<"label"> = { children: "Price", as: "label", htmlFor: "price" };
const directionalProps: GustProps = {
  children: "Color",
  direction: "left",
  preservePrefix: false,
  motion: { preserveMatching: true },
};
void [headingProps, labelProps, directionalProps];
// @ts-expect-error Exactly one content source is supported.
const conflicting: GustProps = { children: "a", value: "b" };
// @ts-expect-error Rich children are deliberately not supported by the single-line engine.
const rich: GustProps = { children: React.createElement("span") };
void [conflicting, rich];
