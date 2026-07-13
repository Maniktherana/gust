// Generic easing math shared by the keyframe baker: a cubic-bezier solver
// (Newton-Raphson) matching the curves Motion feeds to its transitions, plus
// the strong ease-out Gust uses everywhere.

export const easeOutStrong: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeOutStrongCss = "cubic-bezier(0.16, 1, 0.3, 1)";

export function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function lerp(from: number, to: number, fraction: number) {
  return from + (to - from) * fraction;
}

// Returns the eased y for a linear progress x in [0, 1].
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  if (x1 === y1 && x2 === y2) return (value: number) => value;

  const ax = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const bx = (a: number, b: number) => 3 * b - 6 * a;
  const cx = (a: number) => 3 * a;
  const sample = (t: number, a: number, b: number) => ((ax(a, b) * t + bx(a, b)) * t + cx(a)) * t;
  const slope = (t: number, a: number, b: number) =>
    3 * ax(a, b) * t * t + 2 * bx(a, b) * t + cx(a);

  const solveForX = (x: number) => {
    let guess = x;

    for (let index = 0; index < 8; index += 1) {
      const currentSlope = slope(guess, x1, x2);

      if (currentSlope === 0) return guess;

      guess -= (sample(guess, x1, x2) - x) / currentSlope;
    }

    return guess;
  };

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    return sample(solveForX(x), y1, y2);
  };
}

export const easeOutStrongFn = cubicBezier(
  easeOutStrong[0],
  easeOutStrong[1],
  easeOutStrong[2],
  easeOutStrong[3],
);
