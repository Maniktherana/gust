import { expect, test, type Page } from "@playwright/test";

const viewport = ".demo-carousel__viewport";
const carousel = ".demo-carousel";
const position = (page: Page) =>
  page
    .locator(".demo-carousel__slot")
    .first()
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("gust-theme", "light"));
  await page.goto("/");
  // DialKit is a development overlay and covers most of a phone's viewport.
  await page.addStyleTag({ content: '[class*="dialkit"] { visibility: hidden !important; }' });
  await expect(page.locator(viewport)).toHaveAttribute("data-intro", "done");
});

test("the header spans the viewport and the site stays dark", async ({ page }) => {
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.locator("header nav a")).toHaveText(["Home", "Agent"]);
  await expect(page.getByRole("link", { name: "GitHub", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Switch to .* mode/ })).toHaveCount(0);
  const width = await page
    .locator("header")
    .evaluate((header) => header.getBoundingClientRect().width);
  expect(width).toBe(page.viewportSize()!.width);
});

test("a touch swipe follows the finger in either direction without opening a card", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Playwright exposes native touch movement through CDP only.",
  );
  const session = await page.context().newCDPSession(page);
  const box = (await page.locator(viewport).boundingBox())!;
  const y = box.y + box.height / 2;
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
    session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 0 }],
    });

  for (const [from, to] of [
    [300, 80],
    [80, 300],
  ]) {
    await touch("touchStart", from);
    const before = await position(page);
    for (let step = 1; step <= 12; step++) {
      await touch("touchMove", from + ((to - from) * step) / 12);
    }
    await expect(page.locator(viewport)).toHaveAttribute("data-dragging", "true");
    expect((await position(page)) - before).toBeCloseTo(to - from, 0);
    await touch("touchEnd", to);
    await expect(page.locator(carousel)).not.toHaveAttribute("data-staged");
    await expect(page.locator(viewport)).not.toHaveAttribute("data-dragging");
    // A coarse pointer must retain plain translation, including during a fast fling.
    const styles = await page.locator(".demo-carousel__slot").evaluateAll((slots) =>
      slots.map((slot) => ({
        transform: (slot as HTMLElement).style.transform,
        filter: getComputedStyle(slot).filter,
      })),
    );
    expect(
      styles.every(
        ({ transform, filter }) => transform.startsWith("translateX(") && filter === "none",
      ),
    ).toBe(true);
  }
});

test("capture transfers from the card to the carousel without cancelling the drag", async ({
  page,
}) => {
  // WebKit's Playwright API only offers touch taps. Explicitly capture on pointerdown to
  // reproduce a touch device's implicit capture using real browser capture events.
  await page.locator(carousel).evaluate((section) => {
    section.addEventListener("pointerdown", (event) => {
      const pointer = event as PointerEvent;
      (pointer.target as HTMLElement).setPointerCapture(pointer.pointerId);
    });
  });
  await page.mouse.move(300, 220);
  await page.mouse.down();
  const before = await position(page);
  await page.mouse.move(80, 220, { steps: 12 });
  await expect(page.locator(viewport)).toHaveAttribute("data-dragging", "true");
  expect((await position(page)) - before).toBeCloseTo(-220, 0);
  await page.mouse.up();
  await expect(page.locator(carousel)).not.toHaveAttribute("data-staged");
});

test("losing the carousel's own capture ends the drag and resumes movement", async ({ page }) => {
  await page.locator(viewport).evaluate((element) => {
    element.addEventListener("gotpointercapture", (event) => {
      element.releasePointerCapture((event as PointerEvent).pointerId);
    });
  });
  await page.mouse.move(300, 220);
  await page.mouse.down();
  await page.mouse.move(160, 220, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(viewport)).not.toHaveAttribute("data-dragging");
  await expect(page.locator(carousel)).not.toHaveAttribute("data-staged");
  const before = await position(page);
  await expect.poll(async () => Math.abs((await position(page)) - before)).toBeGreaterThan(10);
});

test("tapping a card still opens the grid", async ({ page }) => {
  await page.touchscreen.tap(200, 220);
  await expect(page.locator(carousel)).toHaveAttribute("data-stage", "grid");
  await page.locator(".demo-carousel__close").click();
  await expect(page.locator(carousel)).not.toHaveAttribute("data-staged");
});
