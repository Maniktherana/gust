// The imperative half of Gust: each hook owns the refs and WAAPI animations for
// one concern (entrance, exit, width morph, slot measurement). Hook call order
// in the component preserves the required effect order.

import * as React from "react";

import type { GustKeyframes } from "./keyframes";
import type { RenderedGustCharacter } from "./characters";
import type { GustCharacterMeasure, GustRootSize } from "./measure";
import { measureElementSize, measureGustCharacterSlots, widthsMatch } from "./measure";

const layoutEaseCss = "cubic-bezier(0.16, 1, 0.3, 1)";

function setCharacterAnimating(element: HTMLSpanElement, animating: boolean) {
  if (animating) {
    element.dataset.gustAnimating = "true";
  } else {
    delete element.dataset.gustAnimating;
  }
}

export type GustTransitionState = {
  current: string;
  previous: string;
  version: number;
};

export function useGustTransitionState(word: string) {
  const [transitionState, setTransitionState] = React.useState<GustTransitionState>(() => ({
    current: word,
    previous: "",
    version: 0,
  }));

  if (transitionState.current !== word) {
    const nextTransitionState = {
      current: word,
      previous: transitionState.current,
      version: transitionState.version + 1,
    };

    setTransitionState(nextTransitionState);
    return nextTransitionState;
  }

  return transitionState;
}

// Fire the per-character entrance. Keyframes are config-only (order-independent),
// so each character reuses the same baked set and varies only its delay. The
// guard keys on entryKey *and* the live animation state: a preserved prefix
// character whose entrance is still running is left alone (no replay), but if
// its animation was cancelled, such as when a dev StrictMode/HMR remount tore it down
// between mount passes, we refire so it can't get stuck at its opacity:0
// initial frame. Entrance/exit animations are intentionally never cancelled on
// unmount: a StrictMode/HMR remount runs cleanup between two mount passes while
// keeping the same DOM, and cancelling would strand characters at opacity:0. On
// a real unmount the nodes are detached and GC collects their animations.
export function useEnterAnimations({
  enterKeyframes,
  enterStagger,
  renderedCharacters,
}: {
  enterKeyframes: GustKeyframes;
  enterStagger: number;
  renderedCharacters: RenderedGustCharacter[];
}) {
  const enterElements = React.useRef(new Map<number, HTMLSpanElement>());
  const enterAnimations = React.useRef(new Map<number, Animation>());
  const enterFiredKeys = React.useRef(new Map<number, string>());
  const enterFiredKeyframes = React.useRef(new Map<number, GustKeyframes>());

  const setEnterRef = React.useCallback((index: number, element: HTMLSpanElement | null) => {
    if (element) {
      enterElements.current.set(index, element);
    } else {
      const previousElement = enterElements.current.get(index);
      if (previousElement) setCharacterAnimating(previousElement, false);
      enterElements.current.delete(index);
    }
  }, []);

  React.useLayoutEffect(() => {
    renderedCharacters.forEach((character) => {
      if (character.stable) {
        const element = enterElements.current.get(character.index);
        if (element) setCharacterAnimating(element, false);
        enterAnimations.current.get(character.index)?.cancel();
        enterAnimations.current.delete(character.index);
        enterFiredKeys.current.delete(character.index);
        enterFiredKeyframes.current.delete(character.index);
        return;
      }

      const element = enterElements.current.get(character.index);

      if (!element) return;

      const existing = enterAnimations.current.get(character.index);
      const sameEntry = enterFiredKeys.current.get(character.index) === character.entryKey;
      const sameKeyframes = enterFiredKeyframes.current.get(character.index) === enterKeyframes;

      if (sameEntry && sameKeyframes && existing && existing.playState !== "idle") return;

      existing?.cancel();
      setCharacterAnimating(element, true);

      const animation = element.animate(enterKeyframes.keyframes, {
        delay: character.order * enterStagger,
        duration: enterKeyframes.duration,
        easing: "linear",
        fill: "both",
      });

      enterAnimations.current.set(character.index, animation);
      enterFiredKeys.current.set(character.index, character.entryKey);
      enterFiredKeyframes.current.set(character.index, enterKeyframes);
      animation.onfinish = () => {
        if (enterAnimations.current.get(character.index) !== animation) return;
        setCharacterAnimating(element, false);
      };
      animation.oncancel = () => {
        if (enterAnimations.current.get(character.index) !== animation) return;
        setCharacterAnimating(element, false);
      };
    });

    const activeIndexes = new Set(renderedCharacters.map(({ index }) => index));

    enterAnimations.current.forEach((animation, index) => {
      if (activeIndexes.has(index)) return;
      const element = enterElements.current.get(index);
      if (element) setCharacterAnimating(element, false);
      animation.cancel();
      enterAnimations.current.delete(index);
      enterFiredKeys.current.delete(index);
      enterFiredKeyframes.current.delete(index);
    });
  }, [enterStagger, enterKeyframes, renderedCharacters]);

  return setEnterRef;
}

// Fire the per-character exit for the outgoing word. Exit spans remount each
// transition, so we fire once per version. As with the entrance, refire
// if the tracked animations were torn down (remount) so they don't freeze.
export function useExitAnimations({
  exitKeyframes,
  exitStagger,
  version,
}: {
  exitKeyframes: GustKeyframes;
  exitStagger: number;
  version: number;
}) {
  const exitElements = React.useRef(
    new Map<string, { element: HTMLSpanElement; measure: GustCharacterMeasure; order: number }>(),
  );
  const exitAnimations = React.useRef(new Set<Animation>());
  const exitFiredVersion = React.useRef(-1);

  const setExitRef = React.useCallback(
    (
      key: string,
      element: HTMLSpanElement | null,
      order: number,
      measure: GustCharacterMeasure,
    ) => {
      if (element) {
        exitElements.current.set(key, { element, measure, order });
      } else {
        const previousElement = exitElements.current.get(key)?.element;
        if (previousElement) setCharacterAnimating(previousElement, false);
        exitElements.current.delete(key);
      }
    },
    [],
  );

  React.useLayoutEffect(() => {
    const tracked = Array.from(exitAnimations.current);
    const live = tracked.length > 0 && tracked.every((animation) => animation.playState !== "idle");

    if (exitFiredVersion.current === version && (live || exitElements.current.size === 0)) {
      return;
    }

    exitFiredVersion.current = version;
    exitElements.current.forEach(({ element }) => setCharacterAnimating(element, false));
    exitAnimations.current.forEach((animation) => animation.cancel());
    exitAnimations.current.clear();

    exitElements.current.forEach(({ element, measure, order }) => {
      const positionedKeyframes = exitKeyframes.keyframes.map((keyframe) => ({
        ...keyframe,
        color: measure.color,
        translate: `${measure.x}px ${measure.y}px`,
      }));
      setCharacterAnimating(element, true);
      const animation = element.animate(positionedKeyframes, {
        delay: order * exitStagger,
        duration: exitKeyframes.duration,
        easing: "linear",
        fill: "both",
      });

      exitAnimations.current.add(animation);
      animation.onfinish = () => {
        if (!exitAnimations.current.has(animation)) return;
        setCharacterAnimating(element, false);
      };
      animation.oncancel = () => {
        if (!exitAnimations.current.has(animation)) return;
        setCharacterAnimating(element, false);
      };
    });
  }, [exitStagger, exitKeyframes, version]);

  return setExitRef;
}

// Morph the root's width from the outgoing word to the incoming one. Layout
// starts immediately and settles on a short, steep curve independently of the
// longer per-character timeline, preventing late centered-layout drift.
export function useRootWidthMorph({
  activeWord,
  rootElement,
  rootWidthDuration,
  sizingElement,
  version,
}: {
  activeWord: string;
  rootElement: React.RefObject<HTMLSpanElement | null>;
  rootWidthDuration: number;
  sizingElement: React.RefObject<HTMLSpanElement | null>;
  version: number;
}) {
  const previousRootSize = React.useRef<GustRootSize | null>(null);
  const rootSizeAnimation = React.useRef<Animation | null>(null);

  React.useLayoutEffect(() => {
    const root = rootElement.current;
    const sizing = sizingElement.current;

    if (!root || !sizing) return;

    const previousSize = previousRootSize.current;
    const visualSize = measureElementSize(root);
    const hadActiveWidthAnimation = rootSizeAnimation.current !== null;

    rootSizeAnimation.current?.cancel();
    rootSizeAnimation.current = null;

    const nextSize = measureElementSize(sizing);

    previousRootSize.current = nextSize;

    if (!previousSize) return;

    // An interrupted morph must resume from the width currently on screen.
    // Starting from the prior animation's target creates a one-frame snap,
    // especially while typing or deleting quickly.
    const fromSize = hadActiveWidthAnimation ? visualSize : previousSize;

    if (widthsMatch(fromSize, nextSize)) return;

    const animation = root.animate(
      [{ width: `${fromSize.width}px` }, { width: `${nextSize.width}px` }],
      {
        duration: rootWidthDuration,
        easing: layoutEaseCss,
        fill: "both",
      },
    );

    rootSizeAnimation.current = animation;
    animation.onfinish = () => {
      if (rootSizeAnimation.current !== animation) return;
      rootSizeAnimation.current = null;
      animation.cancel();
    };
  }, [activeWord, rootElement, rootWidthDuration, sizingElement, version]);

  React.useEffect(
    () => () => {
      rootSizeAnimation.current?.cancel();
      rootSizeAnimation.current = null;
    },
    [],
  );
}

// Keep the per-character measurements that the next transition's exit layer
// needs. Horizontal movement belongs exclusively to the root width morph; the
// text row stays start-anchored so centering and FLIP cannot fight each other.
export function useCharacterMeasurements({
  activeWord,
  rootElement,
}: {
  activeWord: string;
  rootElement: React.RefObject<HTMLSpanElement | null>;
}) {
  const slotElements = React.useRef(new Map<number, HTMLSpanElement>());
  const previousSlotMeasures = React.useRef(new Map<number, GustCharacterMeasure>());

  const setSlotRef = React.useCallback((index: number, element: HTMLSpanElement | null) => {
    if (element) {
      slotElements.current.set(index, element);
    } else {
      slotElements.current.delete(index);
    }
  }, []);

  React.useLayoutEffect(() => {
    const root = rootElement.current;

    if (!root) return;

    previousSlotMeasures.current = measureGustCharacterSlots(root, slotElements.current);
  }, [activeWord, rootElement]);

  return { previousSlotMeasures, setSlotRef };
}
