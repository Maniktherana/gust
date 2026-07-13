// DOM measurement helpers for the width morph and the prefix FLIP slide.

export type GustRootSize = {
  height: number;
  width: number;
};

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
    measures.set(index, {
      color: window.getComputedStyle(slot).color,
      height: rect.height,
      width: rect.width,
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
    });
  });

  return measures;
}
