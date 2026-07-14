// Grapheme bookkeeping: splitting text into user-perceived characters, tracking
// the shared prefix between consecutive values, and deciding which entries keep
// their identity (and running entrance) across a transition.

import type { GustConfig } from "./config";

// Non-breaking space: a plain " " would be collapsed by HTML whitespace
// handling and render space slots at zero width.
const SPACE_GLYPH = "\u00A0";

export type GustCharacter = {
  character: string;
  index: number;
};

export type GustCharacterEntry = {
  character: string;
  entryKey: string;
  order: number;
  settleAt: number;
};

export type RenderedGustCharacter = GustCharacter & {
  entryKey: string;
  order: number;
  stable: boolean;
};

export type GustCharacterRenderState = {
  characters: RenderedGustCharacter[];
  entries: Map<number, GustCharacterEntry>;
  preservedPrefixLength: number;
  stablePrefixLength: number;
};

export function isWhitespaceCharacter(character: string) {
  return /^\s+$/u.test(character);
}

export function normalizeText(text: string) {
  return text.trim();
}

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function normalizeWords(words: readonly string[]) {
  return Array.from(words, normalizeText);
}

export function splitGraphemes(text: string) {
  if (!graphemeSegmenter) return Array.from(text);

  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

export function commonPrefixLength(previous: string, next: string) {
  const previousCharacters = splitGraphemes(previous);
  const nextCharacters = splitGraphemes(next);
  const maxLength = Math.min(previousCharacters.length, nextCharacters.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (previousCharacters[index] !== nextCharacters[index]) return index;
  }

  return maxLength;
}

export function isForwardAppend(previous: string, next: string) {
  const previousCharacters = splitGraphemes(previous);
  const nextCharacters = splitGraphemes(next);

  if (nextCharacters.length <= previousCharacters.length) return false;

  return previousCharacters.every((character, index) => nextCharacters[index] === character);
}

export function splitCharacters(text: string): GustCharacter[] {
  return splitGraphemes(text).map((character, index) => ({
    character,
    index,
  }));
}

export function displayCharacter(character: string) {
  return isWhitespaceCharacter(character) ? SPACE_GLYPH : character;
}

export function resolveGustCharacterRenderState({
  activeWord,
  characters,
  config,
  preservePrefix,
  previousEntries,
  previousText,
  transitionVersion,
}: {
  activeWord: string;
  characters: GustCharacter[];
  config: GustConfig;
  preservePrefix: boolean;
  previousEntries: Map<number, GustCharacterEntry>;
  previousText: string;
  transitionVersion: number;
}): GustCharacterRenderState {
  const now = Date.now();
  const preservedPrefixLength = preservePrefix ? commonPrefixLength(previousText, activeWord) : 0;
  const entries = new Map<number, GustCharacterEntry>();
  let stablePrefixLength = 0;
  let canExtendStablePrefix = true;
  let nextAnimatedOrder = 0;

  if (transitionVersion === 0) {
    characters.forEach((character) => {
      entries.set(character.index, {
        character: character.character,
        entryKey: `initial-${character.index}-${character.character}`,
        order: 0,
        settleAt: 0,
      });
    });

    return {
      characters: characters.map((character) => ({
        ...character,
        entryKey: `initial-${character.index}-${character.character}`,
        order: 0,
        stable: true,
      })),
      entries,
      preservedPrefixLength: characters.length,
      stablePrefixLength: characters.length,
    };
  }

  characters.forEach((character) => {
    const isWhitespace = isWhitespaceCharacter(character.character);
    const previousEntry = previousEntries.get(character.index);
    const preservesEntry =
      character.index < preservedPrefixLength && previousEntry?.character === character.character;
    const order = isWhitespace ? 0 : nextAnimatedOrder;
    const entry =
      preservesEntry && previousEntry
        ? previousEntry
        : {
            character: character.character,
            entryKey: `${transitionVersion}-${character.index}-${character.character}`,
            order,
            settleAt: isWhitespace ? 0 : now + order * config.enterStagger + config.enterDuration,
          };

    if (!preservesEntry && !isWhitespace) nextAnimatedOrder += 1;

    // A common-prefix character is only "stable" after its own entrance has landed.
    // Until then, keep its entryKey so the WAAPI loop can finish the full y/scale arc.
    if (canExtendStablePrefix && preservesEntry && entry.settleAt <= now) {
      stablePrefixLength += 1;
    } else {
      canExtendStablePrefix = false;
    }

    entries.set(character.index, entry);
  });

  return {
    characters: characters.map((character) => {
      const entry = entries.get(character.index);

      return {
        ...character,
        entryKey:
          entry?.entryKey ?? `${transitionVersion}-${character.index}-${character.character}`,
        order: entry?.order ?? Math.max(0, character.index - preservedPrefixLength),
        stable: isWhitespaceCharacter(character.character) || character.index < stablePrefixLength,
      };
    }),
    entries,
    preservedPrefixLength,
    stablePrefixLength,
  };
}
