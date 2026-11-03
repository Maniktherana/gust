export type GustCharacter = {
  character: string;
  index: number;
};

export type GustCharacterEntry = {
  character: string;
  entryKey: string;
  order: number;
  stable: boolean;
};

export type RenderedGustCharacter = GustCharacter & GustCharacterEntry;

export type GustCharacterRenderState = {
  characters: RenderedGustCharacter[];
  entries: Map<number, GustCharacterEntry>;
  preservedPrefixLength: number;
  preservedSuffixLength: number;
};

export function isWhitespaceCharacter(character: string) {
  return /^\s+$/u.test(character);
}

export function normalizeText(text: string | number) {
  return String(text);
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function splitGraphemes(text: string) {
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

export function commonEdges(previous: string, next: string) {
  const before = splitGraphemes(previous);
  const after = splitGraphemes(next);
  const limit = Math.min(before.length, after.length);
  let prefix = 0;
  let suffix = 0;

  while (prefix < limit && before[prefix] === after[prefix]) prefix += 1;
  while (
    suffix < limit - prefix &&
    before[before.length - suffix - 1] === after[after.length - suffix - 1]
  )
    suffix += 1;

  return { prefix, suffix };
}

export function commonPrefixLength(previous: string, next: string) {
  return commonEdges(previous, next).prefix;
}

export function isForwardAppend(previous: string, next: string) {
  return (
    next !== previous && commonPrefixLength(previous, next) === splitGraphemes(previous).length
  );
}

export function splitCharacters(text: string): GustCharacter[] {
  return splitGraphemes(text).map((character, index) => ({ character, index }));
}

export function displayCharacter(character: string) {
  return character;
}

export function resolveGustCharacterRenderState({
  activeWord,
  preservePrefix,
  previousEntries,
  previousText,
  transitionVersion,
}: {
  activeWord: string;
  preservePrefix: boolean;
  previousEntries: Map<number, GustCharacterEntry>;
  previousText: string;
  transitionVersion: number;
}): GustCharacterRenderState {
  const characters = splitCharacters(activeWord);
  const previousLength = splitGraphemes(previousText).length;
  const { prefix, suffix } = preservePrefix
    ? commonEdges(previousText, activeWord)
    : { prefix: 0, suffix: 0 };
  const entries = new Map<number, GustCharacterEntry>();
  let order = 0;

  const rendered = characters.map((character) => {
    const previousIndex =
      character.index < prefix
        ? character.index
        : character.index >= characters.length - suffix
          ? previousLength - (characters.length - character.index)
          : -1;
    const retained = previousEntries.get(previousIndex);
    const stable = transitionVersion === 0 || isWhitespaceCharacter(character.character);
    const entry = retained ?? {
      character: character.character,
      entryKey: `${transitionVersion}-${character.index}`,
      order: stable ? 0 : order++,
      stable,
    };
    entries.set(character.index, entry);
    return { ...character, ...entry };
  });

  return {
    characters: rendered,
    entries,
    preservedPrefixLength: transitionVersion === 0 ? characters.length : prefix,
    preservedSuffixLength: suffix,
  };
}
