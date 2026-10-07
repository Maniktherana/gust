// DOM measurement helpers for the root width morph and outgoing character layer.

export type GustRootSize = {
  height: number;
  width: number;
};

export type GustRootRect = GustRootSize & { left: number; scale: number };

export type GustCharacterMeasure = {
  color: string;
  height: number;
  width: number;
  x: number;
  y: number;
};

// How many screen pixels one of the element's own CSS pixels covers, on each axis. A scaled or
// zoomed ancestor scales everything getBoundingClientRect reports, but the widths and offsets
// Gust writes are in the element's own pixels, so every measurement is divided by this.
export function measureElementScale(
  element: HTMLElement,
  rect: Pick<DOMRect, "height" | "width"> = element.getBoundingClientRect(),
) {
  const style = element.ownerDocument?.defaultView?.getComputedStyle(element);
  if (!style) return { x: 1, y: 1 };
  const px = (value: string) => Number.parseFloat(value) || 0;
  const content = style.boxSizing === "border-box" ? 0 : 1;
  const width =
    px(style.width) +
    content *
      (px(style.paddingLeft) +
        px(style.paddingRight) +
        px(style.borderLeftWidth) +
        px(style.borderRightWidth));
  const height =
    px(style.height) +
    content *
      (px(style.paddingTop) +
        px(style.paddingBottom) +
        px(style.borderTopWidth) +
        px(style.borderBottomWidth));
  const ratio = (shown: number, own: number) => {
    const value = own > 0.5 && shown > 0 ? shown / own : Number.NaN;
    return Math.abs(value - 1) < 1e-4 ? 1 : value;
  };
  const x = ratio(rect.width, width);
  const y = ratio(rect.height, height);
  // An empty value has no width to compare, so it borrows the other axis.
  return {
    x: Number.isFinite(x) ? x : Number.isFinite(y) ? y : 1,
    y: Number.isFinite(y) ? y : Number.isFinite(x) ? x : 1,
  };
}

export function measureElementSize(element: HTMLElement): GustRootSize {
  const { height, width } = measureElementRect(element);
  return { height, width };
}

// The element's box in its own CSS pixels. The left edge is only meaningful next to other
// measurements taken in the same frame, divided by the same scale.
export function measureElementRect(element: HTMLElement): GustRootRect {
  const rect = element.getBoundingClientRect();
  const scale = measureElementScale(element, rect);
  return {
    height: rect.height / scale.y,
    left: rect.left / scale.x,
    scale: scale.x,
    width: rect.width / scale.x,
  };
}

export function widthsMatch(previous: GustRootSize, next: GustRootSize) {
  return Math.abs(previous.width - next.width) < 0.5;
}

export function measureGustCharacterSlots(
  root: HTMLSpanElement,
  slots: Map<number, HTMLSpanElement>,
) {
  const measures = new Map<number, GustCharacterMeasure>();
  const rootRect = root.getBoundingClientRect();
  const scale = measureElementScale(root, rootRect);

  slots.forEach((slot, index) => {
    if (!slot.isConnected) return;
    const rect = slot.getBoundingClientRect();
    const glyph = slot.querySelector<HTMLSpanElement>('[data-gust-part="glyph"]');
    // A width morph counters alignment drift on the glyph, not its slot.
    // Capture that live offset too when a new value interrupts the morph.
    const layoutX = glyph ? Number.parseFloat(window.getComputedStyle(glyph).translate) || 0 : 0;
    measures.set(index, {
      color: window.getComputedStyle(slot).color,
      height: rect.height / scale.y,
      width: rect.width / scale.x,
      x: (rect.left - rootRect.left) / scale.x + layoutX,
      y: (rect.top - rootRect.top) / scale.y,
    });
  });

  return measures;
}
