"use client";

// Both layers stay mounted, so a quick reversal continues from the current
// shape. The first render is already settled; only a playback change animates.
export function PlaybackIcon({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-gust-playing={playing}
    >
      <style>{`
        [data-gust-playing] .gust-playback-layer {
          transform-box: view-box;
          transform-origin: 10px 10px;
          transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-gust-playing="false"] .gust-playback-play,
        [data-gust-playing="true"] .gust-playback-pause {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }
        [data-gust-playing="true"] .gust-playback-play {
          opacity: 0;
          transform: rotate(10deg) scale(0.9);
        }
        [data-gust-playing="false"] .gust-playback-pause {
          opacity: 0;
          transform: rotate(-10deg) scale(0.9);
        }
        @media (prefers-reduced-motion: reduce) {
          [data-gust-playing] .gust-playback-layer {
            transform: none;
            transition: opacity 120ms ease;
          }
        }
      `}</style>
      <g className="gust-playback-layer gust-playback-play">
        <path d="M6 4.8 C6 4.02 6.86 3.54 7.52 3.95 L15.6 8.96 C16.37 9.44 16.37 10.56 15.6 11.04 L7.52 16.05 C6.86 16.46 6 15.98 6 15.2 Z" />
      </g>
      <g className="gust-playback-layer gust-playback-pause">
        <rect x={5} y={4} width={3.6} height={12} rx={1} />
        <rect x={11.4} y={4} width={3.6} height={12} rx={1} />
      </g>
    </svg>
  );
}

export function SkipIcon({
  direction,
  className,
}: {
  direction: "previous" | "next";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g transform={direction === "previous" ? "translate(20 0) scale(-1 1)" : undefined}>
        <path d="M4 5.15 C4 4.38 4.85 3.9 5.5 4.32 L12.7 9.16 C13.3 9.56 13.3 10.44 12.7 10.84 L5.5 15.68 C4.85 16.1 4 15.62 4 14.85 Z" />
        <rect x={14} y={4} width={2.6} height={12} rx={0.9} />
      </g>
    </svg>
  );
}
