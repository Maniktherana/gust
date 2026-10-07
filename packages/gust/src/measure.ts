// DOM measurement helpers for the root width morph and outgoing character layer.

export type GustRootSize = {
  height: number;
  width: number;
};

export type GustRootRect = GustRootSize & { left: number };

export type GustCharacterMeasure = {
  color: string;
  height: number;
  width: number;
  x: number;
  y: number;
};

export function measureElementSize(element: HTMLElement): GustRootSize {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
  };
}

export function measureElementRect(element: HTMLElement): GustRootRect {
  const { left, height, width } = element.getBoundingClientRect();
  return { left, height, width };
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

  slots.forEach((slot, index) => {
    if (!slot.isConnected) return;
    const rect = slot.getBoundingClientRect();
    const glyph = slot.querySelector<HTMLSpanElement>('[data-gust-part="glyph"]');
    // A width morph counters alignment drift on the glyph, not its slot.
    // Capture that live offset too when a new value interrupts the morph.
    const layoutX = glyph ? Number.parseFloat(window.getComputedStyle(glyph).translate) || 0 : 0;
    measures.set(index, {
      color: window.getComputedStyle(slot).color,
      height: rect.height,
      width: rect.width,
      x: rect.left - rootRect.left + layoutX,
      y: rect.top - rootRect.top,
    });
  });

  return measures;
}
