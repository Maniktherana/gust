// The imperative half of Gust: each hook owns the refs and WAAPI animations for
// one concern (entrance, exit, width morph, slot measurement). Hook call order
// in the component preserves the required effect order.

import * as React from "react";

import type { GustKeyframes } from "./keyframes";
import type { RenderedGustCharacter } from "./characters";
import type { GustCharacterMeasure, GustRootRect } from "./measure";
import { measureElementRect, measureGustCharacterSlots, widthsMatch } from "./measure";

const layoutEaseCss = "cubic-bezier(0.16, 1, 0.3, 1)";

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
// its animation was cancelled, we refire it. CSS owns the settled state while
// WAAPI owns only the active transition.
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

  const stopEnterAnimations = React.useCallback(() => {
    enterAnimations.current.forEach((animation) => animation.cancel());
    enterAnimations.current.clear();
    enterFiredKeys.current.clear();
    enterFiredKeyframes.current.clear();
  }, []);

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

      // A hidden document cannot show the transition, so settle immediately.
      if (element.ownerDocument.hidden) {
        existing?.cancel();
        enterAnimations.current.delete(character.index);
        enterFiredKeys.current.delete(character.index);
        enterFiredKeyframes.current.delete(character.index);
        return;
      }

      const sameEntry = enterFiredKeys.current.get(character.index) === character.entryKey;
      const sameKeyframes = enterFiredKeyframes.current.get(character.index) === enterKeyframes;

      if (sameEntry && sameKeyframes && existing && existing.playState !== "idle") return;

      existing?.cancel();

      const animation = element.animate(enterKeyframes.keyframes, {
        delay: character.order * enterStagger,
        duration: enterKeyframes.duration,
        easing: "linear",
        fill: "backwards",
      });

      enterAnimations.current.set(character.index, animation);
      enterFiredKeys.current.set(character.index, character.entryKey);
      enterFiredKeyframes.current.set(character.index, enterKeyframes);
      // Backwards fill covers the stagger delay; CSS owns the settled state.
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

  React.useEffect(() => {
    const ownerDocument =
      enterElements.current.values().next().value?.ownerDocument ??
      (typeof document === "undefined" ? null : document);

    if (!ownerDocument) return;

    const settleWhenHidden = () => {
      if (ownerDocument.hidden) stopEnterAnimations();
    };

    ownerDocument.addEventListener("visibilitychange", settleWhenHidden);
    return () => {
      ownerDocument.removeEventListener("visibilitychange", settleWhenHidden);
      stopEnterAnimations();
    };
  }, [stopEnterAnimations]);

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

  const stopExitAnimations = React.useCallback(() => {
    exitAnimations.current.forEach((animation) => animation.cancel());
    exitAnimations.current.clear();
  }, []);

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
    stopExitAnimations();

    const ownerDocument = exitElements.current.values().next().value?.element.ownerDocument;

    // A hidden document cannot show the transition, so settle immediately.
    if (ownerDocument?.hidden) return;

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
        fill: "backwards",
      });

      exitAnimations.current.add(animation);
      // As with entrances, CSS owns the final state; no lifecycle listener or
      // forwards fill is needed.
    });
  }, [exitStagger, exitKeyframes, stopExitAnimations, version]);

  React.useEffect(() => {
    const ownerDocument =
      exitElements.current.values().next().value?.element.ownerDocument ??
      (typeof document === "undefined" ? null : document);

    if (!ownerDocument) return;

    const settleWhenHidden = () => {
      if (ownerDocument.hidden) stopExitAnimations();
    };

    ownerDocument.addEventListener("visibilitychange", settleWhenHidden);
    return () => {
      ownerDocument.removeEventListener("visibilitychange", settleWhenHidden);
      stopExitAnimations();
    };
  }, [stopExitAnimations]);

  return setExitRef;
}

// Morph the root's width from the outgoing word to the incoming one. Layout
// starts immediately and settles on a short, steep curve independently of the
// longer per-character timeline, preventing late centered-layout drift.
export function useRootWidthMorph({
  activeWord,
  outgoingElement,
  renderedCharacters,
  rootElement,
  rootWidthDuration,
  sizingElement,
  version,
}: {
  activeWord: string;
  outgoingElement: React.RefObject<HTMLSpanElement | null>;
  renderedCharacters: RenderedGustCharacter[];
  rootElement: React.RefObject<HTMLSpanElement | null>;
  rootWidthDuration: number;
  sizingElement: React.RefObject<HTMLSpanElement | null>;
  version: number;
}) {
  // Read before React commits the new string, while the old layout is intact.
  const beforeCommitRect = rootElement.current ? measureElementRect(rootElement.current) : null;
  const widthMorph = React.useRef<ReturnType<typeof animateGustRootWidth> | null>(null);
  const exitAnchor = React.useRef<{ left: number; version: number } | null>(null);
  const knownGlyphs = React.useRef(new WeakSet<Element>());

  React.useLayoutEffect(() => {
    const root = rootElement.current;
    const sizing = sizingElement.current;
    const outgoing = outgoingElement.current;

    if (!root || !sizing || !outgoing) return;

    const glyphs = root.querySelectorAll<HTMLSpanElement>('[data-gust-part="glyph"]');
    // Glyphs still entering from an earlier value keep their element. Note where each one is on
    // screen before the in-flight morph is cancelled, so it glides on from there instead of
    // jumping to its new spot.
    const carried = new Map<Element, number>();
    glyphs.forEach((glyph) => {
      const slot = glyph.parentElement;
      if (!slot || !knownGlyphs.current.has(glyph)) return;
      const translate = Number.parseFloat(window.getComputedStyle(glyph).translate) || 0;
      carried.set(glyph, slot.getBoundingClientRect().left + translate);
    });
    knownGlyphs.current = new WeakSet(glyphs);

    const from = widthMorph.current ? measureElementRect(root) : beforeCommitRect;
    widthMorph.current?.cancel();
    widthMorph.current = null;
    const to = measureElementRect(root);

    if (exitAnchor.current?.version !== version) {
      exitAnchor.current = { left: from?.left ?? to.left, version };
    }
    outgoing.style.translate = `${exitAnchor.current.left - to.left}px 0px`;

    if (!from) return;

    // Natural layout already has the target size when no transition is visible.
    if (root.ownerDocument.hidden) return;

    if (widthsMatch(from, to)) return;

    const morph = animateGustRootWidth({
      root,
      from,
      to,
      duration: rootWidthDuration,
      outgoing,
      exitAnchor: exitAnchor.current.left,
      carried,
    });

    widthMorph.current = morph;
    morph.animation.onfinish = () => {
      if (widthMorph.current !== morph) return;
      widthMorph.current = null;
      morph.cancel();
    };
  }, [
    activeWord,
    outgoingElement,
    renderedCharacters,
    rootElement,
    rootWidthDuration,
    sizingElement,
    version,
  ]);

  React.useEffect(() => {
    const root = rootElement.current;
    const ownerDocument = root?.ownerDocument;
    const settleWhenHidden = () => {
      if (!ownerDocument?.hidden) return;
      widthMorph.current?.cancel();
      widthMorph.current = null;
    };

    ownerDocument?.addEventListener("visibilitychange", settleWhenHidden);
    return () => {
      ownerDocument?.removeEventListener("visibilitychange", settleWhenHidden);
      widthMorph.current?.cancel();
      widthMorph.current = null;
    };
  }, [rootElement]);
}

// Kept imperative so the width/glyph geometry can be exercised without a
// browser or React scheduler in the regression harness.
export function animateGustRootWidth({
  root,
  from,
  to,
  duration,
  outgoing,
  exitAnchor = from.left,
  carried,
}: {
  root: HTMLSpanElement;
  from: Pick<GustRootRect, "left" | "width">;
  to: Pick<GustRootRect, "left" | "width">;
  duration: number;
  outgoing?: HTMLSpanElement;
  exitAnchor?: number;
  /** Viewport x of glyphs already on screen before this morph, by glyph element. */
  carried?: ReadonlyMap<Element, number>;
}) {
  const timing = { duration, easing: layoutEaseCss, fill: "both" as const };
  const effects: Animation[] = [];
  const animation = root.animate(
    [{ width: `${from.width}px` }, { width: `${to.width}px` }],
    timing,
  );
  effects.push(animation);
  // User CSS (including reduced-motion !important rules) can override WAAPI
  // width. Counter only the movement that the root actually starts with.
  const initial = measureElementRect(root);

  // Width changes move centered/end-aligned roots. Cancel that movement on
  // incoming glyphs, independently of their directional transform keyframes.
  // Glyphs carried over from an earlier value start where they are on screen
  // and glide to their new spot with the root instead.
  root.querySelectorAll<HTMLSpanElement>('[data-gust-part="glyph"]').forEach((glyph) => {
    const shown = carried?.get(glyph);
    const offset =
      shown === undefined || !glyph.parentElement
        ? to.left - initial.left
        : shown - glyph.parentElement.getBoundingClientRect().left;
    if (Math.abs(offset) <= 0.001) return;
    effects.push(
      glyph.animate([{ translate: `${offset}px 0px` }, { translate: "0px 0px" }], timing),
    );
  });
  if (outgoing) {
    outgoing.style.translate = `${exitAnchor - to.left}px 0px`;
    effects.push(
      outgoing.animate(
        [
          { translate: `${exitAnchor - initial.left}px 0px` },
          { translate: `${exitAnchor - to.left}px 0px` },
        ],
        timing,
      ),
    );
  }

  return { animation, cancel: () => effects.forEach((effect) => effect.cancel()) };
}

// Keep the per-character measurements that the next transition's exit layer
// needs. Snapshot before a new string commits so exits start at the previous
// glyph positions, including an in-flight width compensation.
export function useCharacterMeasurements({
  activeWord,
  rootElement,
}: {
  activeWord: string;
  rootElement: React.RefObject<HTMLSpanElement | null>;
}) {
  const slotElements = React.useRef(new Map<number, HTMLSpanElement>());
  const previousSlotMeasures = React.useRef(new Map<number, GustCharacterMeasure>());
  const measuredWord = React.useRef(activeWord);

  if (measuredWord.current !== activeWord && rootElement.current) {
    previousSlotMeasures.current = measureGustCharacterSlots(
      rootElement.current,
      slotElements.current,
    );
    measuredWord.current = activeWord;
  }

  const setSlotRef = React.useCallback((index: number, element: HTMLSpanElement | null) => {
    if (element) {
      slotElements.current.set(index, element);
    } else {
      slotElements.current.delete(index);
    }
  }, []);

  return { previousSlotMeasures, setSlotRef };
}
