import * as React from "react";
import { cn } from "@/lib/utils";

const useLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function useScrollFade<T extends HTMLElement>(value?: unknown, axis: "x" | "y" = "x") {
  const ref = React.useRef<T>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const update = React.useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const offset = axis === "x" ? node.scrollLeft : node.scrollTop;
    const size = axis === "x" ? node.clientWidth : node.clientHeight;
    const contentSize = axis === "x" ? node.scrollWidth : node.scrollHeight;
    const start = offset > 1;
    const end = contentSize - size - offset > 1;
    setEdges((previous) =>
      previous.start === start && previous.end === end ? previous : { start, end },
    );
  }, [axis]);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) update();
    });
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [update, value]);

  const style: React.CSSProperties = {
    maskImage:
      edges.start || edges.end
        ? `linear-gradient(to ${axis === "x" ? "right" : "bottom"}, ${edges.start ? "transparent, #000 32px" : "#000 0px"}, ${edges.end ? "#000 calc(100% - 32px), transparent" : "#000 100%"})`
        : undefined,
  };
  return { ref, onScroll: update, style };
}

export function ScrollFade({
  children,
  className,
  style,
  onScroll,
  ...props
}: React.ComponentProps<"div">) {
  const fade = useScrollFade<HTMLDivElement>(children);
  return (
    <div
      {...props}
      ref={fade.ref}
      className={cn(
        "min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{ ...style, ...fade.style }}
      onScroll={(event) => {
        fade.onScroll();
        onScroll?.(event);
      }}
    >
      {children}
    </div>
  );
}

export function ScrollInput({
  className,
  style,
  onScroll,
  onChange,
  onSelect,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<"input">, "ref">) {
  const fade = useScrollFade<HTMLInputElement>(props.value);
  return (
    <div data-slot="scroll-input" className="min-w-0 rounded-lg bg-field">
      <input
        {...props}
        ref={fade.ref}
        className={cn(
          "block w-full min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
          "bg-transparent",
        )}
        style={{ ...style, ...fade.style }}
        onScroll={(event) => {
          fade.onScroll();
          onScroll?.(event);
        }}
        onChange={(event) => {
          onChange?.(event);
          fade.onScroll();
        }}
        onSelect={(event) => {
          onSelect?.(event);
          fade.onScroll();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          fade.onScroll();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          fade.onScroll();
        }}
      />
    </div>
  );
}
