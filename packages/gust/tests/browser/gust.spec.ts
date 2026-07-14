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
  await expect(gust).toHaveCSS("display", /^(inline-)?grid$/);
  await expect(semanticText).toHaveCSS("position", "absolute");
  await expect(gust.locator('[data-gust-part="sizer"]')).toHaveCSS("visibility", "hidden");
  await expect(gust).toHaveClass(/text-3xl/);

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
  await expect(usage).toContainText('import "@maniktherana/gust/styles.css"');
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
