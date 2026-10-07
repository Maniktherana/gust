"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";
import createGlobe, { type Globe } from "cobe";

const legSeconds = 56;
const metersPerSecond = 35;
const legMeters = legSeconds * metersPerSecond;
const arrivalHoldMs = 600;
export const flightMotion = {
  duration: 300,
  exitDuration: 220,
  stagger: 0,
  enterAngle: 90,
  exitAngle: 90,
  entranceBlur: 4,
  entranceOvershoot: 0,
  entranceHeight: 100,
  exitHeight: 100,
  exitBlur: 4,
  blur: true,
  scale: false,
} satisfies Omit<GustProps, "value">;
export const flightNumberMotion = { ...flightMotion } satisfies Omit<GustProps, "value">;

// Distance changes by seven metres every 200ms; seconds change once a second.
// Only this subtree changes; the globe and plane remain independent.
function FlightReadouts({
  motion,
  numberMotion,
  reducedMotion,
  running,
  updateInterval,
}: {
  motion: Omit<GustProps, "value">;
  numberMotion: Omit<GustProps, "value">;
  reducedMotion: boolean;
  running: boolean;
  updateInterval: number;
}) {
  const [remainingMeters, setRemainingMeters] = useState(legMeters);
  const elapsedMs = useRef(0);
  const remainingSeconds = Math.ceil(remainingMeters / metersPerSecond);
  const reducedReadoutMotion = reducedMotion
    ? {
        duration: 120,
        exitDuration: 100,
        stagger: 0,
        entranceOvershoot: 0,
        entranceHeight: 0,
        exitHeight: 0,
        exitBlur: 0,
        blur: false,
        scale: false,
      }
    : {};
  const readoutMotion = { ...flightMotion, ...motion, ...reducedReadoutMotion };
  const numberReadoutMotion = {
    ...flightNumberMotion,
    ...numberMotion,
    ...reducedReadoutMotion,
  };

  useEffect(() => {
    if (!running) return undefined;

    let previousTime = performance.now();
    const timer = window.setInterval(
      () => {
        const now = performance.now();
        elapsedMs.current += now - previousTime;
        previousTime = now;
        elapsedMs.current %= legSeconds * 1000 + arrivalHoldMs;
        const sampleMs = Math.floor(elapsedMs.current / updateInterval) * updateInterval;
        setRemainingMeters(
          Math.max(0, Math.round(legMeters - (sampleMs / 1000) * metersPerSecond)),
        );
      },
      Math.max(16, updateInterval),
    );

    return () => window.clearInterval(timer);
  }, [running, updateInterval]);

  return (
    <div className="absolute inset-x-6 bottom-8 flex items-end justify-between gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-white/60">Next waypoint</span>
        <span className="flex items-baseline gap-1.5 text-[28px] leading-none font-medium tabular-nums">
          <span className="inline-flex w-[2ch] justify-end">
            <Gust
              {...readoutMotion}
              value={String(remainingSeconds)}
              enterAngle={motion.enterAngle ?? 90}
              exitAngle={motion.exitAngle ?? 90}
            />
          </span>
          <span className="text-sm font-normal text-white/65">sec</span>
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-white/60">Distance remaining</span>
        <span className="flex items-baseline gap-1.5 text-[28px] leading-none font-medium tabular-nums">
          <span className="inline-flex w-[4ch] justify-end">
            <Gust
              {...numberReadoutMotion}
              value={String(remainingMeters)}
              enterAngle={numberMotion.enterAngle ?? 90}
              exitAngle={numberMotion.exitAngle ?? 90}
            />
          </span>
          <span className="text-sm font-normal text-white/65">m</span>
        </span>
      </div>
    </div>
  );
}

function FlightGlobe({ running }: { running: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const globe = useRef<Globe | null>(null);
  const rotation = useRef(0.75);
  // The drawn globe stands in only where WebGL is unavailable or lost. While COBE starts up the
  // card stays dark, so the drawn globe never flashes before the real one.
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const ready = status === "ready";
  const fallbackId = useId().replace(/:/g, "");

  useEffect(() => {
    const container = host.current;
    if (!container) return undefined;

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;left:50%;top:50%;display:block;transform:translate(-50%,-50%) rotate(90deg)";
    container.append(canvas);
    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
    };
    const context =
      canvas.getContext("webgl2", contextOptions) || canvas.getContext("webgl", contextOptions);
    if (!context || !("getExtension" in context)) {
      canvas.remove();
      setStatus("fallback");
      return undefined;
    }

    let lastWidth = 0;
    let lastHeight = 0;
    const initialPaints: number[] = [];
    let contextLost = false;
    const resize = () => {
      if (contextLost) return;
      const width = Math.round(container.clientWidth);
      const height = Math.round(container.clientHeight);
      if (!width || !height) {
        setStatus("loading");
        return;
      }
      if (globe.current && width === lastWidth && height === lastHeight) {
        setStatus("ready");
        return;
      }
      lastWidth = width;
      lastHeight = height;
      // Turn COBE's horizontal surface motion downward beneath the northbound
      // plane. Swap the render dimensions so the quarter-turn still fills the card.
      const renderWidth = height;
      const renderHeight = width;
      canvas.style.width = `${renderWidth}px`;
      canvas.style.height = `${renderHeight}px`;
      const scale = (Math.max(width, height) * 1.7) / renderHeight;
      const offset: [number, number] = [(height * 0.36) / scale, 0];

      try {
        if (globe.current) {
          globe.current.update({ width: renderWidth, height: renderHeight, scale, offset });
        } else {
          globe.current = createGlobe(canvas, {
            width: renderWidth,
            height: renderHeight,
            devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            phi: rotation.current,
            theta: 0.35,
            dark: 1,
            diffuse: 1.8,
            mapSamples: 24000,
            mapBrightness: 4,
            mapBaseBrightness: 0.06,
            baseColor: [0.45, 0.45, 0.45],
            markerColor: [0.9, 0.9, 0.9],
            glowColor: [0.035, 0.035, 0.035],
            scale,
            offset,
            markers: [],
            context: contextOptions,
          });
          // COBE has no map-ready event. Bounded repaints cover asynchronous
          // image decoding without leaving a loop running while paused.
          for (const delay of [100, 300, 1000, 2000]) {
            initialPaints.push(
              window.setTimeout(() => globe.current?.update({ phi: rotation.current }), delay),
            );
          }
        }
        setStatus("ready");
      } catch {
        globe.current?.destroy();
        globe.current = null;
        setStatus("fallback");
      }
    };
    const onContextLost = () => {
      contextLost = true;
      setStatus("fallback");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      initialPaints.forEach((timer) => window.clearTimeout(timer));
      globe.current?.destroy();
      globe.current = null;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    if (!running) {
      globe.current?.update({ phi: rotation.current });
      return undefined;
    }
    let frame = 0;
    let previousTime = performance.now();
    const animate = (now: number) => {
      // Time-based rotation keeps the same cruising speed on 60/120Hz screens.
      rotation.current =
        (rotation.current + (Math.min(now - previousTime, 64) / 60000) * Math.PI * 2) %
        (Math.PI * 2);
      previousTime = now;
      globe.current?.update({ phi: rotation.current });
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [running, ready]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#0c0c0c]">
      {status === "fallback" && (
        <svg
          viewBox="0 0 320 640"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id={`${fallbackId}-earth`} cx="48%" cy="30%" r="75%">
              <stop stopColor="#333333" />
              <stop offset="1" stopColor="#0c0c0c" />
            </radialGradient>
            <clipPath id={`${fallbackId}-sphere`}>
              <circle cx={380} cy={160} r={430} />
            </clipPath>
          </defs>
          <g transform="translate(320 0) rotate(90)" clipPath={`url(#${fallbackId}-sphere)`}>
            <rect width={640} height={320} fill={`url(#${fallbackId}-earth)`} />
            <g fill="#626262" opacity={0.65}>
              <path d="M-22 39 L44 8 L93 20 L113 55 L145 72 L134 98 L84 106 L57 139 L23 113 L-13 94 Z M72 137 L119 159 L133 202 L117 234 L105 278 L83 310 L65 272 L45 212 L51 165 Z" />
              <path d="M244 13 L301 0 L336 19 L371 10 L401 31 L466 4 L528 18 L551 55 L610 79 L620 121 L582 142 L548 119 L507 133 L486 168 L462 146 L443 106 L402 111 L377 87 L338 89 L330 119 L307 115 L292 81 L272 96 L251 66 Z M279 124 L330 117 L363 154 L358 200 L336 253 L304 271 L286 232 L265 187 L259 149 Z M491 170 L510 188 L524 219 L510 225 L492 203 Z M561 244 L606 225 L650 247 L644 297 L593 308 L557 282 Z" />
            </g>
            <g fill="none" stroke="#a3a3a3" opacity={0.12}>
              <path d="M-40 56 Q320 116 680 56 M-40 160 Q320 186 680 160 M-40 267 Q320 230 680 267" />
              <path d="M125 -80 Q223 155 139 430 M320 -80 L320 430 M515 -80 Q417 155 501 430" />
            </g>
          </g>
        </svg>
      )}
      <div
        ref={host}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}

// A globe-backed flight with the reference's paced, blurred readouts.
export function FlightExample({
  motion = flightMotion,
  numberMotion = flightNumberMotion,
  paused = false,
  updateInterval = 200,
}: {
  motion?: Omit<GustProps, "value">;
  numberMotion?: Omit<GustProps, "value">;
  paused?: boolean;
  updateInterval?: number;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hidden, setHidden] = useState(false);
  const running = !paused && inView && !reducedMotion && !hidden;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(media.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotionPreference();
    syncVisibility();
    media.addEventListener("change", syncMotionPreference);
    document.addEventListener("visibilitychange", syncVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    if (scene.current) observer.observe(scene.current);

    return () => {
      media.removeEventListener("change", syncMotionPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={scene}
      className="gust-flight-scene relative h-full min-h-64 w-full overflow-hidden rounded-xl text-white"
      style={{ clipPath: "inset(0 round var(--radius-xl))" }}
      data-running={running}
      aria-label="Flight toward the next waypoint"
    >
      <FlightGlobe running={running} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(12 12 12 / 20%), transparent 36%, rgb(12 12 12 / 35%))",
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-48">
        {/* Layered gradient masks from motion-primitives.com/docs/progressive-blur. */}
        {Array.from({ length: 8 }, (_, index) => {
          const stops = [0, 1, 2, 3].map(
            (step) =>
              `${step === 1 || step === 2 ? "black" : "transparent"} ${((index + step) / 9) * 100}%`,
          );
          const mask = `linear-gradient(180deg, ${stops.join(", ")})`;
          return (
            <div
              key={index}
              className="absolute -inset-x-0.5 -bottom-0.5 top-0"
              style={{
                backdropFilter: `blur(${index === 0 ? 0 : 2 ** (index - 3)}px)`,
                WebkitBackdropFilter: `blur(${index === 0 ? 0 : 2 ** (index - 3)}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}
        <div
          className="absolute -inset-x-0.5 -bottom-0.5 top-0"
          style={{
            background: "linear-gradient(to bottom, transparent, rgb(12 12 12 / 15%))",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[41%] left-1/2 -translate-x-1/2"
      >
        <div className="absolute top-9 left-[17px] h-28 w-px bg-gradient-to-b from-white/40 to-transparent" />
        <div className="absolute top-9 right-[17px] h-28 w-px bg-gradient-to-b from-white/40 to-transparent" />
        <svg viewBox="0 0 60 60" className="relative h-14 w-14" fill="none">
          <path
            d="M30 3 C27 3 26 8 26 13 L26 25 L6 37 L6 42 L26 35 L27 46 L20 51 L20 54 L30 51 L40 54 L40 51 L33 46 L34 35 L54 42 L54 37 L34 25 L34 13 C34 8 33 3 30 3 Z"
            fill="#f5f5f5"
          />
          <path d="M30 12 L30 44" stroke="#bdbdbd" strokeWidth={0.8} />
        </svg>
      </div>

      <FlightReadouts
        motion={motion}
        numberMotion={numberMotion}
        reducedMotion={reducedMotion}
        running={running}
        updateInterval={updateInterval}
      />
    </div>
  );
}
