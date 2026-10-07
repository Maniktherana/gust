import { expect, test } from "@playwright/test";

// Pixel playback is checked separately on iOS. This exercises actual browser interpolation
// and CSS registration, which a mocked WAAPI unit test cannot validate.
test("native glyph tracks interpolate together and release to their resting styles", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".demo-carousel__viewport")).toHaveAttribute("data-intro", "done");
  const { frames, size } = await page
    .getByRole("group", { name: "Counter", exact: true })
    .first()
    .evaluate(async (group) => {
      (group.querySelector('[aria-label="Increase count"]') as HTMLButtonElement).click();
      await new Promise(requestAnimationFrame);
      const root = group.querySelector('[data-slot="gust"]')!;
      const animations = root.getAnimations({ subtree: true });
      animations.forEach((animation) => animation.pause());
      const glyph = root.querySelector('[data-gust-part="glyph"]')!;
      const exit = root.querySelector('[data-gust-part="exit"]')!;
      const read = (element: Element) => {
        const style = getComputedStyle(element);
        return {
          y: new DOMMatrix(style.transform).m42,
          opacity: Number(style.opacity),
          blur: Number.parseFloat(style.filter.slice(5)),
        };
      };
      const samples = [];
      for (const time of [0, 16, 80, 320]) {
        animations.forEach((animation) => {
          animation.currentTime = time;
        });
        await new Promise(requestAnimationFrame);
        samples.push({ enter: read(glyph), exit: read(exit) });
      }
      animations.forEach((animation) => animation.cancel());
      samples.push({ enter: read(glyph), exit: read(exit) });
      return { frames: samples, size: Number.parseFloat(getComputedStyle(glyph).fontSize) };
    });
  expect(frames[0].enter).toEqual({ y: size, opacity: 0, blur: 0 });
  expect(frames[0].exit).toEqual({ y: 0, opacity: 1, blur: 0 });
  expect(frames[1].enter.y).toBeGreaterThan(frames[2].enter.y);
  expect(frames[1].enter.y).toBeLessThan(size);
  expect(frames[1].enter.opacity).toBeGreaterThan(0);
  expect(frames[1].enter.opacity).toBeLessThan(1);
  expect(frames[1].enter.blur).toBe(0);
  expect(frames[1].exit.y).toBeLessThan(0);
  expect(frames[1].exit.opacity).toBeLessThan(1);
  expect(frames[1].exit.blur).toBeGreaterThan(0);
  for (const frame of frames.slice(3)) {
    expect(frame.enter).toEqual({ y: 0, opacity: 1, blur: 0 });
    expect(frame.exit.opacity).toBe(0);
  }
});
