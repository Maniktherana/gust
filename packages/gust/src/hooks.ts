// The imperative half of Gust: each hook owns the refs and WAAPI animations for
// one concern (entrance, exit, width morph, prefix slide). Hook call order in
// the component preserves the original effect order — enter, exit, width, prefix.

import * as React from "react";

import type { GustKeyframes } from "./keyframes";
import { lastCharacterStartDelay } from "./keyframes";
import type { RenderedGustCharacter } from "./characters";
import { isForwardAppend } from "./characters";
import type { GustCharacterMeasure, GustRootSize } from "./measure";
import { measureElementSize, measureGustCharacterSlots, widthsMatch } from "./measure";
import { easeOutStrongCss } from "./easing";

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

// Dependency-free replacement for Motion's useReducedMotion.
export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => undefined;

      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onStoreChange);

      return () => query.removeEventListener("change", onStoreChange);
    }, []),
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

// Fire the per-character entrance. Keyframes are config-only (order-independent),
// so each character reuses the same baked set and varies only its delay. The
// guard keys on entryKey *and* the live animation state: a preserved prefix
// character whose entrance is still running is left alone (no replay), but if
// its animation was cancelled — e.g. a dev StrictMode/HMR remount tore it down
// between mount passes — we refire so it can't get stuck at its opacity:0
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
      enterElements.current.delete(index);
    }
  }, []);

  React.useLayoutEffect(() => {
    renderedCharacters.forEach((character) => {
      if (character.stable) {
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

      const animation = element.animate(enterKeyframes.keyframes, {
        delay: character.order * enterStagger,
        duration: enterKeyframes.duration,
        easing: "linear",
        fill: "both",
      });

      enterAnimations.current.set(character.index, animation);
      enterFiredKeys.current.set(character.index, character.entryKey);
      enterFiredKeyframes.current.set(character.index, enterKeyframes);
    });

    const activeIndexes = new Set(renderedCharacters.map(({ index }) => index));

    enterAnimations.current.forEach((animation, index) => {
      if (activeIndexes.has(index)) return;
      animation.cancel();
      enterAnimations.current.delete(index);
      enterFiredKeys.current.delete(index);
      enterFiredKeyframes.current.delete(index);
    });
  }, [enterStagger, enterKeyframes, renderedCharacters]);

  return setEnterRef;
}

// Fire the per-character exit for the outgoing word. Exit spans remount each
// transition, so we fire once per version — but as with the entrance, refire
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
    exitAnimations.current.forEach((animation) => animation.cancel());
    exitAnimations.current.clear();

    exitElements.current.forEach(({ element, measure, order }) => {
      const positionedKeyframes = exitKeyframes.keyframes.map((keyframe) => ({
        ...keyframe,
        color: measure.color,
        translate: `${measure.x}px ${measure.y}px`,
      }));
      const animation = element.animate(positionedKeyframes, {
        delay: order * exitStagger,
        duration: exitKeyframes.duration,
        easing: "linear",
        fill: "both",
      });

      exitAnimations.current.add(animation);
    });
  }, [exitStagger, exitKeyframes, version]);

  return setExitRef;
}

// Morph the root's width from the outgoing word to the incoming one. Shrinks
// wait for the last exiting character to start lifting; growth starts at once.
export function useRootWidthMorph({
  activeWord,
  exitDuration,
  exitStagger,
  preservedPrefixLength,
  previousText,
  reduceMotion,
  rootElement,
  rootTransitionDuration,
  sizingElement,
  version,
}: {
  activeWord: string;
  exitDuration: number;
  exitStagger: number;
  preservedPrefixLength: number;
  previousText: string;
  reduceMotion: boolean;
  rootElement: React.RefObject<HTMLSpanElement | null>;
  rootTransitionDuration: number;
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

    if (!previousSize || reduceMotion) return;

    const fromSize =
      hadActiveWidthAnimation && !isForwardAppend(previousText, activeWord)
        ? visualSize
        : previousSize;

    if (widthsMatch(fromSize, nextSize)) return;

    const isShrinking = fromSize.width > nextSize.width;
    const resizeDelay = isShrinking
      ? lastCharacterStartDelay(previousText, exitStagger, preservedPrefixLength)
      : 0;
    const resizeDuration = isShrinking ? exitDuration : rootTransitionDuration;

    const animation = root.animate(
      [{ width: `${fromSize.width}px` }, { width: `${nextSize.width}px` }],
      {
        delay: resizeDelay,
        duration: resizeDuration,
        easing: easeOutStrongCss,
        fill: "both",
      },
    );

    rootSizeAnimation.current = animation;
    animation.onfinish = () => {
      if (rootSizeAnimation.current !== animation) return;
      rootSizeAnimation.current = null;
      animation.cancel();
    };
  }, [
    activeWord,
    exitDuration,
    exitStagger,
    preservedPrefixLength,
    previousText,
    reduceMotion,
    rootElement,
    rootTransitionDuration,
    sizingElement,
    version,
  ]);

  React.useEffect(
    () => () => {
      rootSizeAnimation.current?.cancel();
      rootSizeAnimation.current = null;
    },
    [],
  );
}

// FLIP-slide preserved-prefix characters into their new x position, and keep
// the per-character slot measurements the exit layer needs for the next
// transition. Returns the slot ref setter and the live measure map.
export function usePrefixSlide({
  activeWord,
  duration,
  preservePrefix,
  reduceMotion,
  rootElement,
  stablePrefixLength,
}: {
  activeWord: string;
  duration: number;
  preservePrefix: boolean;
  reduceMotion: boolean;
  rootElement: React.RefObject<HTMLSpanElement | null>;
  stablePrefixLength: number;
}) {
  const slotElements = React.useRef(new Map<number, HTMLSpanElement>());
  const previousSlotMeasures = React.useRef(new Map<number, GustCharacterMeasure>());
  const prefixAnimations = React.useRef(new Map<number, Animation>());

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

    const currentMeasures = measureGustCharacterSlots(root, slotElements.current);
    const activePrefixIndexes = new Set(
      Array.from({ length: stablePrefixLength }, (_, index) => index),
    );

    prefixAnimations.current.forEach((animation, index) => {
      if (!activePrefixIndexes.has(index) || reduceMotion || !preservePrefix) {
        animation.cancel();
        prefixAnimations.current.delete(index);
      }
    });

    if (!reduceMotion && preservePrefix) {
      activePrefixIndexes.forEach((index) => {
        const element = slotElements.current.get(index);
        const previousMeasure = previousSlotMeasures.current.get(index);
        const currentMeasure = currentMeasures.get(index);

        if (!element || !previousMeasure || !currentMeasure) return;

        const deltaX = previousMeasure.x - currentMeasure.x;
        const deltaY = 0;

        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

        prefixAnimations.current.get(index)?.cancel();

        const animation = element.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0px, 0px)" },
          ],
          {
            duration,
            easing: easeOutStrongCss,
            fill: "both",
          },
        );

        prefixAnimations.current.set(index, animation);
        animation.onfinish = () => {
          if (prefixAnimations.current.get(index) !== animation) return;
          prefixAnimations.current.delete(index);
          animation.cancel();
        };
      });
    }

    previousSlotMeasures.current = currentMeasures;
  }, [duration, preservePrefix, reduceMotion, rootElement, activeWord, stablePrefixLength]);

  React.useEffect(
    () => () => {
      prefixAnimations.current.forEach((animation) => animation.cancel());
      prefixAnimations.current.clear();
    },
    [],
  );

  return { previousSlotMeasures, setSlotRef };
}
