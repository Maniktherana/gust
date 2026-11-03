export async function highlightCode(code: string, lang = "tsx") {
  const { codeToHtml } = await import("shiki/bundle/full");
  return codeToHtml(code, {
    lang,
    themes: { dark: "vesper", light: "min-light" },
  });
}
