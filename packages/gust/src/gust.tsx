"use client";

// Gust animates text changes character by character: outgoing characters lift
// up and away while incoming ones ride in from below on a slight overshoot,
// with optional blur, per-character stagger, shared-prefix preservation and a
// width morph on the container. Dependency-free — the motion curves are
// sampled into Web Animations API keyframes. React only, no animation libraries.
//
// Two ways to drive it: pass `words` to cycle on an interval (or control the
// cycle with `index`), or pass `text` and Gust animates every change — button
// labels, statuses, prices, timestamps.

import * as React from "react";

import {
  displayCharacter,
  isWhitespaceCharacter,
  normalizeText,
  normalizeWords,
  resolveGustCharacterRenderState,
  splitCharacters,
  splitGraphemes,
  type GustCharacterEntry,
  type GustCharacterRenderState,
  type RenderedGustCharacter,
} from "./characters";
import type { GustCharacterMeasure } from "./measure";
import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  WORD_HOLD_MS,
  resolveGustConfig,
} from "./config";
import { buildEnterKeyframes, buildExitKeyframes, characterTransitionWindow } from "./keyframes";
import {
  useCharacterMeasurements,
  useEnterAnimations,
  useExitAnimations,
  useGustTransitionState,
  usePrefersReducedMotion,
  useRootWidthMorph,
} from "./hooks";

const defaultGustWords = ["a gust of wind", "a gust of words", "a gust of motion"] as const;

const fallbackWords = [""] as const;

type GustProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  blur?: boolean;
  duration?: number;
  entranceHeight?: number;
  entranceScale?: number;
  exitDuration?: number;
  exitHeight?: number;
  exitScale?: number;
  index?: number;
  interval?: number;
  preservePrefix?: boolean;
  scale?: boolean;
  stagger?: number;
  text?: string;
  words?: readonly string[];
};

function GustCharacterSlot({
  character,
  setEnterRef,
  setSlotRef,
}: {
  character: RenderedGustCharacter;
  setEnterRef: (index: number, element: HTMLSpanElement | null) => void;
  setSlotRef: (index: number, element: HTMLSpanElement | null) => void;
}) {
  return (
    <span
      data-animated={character.stable ? undefined : "true"}
      data-gust-part="slot"
      ref={(element) => setSlotRef(character.index, element)}
    >
      {character.stable ? (
        displayCharacter(character.character)
      ) : (
        <>
          <span aria-hidden="true" data-gust-part="placeholder">
            {displayCharacter(character.character)}
          </span>
          <span
            data-gust-character={character.character}
            data-gust-index={character.index}
            data-gust-part="glyph"
            ref={(element) => setEnterRef(character.index, element)}
          >
            {displayCharacter(character.character)}
          </span>
        </>
      )}
    </span>
  );
}

function GustExitingCharacters({
  previousMeasures,
  previousText,
  preservedPrefixLength,
  setExitRef,
  transitionKey,
}: {
  previousMeasures: Map<number, GustCharacterMeasure>;
  previousText: string;
  preservedPrefixLength: number;
  setExitRef: (
    key: string,
    element: HTMLSpanElement | null,
    order: number,
    measure: GustCharacterMeasure,
  ) => void;
  transitionKey: string;
}) {
  const previousCharacters = splitCharacters(previousText).filter(
    (character) =>
      character.index >= preservedPrefixLength && !isWhitespaceCharacter(character.character),
  );

  return (
    <>
      {previousCharacters.map((character, order) => {
        const previousMeasure = previousMeasures.get(character.index);

        if (!previousMeasure) return null;

        const elementKey = `${transitionKey}-${character.index}-${character.character}`;

        return (
          <span
            key={`out-${elementKey}`}
            aria-hidden="true"
            data-gust-part="exit"
            ref={(element) => setExitRef(elementKey, element, order, previousMeasure)}
          >
            {displayCharacter(character.character)}
          </span>
        );
      })}
    </>
  );
}

function Gust({
  blur = true,
  className,
  duration = DEFAULT_DURATION_MS,
  entranceHeight = DEFAULT_ENTRANCE_HEIGHT,
  entranceScale = DEFAULT_ENTRANCE_SCALE,
  exitDuration = DEFAULT_EXIT_DURATION_MS,
  exitHeight = DEFAULT_EXIT_HEIGHT,
  exitScale = DEFAULT_EXIT_SCALE,
  index: controlledIndex,
  interval = WORD_HOLD_MS,
  preservePrefix = true,
  scale = true,
  stagger = DEFAULT_STAGGER_MS,
  text,
  words = defaultGustWords,
  ...props
}: GustProps) {
  const reduceMotion = usePrefersReducedMotion();
  const normalizedWords = React.useMemo(() => normalizeWords(words), [words]);
  const safeWords = normalizedWords.length > 0 ? normalizedWords : fallbackWords;
  const [index, setIndex] = React.useState(0);
  const activeIndex = controlledIndex ?? index;
  const safeIndex = ((activeIndex % safeWords.length) + safeWords.length) % safeWords.length;
  const word = normalizeText(text ?? safeWords[safeIndex] ?? "");
  const transitionState = useGustTransitionState(word);
  const activeWord = transitionState.current;
  const previousText = transitionState.previous;
  const transitionKey = `${transitionState.version}-${safeIndex}-${activeWord}`;
  const characters = React.useMemo(() => splitCharacters(activeWord), [activeWord]);
  const rootElement = React.useRef<HTMLSpanElement>(null);
  const sizingElement = React.useRef<HTMLSpanElement>(null);

  const config = React.useMemo(
    () =>
      resolveGustConfig({
        blur,
        duration,
        entranceHeight,
        entranceScale,
        exitDuration,
        exitHeight,
        exitScale,
        scale,
        stagger,
      }),
    [
      blur,
      duration,
      entranceHeight,
      entranceScale,
      exitDuration,
      exitHeight,
      exitScale,
      scale,
      stagger,
    ],
  );
  const enterKeyframes = React.useMemo(
    () => buildEnterKeyframes(config, reduceMotion),
    [config, reduceMotion],
  );
  const exitKeyframes = React.useMemo(
    () => buildExitKeyframes(config, reduceMotion),
    [config, reduceMotion],
  );
  // Character identity across transitions is resolved once per version (and
  // per preservePrefix flip), cached in refs so re-renders mid-animation don't
  // re-key entrances.
  const characterEntries = React.useRef(new Map<number, GustCharacterEntry>());
  const characterRenderState = React.useRef<GustCharacterRenderState & { signature: string }>({
    characters: [],
    entries: new Map(),
    preservedPrefixLength: 0,
    signature: "",
    stablePrefixLength: 0,
  });
  const renderStateSignature = `${transitionState.version}-${preservePrefix ? "preserve" : "all"}`;

  if (characterRenderState.current.signature !== renderStateSignature) {
    const nextRenderState = resolveGustCharacterRenderState({
      activeWord,
      characters,
      config,
      preservePrefix,
      previousEntries: characterEntries.current,
      previousText,
      transitionVersion: transitionState.version,
    });

    characterEntries.current = nextRenderState.entries;
    characterRenderState.current = {
      ...nextRenderState,
      signature: renderStateSignature,
    };
  }

  const renderedCharacters = characterRenderState.current.characters;
  const preservedPrefixLength = characterRenderState.current.preservedPrefixLength;
  const longestWordLength = React.useMemo(
    () =>
      safeWords.reduce(
        (longest, next) =>
          Math.max(
            longest,
            splitGraphemes(next).filter((character) => !isWhitespaceCharacter(character)).length,
          ),
        0,
      ),
    [safeWords],
  );
  const rootTransitionDuration = Math.max(
    config.duration,
    characterTransitionWindow(
      activeWord,
      config.enterDuration,
      config.enterStagger,
      preservedPrefixLength,
    ),
    characterTransitionWindow(
      previousText,
      config.exitDuration,
      config.exitStagger,
      preservedPrefixLength,
    ),
  );

  // Hook call order preserves effect order: enter, exit, width, measurement.
  const setEnterRef = useEnterAnimations({
    enterKeyframes,
    enterStagger: config.enterStagger,
    renderedCharacters,
  });
  const setExitRef = useExitAnimations({
    exitKeyframes,
    exitStagger: config.exitStagger,
    version: transitionState.version,
  });
  useRootWidthMorph({
    activeWord,
    previousText,
    reduceMotion,
    rootElement,
    rootTransitionDuration,
    sizingElement,
    version: transitionState.version,
  });
  const { previousSlotMeasures, setSlotRef } = useCharacterMeasurements({
    activeWord,
    rootElement,
  });

  // The exit layer needs the slot measurements taken before this transition's
  // prefix-slide effect overwrites them — snapshot once per version, in render.
  const transitionExitMeasureSnapshot = React.useRef({
    measures: previousSlotMeasures.current,
    version: transitionState.version,
  });

  if (transitionExitMeasureSnapshot.current.version !== transitionState.version) {
    transitionExitMeasureSnapshot.current = {
      measures: previousSlotMeasures.current,
      version: transitionState.version,
    };
  }

  React.useEffect(() => {
    setIndex((current) => current % safeWords.length);
  }, [safeWords.length]);

  React.useEffect(() => {
    if (controlledIndex !== undefined || text !== undefined) return undefined;
    if (safeWords.length <= 1) return undefined;

    const enterWindowMs = config.enterDuration + longestWordLength * config.enterStagger;
    const exitWindowMs = config.exitDuration + longestWordLength * config.exitStagger;
    const transitionWindowMs = Math.max(config.duration, enterWindowMs, exitWindowMs);
    const resolvedInterval = Math.max(interval, transitionWindowMs + 700);
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeWords.length);
    }, resolvedInterval);

    return () => window.clearInterval(timer);
  }, [
    config.duration,
    config.enterDuration,
    config.enterStagger,
    config.exitDuration,
    config.exitStagger,
    controlledIndex,
    interval,
    longestWordLength,
    safeWords.length,
    text,
  ]);

  return (
    <span {...props} className={className} data-slot="gust" ref={rootElement}>
      <span data-gust-part="sr-only">{activeWord}</span>
      <span aria-hidden="true" data-gust-part="sizer" ref={sizingElement}>
        {activeWord}
      </span>
      <GustExitingCharacters
        previousMeasures={transitionExitMeasureSnapshot.current.measures}
        previousText={previousText}
        preservedPrefixLength={preservedPrefixLength}
        setExitRef={setExitRef}
        transitionKey={transitionKey}
      />
      <span aria-hidden="true" data-gust-part="text">
        {renderedCharacters.map((character) => (
          <GustCharacterSlot
            key={character.index}
            character={character}
            setEnterRef={setEnterRef}
            setSlotRef={setSlotRef}
          />
        ))}
      </span>
    </span>
  );
}

export { Gust, defaultGustWords };
export type { GustProps };
