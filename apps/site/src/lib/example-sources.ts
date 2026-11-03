import headline from "@/components/demos/headline-demo.tsx?raw";
import status from "@/components/demos/status-demo.tsx?raw";
import copy from "@/components/demos/copy-demo.tsx?raw";
import otp from "@/components/demos/otp-demo.tsx?raw";
import ticker from "@/components/demos/ticker-demo.tsx?raw";
import livePrice from "@/components/examples/live-price.tsx?raw";
import guests from "@/components/examples/guests.tsx?raw";
import colors from "@/components/examples/color-swatches.tsx?raw";
import download from "@/components/examples/download.tsx?raw";
import livelinePatch from "../../patches/liveline@0.0.7.patch?raw";

function sourceFile(path: string, code: string) {
  return `## ${path}\n\n\`\`\`tsx\n${code.trim()}\n\`\`\``;
}

const examples: Record<string, { title: string; files: string[]; setup?: string }> = {
  headline: {
    title: "Headline",
    files: [sourceFile("components/demos/headline-demo.tsx", headline)],
  },
  status: { title: "Status", files: [sourceFile("components/demos/status-demo.tsx", status)] },
  copy: { title: "Copy", files: [sourceFile("components/demos/copy-demo.tsx", copy)] },
  otp: { title: "One-time code", files: [sourceFile("components/demos/otp-demo.tsx", otp)] },
  guests: {
    title: "Guest count",
    setup:
      "The example also uses lucide-react for its plus/minus icons. Install it with `npm install lucide-react`, or use your existing icons.",
    files: [sourceFile("components/examples/guests.tsx", guests)],
  },
  "color-swatches": {
    title: "Color picker",
    files: [sourceFile("components/examples/color-swatches.tsx", colors)],
  },
  download: {
    title: "File download",
    files: [sourceFile("components/examples/download.tsx", download)],
  },
  "live-price": {
    title: "Live price",
    setup: `Install the graph dependency with \`npm install liveline@0.0.7\`. Both files below are required. Adjust the TickerDemo import to your project's component path.\n\nThis example uses a package patch to hide Liveline's guides and time axis. Apply this diff with your package manager's patch mechanism; paths are relative to the liveline package root. Keep \`guides={false}\` in the component.\n\n\`\`\`diff\n${livelinePatch.trim()}\n\`\`\``,
    files: [
      sourceFile("components/demos/ticker-demo.tsx", ticker),
      sourceFile("components/examples/live-price.tsx", livePrice),
    ],
  },
};

export function getExampleSource(example: string): string {
  if (!Object.hasOwn(examples, example)) throw new Error(`Unknown Gust example: ${example}`);
  const { title, files, setup } = examples[example];
  return [
    `# ${title} example\n\nInstall Gust with \`npm install @maniktherana/gust\`. React is required. Gust includes its internal styles.\n\nThe following is the full source used on the Gust site. Styling uses Tailwind CSS and the site's semantic color tokens; adapt those classes to your project.`,
    setup,
    ...files,
    "Gust API: https://gust.manikrana.dev/gust.md",
  ]
    .filter(Boolean)
    .join("\n\n");
}
