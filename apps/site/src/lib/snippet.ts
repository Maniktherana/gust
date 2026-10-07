// Builds the small live JSX snippets shown beside each reference panel.

export type SnippetValue = boolean | number | string | { expression: string } | undefined;

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function formatAttribute(name: string, value: SnippetValue) {
  if (value === undefined) return null;
  if (value === true) return name;
  if (value === false) return `${name}={false}`;
  if (typeof value === "number") return `${name}={${formatNumber(value)}}`;
  if (typeof value === "string") return `${name}=${JSON.stringify(value)}`;

  return `${name}={${value.expression}}`;
}

export function expression(source: string) {
  return { expression: source };
}

export function gustSnippet(attributes: [string, SnippetValue][]) {
  const lines = attributes
    .map(([name, value]) => formatAttribute(name, value))
    .filter((line): line is string => line !== null);

  if (lines.length <= 1) return `<Gust ${lines.join(" ")} />`;

  return `<Gust\n  ${lines.join("\n  ")}\n/>`;
}
