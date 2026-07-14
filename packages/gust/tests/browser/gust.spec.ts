import { expect, test } from "@playwright/test";

test("renders semantic text and animates a controlled change", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");

  const gust = page.getByTestId("hero-gust");
  const semanticText = gust.locator('[data-gust-part="sr-only"]');
  const visualText = gust.locator('[data-gust-part="text"]');

  await expect(semanticText).toHaveText("a gust of wind.");
  await expect(visualText).toHaveAttribute("aria-hidden", "true");
  await expect(gust).not.toHaveAttribute("style", /.*/);
  await expect(gust).toHaveClass(/text-3xl/);
  expect(await visualText.evaluate((element) => getComputedStyle(element).justifySelf)).toBe(
    "start",
  );

  await page.getByRole("button", { name: "Next" }).click();
  await expect(semanticText).toHaveText("a gust of words.");

  const animationCount = await gust.evaluate(
    (element) => element.getAnimations({ subtree: true }).length,
  );

  expect(animationCount).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

test("transitions between package and source install commands", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const command = page.getByTestId("install-command");
  const semanticText = command.locator('[data-gust-part="sr-only"]');
  const usage = page.locator("#usage + div");

  await expect(semanticText).toHaveText("bun add @maniktherana/gust");
  await expect(usage).toContainText('from "@maniktherana/gust"');

  await page.getByRole("button", { name: "shadcn cli" }).click();
  await expect(semanticText).toHaveText(
    "bunx shadcn@latest add https://gust.manikrana.dev/r/gust.json",
  );
  await expect(usage).toContainText('from "@/components/ui/gust"');
  expect(
    await command.evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBeGreaterThan(0);

  await page.getByRole("button", { name: "npm" }).click();
  await expect(semanticText).toHaveText("bun add @maniktherana/gust");
});

test.describe("reduced motion", () => {
  test("keeps the transition short and opacity-only", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      const animate = Element.prototype.animate;
      const calls: Array<{ keyframes: Keyframe[]; options?: number | KeyframeAnimationOptions }> =
        [];

      Object.defineProperty(window, "__gustAnimationCalls", { value: calls });
      Element.prototype.animate = function (keyframes, options) {
        if (this.closest('[data-testid="hero-gust"]')) {
          const resolvedKeyframes = Array.isArray(keyframes) ? (keyframes as Keyframe[]) : [];
          calls.push({ keyframes: resolvedKeyframes, options });
        }

        return animate.call(this, keyframes, options);
      };
    });

    await page.goto("/");
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );

    const gust = page.getByTestId("hero-gust");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(gust.locator('[data-gust-part="sr-only"]')).toHaveText("a gust of words.");

    const animations = await page.evaluate(
      () =>
        (
          window as unknown as Window & {
            __gustAnimationCalls: Array<{
              keyframes: Keyframe[];
              options?: number | KeyframeAnimationOptions;
            }>;
          }
        ).__gustAnimationCalls,
    );

    expect(animations.length).toBeGreaterThan(0);
    expect(
      animations.every(({ options }) =>
        typeof options === "number" ? options <= 180 : Number(options?.duration) <= 180,
      ),
    ).toBe(true);
    expect(
      animations.every(({ keyframes }) =>
        keyframes.every((keyframe) => !keyframe.transform && !keyframe.filter),
      ),
    ).toBe(true);
  });
});
