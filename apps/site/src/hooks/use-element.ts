import * as React from "react";

// True while the element is on screen. Demos use it to stop their timers when
// scrolled away, so a long page of examples stays cheap.
export function useInView<T extends Element>(rootMargin = "120px") {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState({ height: 0, width: 0 });

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node) return undefined;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({ height: rect.height, width: rect.width });
    };

    update();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
