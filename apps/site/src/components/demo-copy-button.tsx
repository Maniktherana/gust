import { CopyButton } from "@/components/copy-button";

// Copies a prompt a coding agent can rebuild the demo from.
export function DemoCopyButton({ prompt, title }: { prompt: string; title: string }) {
  return (
    <CopyButton
      value={prompt}
      label={`Copy prompt for ${title}`}
      copiedLabel="Prompt copied"
      showLabel={false}
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground"
    />
  );
}
