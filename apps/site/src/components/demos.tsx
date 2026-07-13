import * as React from "react";

import { CopyDemo } from "@/components/demos/copy-demo";
import { OtpDemo } from "@/components/demos/otp-demo";
import { StatusDemo } from "@/components/demos/status-demo";
import { TickerDemo } from "@/components/demos/ticker-demo";
import { cn } from "@/lib/utils";

function DemoBox({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div
      className={cn(
        "relative grid h-48 place-items-center overflow-hidden rounded-xl bg-surface-raised",
        padded && "px-6",
      )}
    >
      {children}
    </div>
  );
}

const demoBoxes = [
  { demo: CopyDemo, key: "copy" },
  { demo: StatusDemo, key: "status" },
  { demo: OtpDemo, key: "otp" },
  { demo: TickerDemo, key: "ticker" },
];

export function DemoGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {demoBoxes.map((box) => (
        <DemoBox key={box.key} padded={box.key !== "ticker"}>
          <box.demo />
        </DemoBox>
      ))}
    </div>
  );
}
