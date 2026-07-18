"use client";

// Gust animates text changes character by character: outgoing characters travel
// away while incoming ones ride in on a slight overshoot,
// with optional exit blur, per-character stagger, shared-prefix preservation and a
// width morph on the container. React only, no animation libraries.
//
// Pass `value` as a normal controlled prop. Gust animates whenever the parent
// changes the string; scheduling and cycling stay in the parent component.

import * as React from "react";

import {
  displayCharacter,
  isWhitespaceCharacter,
  normalizeText,
  resolveGustCharacterRenderState,
  splitCharacters,
  type GustCharacterEntry,
  type GustCharacterRenderState,
  type RenderedGustCharacter,
} from "./characters";
import type { GustCharacterMeasure } from "./measure";
import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_OFFSET,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_BLUR_CAP,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
  resolveLayoutDuration,
} from "./config";
import { buildEnterKeyframes, buildExitKeyframes } from "./keyframes";
import {
  useCharacterMeasurements,
  useEnterAnimations,
  useExitAnimations,
  useGustTransitionState,
  useRootWidthMorph,
} from "./hooks";

type GustProps = Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  blur?: boolean;
  down?: boolean;
  duration?: number;
  enterAngle?: number;
  entranceHeight?: number;
  entranceOffset?: number;
  entranceScale?: number;
  exitDuration?: number;
  exitAngle?: number;
  exitBlurCap?: number;
  exitHeight?: number;
  exitScale?: number;
  preservePrefix?: boolean;
  scale?: boolean;
  stagger?: number;
  value: string;
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
            data-gust-animating="true"
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
            data-gust-animating="true"
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
  down = false,
  duration = DEFAULT_DURATION_MS,
  enterAngle,
  entranceHeight = DEFAULT_ENTRANCE_HEIGHT,
  entranceOffset = DEFAULT_ENTRANCE_OFFSET,
  entranceScale = DEFAULT_ENTRANCE_SCALE,
  exitDuration = DEFAULT_EXIT_DURATION_MS,
  exitAngle,
  exitBlurCap = DEFAULT_EXIT_BLUR_CAP,
  exitHeight = DEFAULT_EXIT_HEIGHT,
  exitScale = DEFAULT_EXIT_SCALE,
  preservePrefix = true,
  scale = true,
  stagger = DEFAULT_STAGGER_MS,
  value,
  ...props
}: GustProps) {
  const word = normalizeText(value);
  const transitionState = useGustTransitionState(word);
  const activeWord = transitionState.current;
  const previousText = transitionState.previous;
  const transitionKey = `${transitionState.version}-${activeWord}`;
  const characters = React.useMemo(() => splitCharacters(activeWord), [activeWord]);
  const rootElement = React.useRef<HTMLSpanElement>(null);
  const sizingElement = React.useRef<HTMLSpanElement>(null);

  const config = React.useMemo(
    () =>
      resolveGustConfig({
        blur,
        duration,
        enterAngle: enterAngle ?? (down ? 90 : DEFAULT_ENTER_ANGLE),
        entranceHeight,
        entranceOffset,
        entranceScale,
        exitDuration,
        exitAngle: exitAngle ?? (down ? 90 : DEFAULT_EXIT_ANGLE),
        exitBlurCap,
        exitHeight,
        exitScale,
        scale,
        stagger,
      }),
    [
      blur,
      down,
      duration,
      enterAngle,
      entranceHeight,
      entranceOffset,
      entranceScale,
      exitDuration,
      exitAngle,
      exitBlurCap,
      exitHeight,
      exitScale,
      scale,
      stagger,
    ],
  );
  const enterKeyframes = React.useMemo(() => buildEnterKeyframes(config), [config]);
  const exitKeyframes = React.useMemo(() => buildExitKeyframes(config), [config]);
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
  const rootWidthDuration = resolveLayoutDuration(config.duration);

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
    rootElement,
    rootWidthDuration,
    sizingElement,
    version: transitionState.version,
  });
  const { previousSlotMeasures, setSlotRef } = useCharacterMeasurements({
    activeWord,
    rootElement,
  });

  // The exit layer needs the outgoing slots' measurements. Snapshot the prior
  // render's measurements once per transition version.
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

  return (
    <span {...props} className={className} data-slot="gust" ref={rootElement}>
      <span data-gust-part="sr-only">{word}</span>
      <span aria-hidden="true" data-gust-part="sizer" ref={sizingElement}>
        {activeWord || "\u200B"}
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

export { Gust };
export type { GustProps };
