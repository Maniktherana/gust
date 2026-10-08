// Layout and motion for the carousel's full-screen stage, where the strip folds into a grid and
// a card can be zoomed into focus. Everything here is plain math so it can be tested on its own.

export type Size = { height: number; width: number };
// A card's top-left corner on screen and how much it is scaled from its natural size.
export type Placement = { scale: number; x: number; y: number };
// A camera over the grid: the grid point shown in the middle of the screen, and its zoom.
export type Camera = { x: number; y: number; zoom: number };

// Both the zoom into a card and back out follow a critically damped spring, applied to the log
// of the zoom, as in the reference recording. The recording's spring ran at 12.6 rad/s; this
// one runs at about twice that, so it is half way after 70ms and within 2% by 250ms.
export const STAGE_SPRING = 24;

// One step of a critically damped spring, solved exactly so any frame time stays stable.
export function springStep(
  value: number,
  velocity: number,
  target: number,
  dt: number,
  omega = STAGE_SPRING,
) {
  const offset = value - target;
  const rate = velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  return [
    target + (offset + rate * dt) * decay,
    (rate - omega * (offset + rate * dt)) * decay,
  ] as const;
}

// The space the grid and the focused card keep clear around the screen's edges. The top leaves
// room for the close button.
export function stageInsets(frame: Size) {
  const x = Math.min(96, Math.max(16, frame.width * 0.06));
  const y = Math.min(112, Math.max(72, frame.height * 0.1));
  return { x, y };
}

// Every way of cutting `count` items, in order, into `rows` non-empty runs.
function* splits(count: number, rows: number, start = 0): Generator<number[]> {
  if (rows === 1) {
    yield [count - start];
    return;
  }
  for (let length = 1; length <= count - start - (rows - 1); length += 1) {
    for (const rest of splits(count, rows - 1, start + length)) yield [length, ...rest];
  }
}

// Lays the cards out in centred rows, all at one scale so they keep their relative sizes. The
// cards keep the order given, so a strip read left to right wraps into rows. For each row count
// it takes the most even split, then picks the count that shows the cards largest, preferring a
// shape closer to the screen's when two are about as large.
export function layoutGrid({
  frame,
  gap,
  maxScale = 1,
  order,
  sizes,
}: {
  frame: Size;
  gap: number;
  maxScale?: number;
  order: number[];
  sizes: Size[];
}) {
  const insets = stageInsets(frame);
  const room = {
    height: Math.max(1, frame.height - 2 * insets.y),
    width: Math.max(1, frame.width - 2 * insets.x),
  };
  const roomShape = Math.log(room.width / room.height);
  let best:
    | { height: number; rows: number[][]; scale: number; shape: number; widths: number[] }
    | undefined;

  for (let count = 1; count <= order.length; count += 1) {
    let even: { height: number; rows: number[][]; spread: number; widths: number[] } | undefined;
    for (const lengths of splits(order.length, count)) {
      let cursor = 0;
      const rows = lengths.map((length) => order.slice(cursor, (cursor += length)));
      const widths = rows.map(
        (row) => row.reduce((sum, index) => sum + sizes[index]!.width, 0) + gap * (row.length - 1),
      );
      const spread = Math.max(...widths) - Math.min(...widths);
      const widest = Math.max(...widths);
      const evenWidest = even ? Math.max(...even.widths) : Infinity;
      // Splits come shortest first row first, so on a tie the later one fills the top rows and
      // leaves any short row at the bottom.
      if (widest > evenWidest + 0.5 || (widest > evenWidest - 0.5 && spread > even!.spread))
        continue;
      const height =
        rows.reduce((sum, row) => sum + Math.max(...row.map((index) => sizes[index]!.height)), 0) +
        gap * (rows.length - 1);
      even = { height, rows, spread, widths };
    }
    if (!even) continue;
    const width = Math.max(...even.widths);
    const scale = Math.min(maxScale, room.width / width, room.height / even.height);
    const shape = Math.abs(Math.log(width / even.height) - roomShape);
    const larger = !best || scale > best.scale * 1.02;
    const asLarge = best && scale > best.scale * 0.98;
    if (larger || (asLarge && shape < best!.shape)) best = { ...even, scale, shape };
  }

  const placements: Placement[] = sizes.map(() => ({ scale: 1, x: 0, y: 0 }));
  if (!best) return { placements, rows: [] as number[][], scale: 1 };
  const { scale } = best;
  let y = (frame.height - best.height * scale) / 2;
  best.rows.forEach((row, rowIndex) => {
    const rowHeight = Math.max(...row.map((index) => sizes[index]!.height));
    let x = (frame.width - best!.widths[rowIndex]! * scale) / 2;
    for (const index of row) {
      const size = sizes[index]!;
      placements[index] = { scale, x, y: y + ((rowHeight - size.height) * scale) / 2 };
      x += (size.width + gap) * scale;
    }
    y += (rowHeight + gap) * scale;
  });
  return { placements, rows: best.rows, scale };
}

// The camera that brings one grid card to the middle of the screen, as large as fits.
export function focusCamera(
  placement: Placement,
  size: Size,
  frame: Size,
  maxScale = Number.POSITIVE_INFINITY,
): Camera {
  const insets = stageInsets(frame);
  const scale = Math.min(
    maxScale,
    (frame.width - 2 * insets.x) / size.width,
    (frame.height - 2 * insets.y) / size.height,
  );
  return {
    x: placement.x + (size.width * placement.scale) / 2,
    y: placement.y + (size.height * placement.scale) / 2,
    zoom: scale / placement.scale,
  };
}
