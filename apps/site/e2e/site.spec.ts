import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '[class*="dialkit"] { visibility: hidden !important; }' });
});

test("the header and page share a narrow column", async ({ page }) => {
  await expect(page.locator("header nav a")).toHaveText(["Examples", "Lab", ""]);
  await expect(page.getByRole("link", { name: "GitHub", exact: true })).toBeVisible();
  for (const width of [320, 393, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const box = await page.locator("header").boundingBox();
    expect(box!.width).toBe(Math.min(width - 40, 644));
    expect(box!.x).toBe((width - box!.width) / 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  const appearance = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return {
      background: [...context.getImageData(0, 0, 1, 1).data],
      font: getComputedStyle(document.body).fontFamily,
    };
  });
  expect(appearance.background).toEqual([15, 15, 15, 255]);
  expect(appearance.font).toContain("Open Runde");
  await expect(page.locator(".demo-carousel")).toHaveCount(0);
  await expect(page.locator("article#value")).toHaveCount(0);
});

test("install switches commands without glyph animation or horizontal clipping", async ({
  page,
}) => {
  const install = page.getByRole("region", { name: "Install", exact: true });
  await expect(page.getByRole("group", { name: "Install method" }).getByRole("button")).toHaveText([
    "bun",
    "shadcn",
  ]);
  for (const method of ["shadcn", "bun", "shadcn"]) {
    await page.getByRole("button", { name: method, exact: true }).click();
    await expect(install.locator("code")).toHaveCount(1);
    const code = install.locator("code");
    await expect(code).toContainText(
      method === "bun" ? "bun add @maniktherana/gust" : "https://gust.manikrana.dev/r/gust.json",
    );
    await expect(code.locator('[data-slot="gust"]')).toHaveCount(0);
    await expect
      .poll(() => code.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeLessThanOrEqual(1);
  }
});

test("copy prompt supplies context and keeps its visible label still", async ({ page }) => {
  let copied = "";
  await page.exposeFunction("captureClipboard", (value: string) => {
    copied = value;
  });
  await page.evaluate(() => {
    const capture = (
      window as typeof window & { captureClipboard: (text: string) => Promise<void> }
    ).captureClipboard;
    Object.defineProperty(navigator, "clipboard", { value: { writeText: capture } });
  });
  const button = page.getByRole("button", { name: "Copy prompt", exact: true });
  await expect(button.locator('[data-slot="gust"]')).toHaveCount(0);
  await button.click();
  const copiedButton = page.getByRole("button", { name: "Copied", exact: true });
  await expect(copiedButton).toHaveText("Copy prompt");
  expect(copied).toContain("Gust setup reference");
  expect(copied).toContain("<Gust value={text} />");
  expect(copied).not.toMatch(/find one short label|save button|status badge|render it where/i);
});

test("the lab contains the interactive prop reference", async ({ page }) => {
  await page.getByRole("link", { name: "Lab", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab");
  const value = page.locator("article#value");
  await expect(value).toContainText("The text to animate.");
  await value.getByRole("textbox", { name: "Value", exact: true }).fill("A new label");
  await expect(value.locator('[data-slot="gust"]').first()).toContainText("A new label");
  await expect(page.locator("article#duration")).toBeAttached();
  await expect(page.locator("article#entranceBlur")).toBeAttached();
});

test("examples are interactive and the airplane is gone", async ({ page }) => {
  await page.getByRole("link", { name: "Examples", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Examples");
  await expect(page.getByRole("figure")).toHaveCount(4);
  await expect(page.getByRole("figure", { name: "Flight" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "One-time code", exact: true })).toBeAttached();
  const counter = page.getByRole("group", { name: "Counter", exact: true });
  await expect(counter.getByRole("button", { name: "Increase count" })).toBeEnabled();
});

test("the old agent page redirects while the raw guide stays available", async ({
  page,
  request,
}) => {
  await page.goto("/agent");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Agent", exact: true })).toHaveCount(0);
  const guide = await request.get("/gust.md");
  expect(guide.ok()).toBe(true);
  expect(await guide.text()).toContain("@maniktherana/gust");
});
