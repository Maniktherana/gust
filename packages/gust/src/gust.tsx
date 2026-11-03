"use client";

import * as React from "react";
import { normalizeText, resolveGustCharacterRenderState } from "./characters";
import type { GustCharacterRenderState } from "./characters";
import { resolveMotionOptions } from "./config";
import type { GustConfig, GustDirection, GustMotionOptions } from "./config";
import { GustAnimator } from "./hooks";
import type { GustSnapshot } from "./hooks";
import styles from "./gust.css?inline" with { type: "text" };

const styleMarkup = { __html: styles };

export type GustTag =
  | "span"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "strong"
  | "em"
  | "small"
  | "b"
  | "i"
  | "s"
  | "mark"
  | "label";

type GustContent =
  | { children: string | number; value?: never }
  | { children?: never; /** @deprecated Use text children. */ value: string | number };

type LegacyMotionProps = Pick<
  GustMotionOptions,
  | "blur"
  | "duration"
  | "enterAngle"
  | "entranceBlur"
  | "entranceHeight"
  | "entranceOvershoot"
  | "entranceBlurCap"
  | "entranceOffset"
  | "entranceScale"
  | "exitDuration"
  | "exitAngle"
  | "exitBlur"
  | "exitBlurCap"
  | "exitHeight"
  | "exitScale"
  | "scale"
  | "stagger"
>;

type GustOptions = LegacyMotionProps & {
  /** Options for authoring motion. These override the legacy flat motion props. */
  motion?: GustMotionOptions;
  animated?: boolean;
  /** Direction of travel; overrides angles and numeric trend when supplied. */
  direction?: GustDirection;
  /** Preserve matching prefix and suffix. Defaults to true. */
  preservePrefix?: boolean;
  /** Auto compares raw finite numbers only, never formatted strings. */
  trend?: "auto" | "up" | "down";
  /** @deprecated Use trend="down". */
  down?: boolean;
  /** CSP nonce for the automatic structural stylesheet. */
  nonce?: string;
};

export type GustProps<Tag extends GustTag = "span"> = GustOptions &
  GustContent & {
    as?: Tag;
  } & Omit<
    React.ComponentPropsWithoutRef<Tag>,
    keyof GustOptions | "as" | "children" | "value" | "dangerouslySetInnerHTML"
  >;

type TextProps = {
  input: string | number;
  config: GustConfig;
  options: GustMotionOptions;
  animated: boolean;
  trend: "auto" | "up" | "down";
  down: boolean;
  direction?: GustDirection;
};

type TextState = GustCharacterRenderState & { text: string; version: number };

export function resolveTrendConfig(
  options: GustMotionOptions,
  previous: string | number,
  next: string | number,
  trend: "auto" | "up" | "down",
  down: boolean,
  direction?: GustDirection,
) {
  const numeric =
    typeof previous === "number" &&
    Number.isFinite(previous) &&
    typeof next === "number" &&
    Number.isFinite(next) &&
    previous !== next;
  const numericDirection =
    trend === "auto" ? (numeric ? (next < previous ? "down" : "up") : undefined) : trend;
  const angle = numericDirection ? (numericDirection === "down" ? 90 : -90) : down ? 90 : -90;
  const directionAngle =
    direction === undefined ? undefined : { up: -90, down: 90, left: 180, right: 0 }[direction];
  return resolveMotionOptions({
    ...options,
    enterAngle: directionAngle ?? options.enterAngle ?? angle,
    exitAngle: directionAngle ?? options.exitAngle ?? angle,
  });
}

class GustText extends React.Component<TextProps, TextState> {
  private root = React.createRef<HTMLSpanElement>();
  private sizer = React.createRef<HTMLSpanElement>();
  private outgoing = React.createRef<HTMLSpanElement>();
  private animator: GustAnimator | null = null;

  state: TextState = {
    text: normalizeText(this.props.input),
    version: 0,
    ...resolveGustCharacterRenderState({
      activeWord: normalizeText(this.props.input),
      previousText: "",
      previousEntries: new Map(),
      preservePrefix: this.props.config.preserveMatching,
      transitionVersion: 0,
    }),
  };

  static getDerivedStateFromProps(props: TextProps, state: TextState): TextState | null {
    const text = normalizeText(props.input);
    if (text === state.text) return null;
    const version = state.version + 1;
    return {
      text,
      version,
      ...resolveGustCharacterRenderState({
        activeWord: text,
        previousText: state.text,
        previousEntries: state.entries,
        preservePrefix: props.config.preserveMatching,
        transitionVersion: version,
      }),
    };
  }

  componentDidMount() {
    const root = this.root.current;
    const sizer = this.sizer.current;
    const outgoing = this.outgoing.current;
    if (root && sizer && outgoing) {
      this.animator = new GustAnimator(root, sizer, outgoing);
      this.animator.setAnimated(this.props.animated);
    }
  }

  // React's snapshot lifecycle reads the committed, pre-mutation DOM, including a
  // running width morph. Render stays pure even when concurrent renders are discarded.
  getSnapshotBeforeUpdate(previous: TextProps): GustSnapshot | null {
    return normalizeText(previous.input) !== this.state.text
      ? (this.animator?.snapshot() ?? null)
      : null;
  }

  componentDidUpdate(previous: TextProps, _state: TextState, snapshot: GustSnapshot | null) {
    this.animator?.setAnimated(this.props.animated);
    if (snapshot) {
      this.animator?.transition(
        snapshot,
        resolveTrendConfig(
          this.props.options,
          previous.input,
          this.props.input,
          this.props.trend,
          this.props.down,
          this.props.direction,
        ),
      );
    } else {
      this.animator?.refresh();
    }
  }

  componentWillUnmount() {
    this.animator?.destroy();
    this.animator = null;
  }

  render() {
    return (
      <span data-gust-part="motion" ref={this.root}>
        <span data-gust-part="sr-only">{this.state.text}</span>
        <span aria-hidden="true" data-gust-part="sizer" ref={this.sizer}>
          {this.state.text || "\u200B"}
        </span>
        <span aria-hidden="true" data-gust-part="exit-layer" ref={this.outgoing} />
        <span aria-hidden="true" data-gust-part="text">
          {this.state.characters.map((character) => (
            <span
              key={character.entryKey}
              data-gust-entry={character.entryKey}
              data-animated={character.stable ? undefined : "true"}
              data-gust-part="slot"
            >
              <span
                data-gust-character={character.character}
                data-gust-entry={character.entryKey}
                data-gust-index={character.index}
                data-gust-stable={character.stable ? "true" : undefined}
                data-gust-part="glyph"
              >
                {character.character}
              </span>
            </span>
          ))}
        </span>
      </span>
    );
  }
}

// `as` selects the actual DOM tag; the public generic keeps its attributes and ref paired.
const Gust = React.forwardRef<HTMLElement, GustProps<GustTag>>(function Gust(
  {
    as = "span",
    children,
    value,
    motion,
    animated = true,
    direction,
    trend = "auto",
    down = false,
    nonce,
    blur,
    duration,
    enterAngle,
    entranceBlur,
    entranceHeight,
    entranceOvershoot,
    entranceBlurCap,
    entranceOffset,
    entranceScale,
    exitDuration,
    exitAngle,
    exitBlur,
    exitBlurCap,
    exitHeight,
    exitScale,
    preservePrefix,
    scale,
    stagger,
    ...props
  },
  forwardedRef,
) {
  if (children !== undefined && value !== undefined) {
    throw new TypeError("Gust accepts either children or value, not both.");
  }
  const input = children ?? value;
  if (typeof input !== "string" && typeof input !== "number") {
    throw new TypeError("Gust children must be a string or number.");
  }
  if ("dangerouslySetInnerHTML" in props) {
    throw new TypeError("Gust accepts plain text, not dangerouslySetInnerHTML.");
  }
  const options: GustMotionOptions = {
    blur,
    duration,
    enterAngle,
    entranceBlur,
    entranceHeight,
    entranceOvershoot,
    entranceBlurCap,
    entranceOffset,
    entranceScale,
    exitDuration,
    exitAngle,
    exitBlur,
    exitBlurCap,
    exitHeight,
    exitScale,
    preservePrefix,
    scale,
    stagger,
    ...motion,
    preserveMatching: preservePrefix ?? motion?.preserveMatching ?? motion?.preservePrefix,
  };
  const config = resolveMotionOptions(options);
  return React.createElement(
    as,
    { ...props, "data-slot": "gust", ref: forwardedRef },
    <style data-gust-styles="" nonce={nonce} dangerouslySetInnerHTML={styleMarkup} />,
    <GustText
      input={input}
      config={config}
      options={options}
      animated={animated}
      trend={trend}
      down={down}
      direction={direction}
    />,
  );
}) as <Tag extends GustTag = "span">(
  props: GustProps<Tag> & { ref?: React.ComponentPropsWithRef<Tag>["ref"] },
) => React.ReactElement;

export { Gust };
