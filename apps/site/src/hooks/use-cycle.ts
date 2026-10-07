import * as React from "react";

type CycleState = {
  index: number;
  previousIndex: number;
};

// Steps through `values` on a timer.
export function useCycle(
  values: readonly string[],
  {
    hold,
    paused = false,
  }: {
    hold: (previous: string, current: string) => number;
    paused?: boolean;
  },
) {
  const [state, setState] = React.useState<CycleState>({ index: 0, previousIndex: 0 });
  const count = Math.max(values.length, 1);
  const current = values[state.index % count] ?? "";
  const previous = values[state.previousIndex % count] ?? "";
  const holdMs = hold(previous, current);

  const next = React.useCallback(() => {
    setState((last) => ({ index: (last.index + 1) % count, previousIndex: last.index }));
  }, [count]);

  React.useEffect(() => {
    if (paused || values.length < 2) return undefined;

    const timer = window.setTimeout(next, holdMs);

    return () => window.clearTimeout(timer);
  }, [holdMs, next, paused, state.index, values.length]);

  return {
    current,
    // The value after `current`, for charting a transition before it runs.
    upcoming: values[(state.index + 1) % count] ?? current,
    next,
    previous,
  };
}
