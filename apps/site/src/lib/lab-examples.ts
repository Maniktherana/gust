import { DEFAULT_MOTION, type GustDirection, type GustMotionOptions } from "@maniktherana/gust";
import { headlines } from "@/components/demos/headline-demo";
import { statusSteps } from "@/components/demos/status-demo";
import { advanceOtp, otpDelay, type OtpState } from "@/components/demos/otp-demo";
import { tickerPrices } from "@/components/demos/ticker-demo";
import { demoCounts, guestCountDelay } from "@/components/examples/guests";
import { colors } from "@/components/examples/color-swatches";
import { downloadSteps, transferInterval, restartDelay } from "@/components/examples/download";

export type LabExample = {
  label: string;
  motion: GustMotionOptions;
  direction?: GustDirection;
  values: readonly string[];
  interval: (index: number, motion: GustMotionOptions) => number;
  className: string;
  numericValues?: readonly number[];
  initialIndex?: number;
  nextIndex?: (index: number) => number;
  suffix?: string;
};

const otpStates: OtpState[] = [];
const seenOtpStates = new Map<string, number>();
let otpState: OtpState = { code: "", phase: "typing", step: 0 };
let otpLoopStart: number;
while (true) {
  const key = JSON.stringify(otpState);
  const seen = seenOtpStates.get(key);
  if (seen !== undefined) {
    otpLoopStart = seen;
    break;
  }
  seenOtpStates.set(key, otpStates.length);
  otpStates.push(otpState);
  otpState = advanceOtp(otpState);
}

export const labExamples = {
  status: {
    label: "Status",
    motion: DEFAULT_MOTION,
    values: statusSteps.map((step) => step.label),
    interval: () => 2100,
    className: "text-xl font-semibold",
  },
  copy: {
    label: "Copy",
    motion: DEFAULT_MOTION,
    values: ["Copy", "Copied"],
    interval: (index) => (index === 0 ? 1600 : 1000),
    className: "text-sm font-medium",
  },
  headline: {
    label: "Headline",
    motion: DEFAULT_MOTION,
    values: headlines,
    interval: () => 2400,
    className: "text-3xl font-medium tracking-tight sm:text-4xl",
  },
  counter: {
    label: "Guest count",
    motion: DEFAULT_MOTION,
    values: demoCounts.map(String),
    numericValues: demoCounts,
    interval: (index) => guestCountDelay(demoCounts[index]),
    className: "text-4xl font-medium tabular-nums",
  },
  price: {
    label: "Live price",
    motion: DEFAULT_MOTION,
    values: tickerPrices.map((price) => `$${price.toFixed(2)}`),
    numericValues: tickerPrices,
    interval: () => 400 + Math.random() * 600,
    className: "text-xl font-semibold tabular-nums",
  },
  colors: {
    label: "Color picker",
    motion: DEFAULT_MOTION,
    direction: "left",
    values: colors,
    initialIndex: 4,
    interval: () => 2000,
    nextIndex: (index) => {
      const next = Math.floor(Math.random() * (colors.length - 1));
      return next >= index ? next + 1 : next;
    },
    className: "text-3xl font-medium tabular-nums",
  },
  download: {
    label: "Download · percentage",
    motion: DEFAULT_MOTION,
    values: Array.from({ length: downloadSteps + 1 }, (_, step) =>
      String(Math.round((step / downloadSteps) * 100)),
    ),
    interval: (index) => (index === downloadSteps ? restartDelay : transferInterval),
    className: "text-sm font-medium tabular-nums",
    suffix: "%",
  },
  downloadLabel: {
    label: "Download · label",
    motion: DEFAULT_MOTION,
    values: ["Download", "Downloading", "Downloaded"],
    interval: (index) => [1600, downloadSteps * transferInterval, restartDelay][index],
    nextIndex: (index) => (index === 2 ? 1 : index + 1),
    className: "text-sm font-medium",
  },
  otp: {
    label: "One-time code",
    motion: DEFAULT_MOTION,
    values: otpStates.map((state) => state.code),
    interval: (index, motion) => otpDelay(otpStates[index], motion),
    nextIndex: (index) => (index + 1 === otpStates.length ? otpLoopStart : index + 1),
    className: "font-sans text-3xl font-semibold tracking-widest tabular-nums",
  },
} satisfies Record<string, LabExample>;

export type LabExampleKey = keyof typeof labExamples;
