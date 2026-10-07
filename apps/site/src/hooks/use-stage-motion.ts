import * as React from "react";

// True while the demo carousel's stage is moving. The demos pause for the few hundred
// milliseconds it takes, so their timers, canvases and WebGL leave every frame to the cards.
let moving = false;
const listeners = new Set<() => void>();

export function setStageMoving(next: boolean) {
  if (next === moving) return;
  moving = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStageMoving() {
  return React.useSyncExternalStore(
    subscribe,
    () => moving,
    () => false,
  );
}
