import type { GustCharacterMeasure, GustRootRect } from "./measure";
import { measureElementRect, measureElementScale, measureGustCharacterSlots } from "./measure";
import { isWhitespaceCharacter, splitGraphemes } from "./characters";
import type { GustConfig } from "./config";
import { easingToCss, resolveLayoutDuration, resolveTransitionConfig } from "./config";
import { buildEnterKeyframes, buildExitKeyframes, withLeadIn } from "./keyframes";
import type { GustKeyframes } from "./keyframes";

export type GustExitAnchor = { element: HTMLSpanElement; left: number };

// GustText supplies entry identity on every slot and glyph it owns.
type GustEntryElement = HTMLSpanElement & { dataset: DOMStringMap & { gustEntry: string } };

type GlyphSnapshot = {
  key: string;
  element: HTMLSpanElement;
  text: string;
  measure: GustCharacterMeasure;
  visual?: { transform: string; opacity: string; blur: string };
};

export type GustSnapshot = {
  rect: GustRootRect;
  glyphs: GlyphSnapshot[];
};

export class GustAnimator {
  private entered = new Set<string>();
  private entrances = new Map<string, Animation>();
  private exits = new Map<HTMLSpanElement, Animation[]>();
  private layout: ReturnType<typeof animateGustLayout> | null = null;
  private media: MediaQueryList | null;
  private observer: ResizeObserver | null = null;
  private size: { width: number; height: number };
  private animated = true;
  private typography = "";

  constructor(
    private root: HTMLSpanElement,
    private sizer: HTMLSpanElement,
    private outgoing: HTMLSpanElement,
  ) {
    const view = root.ownerDocument.defaultView;
    this.media = view?.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    this.size = sizer.getBoundingClientRect();
    this.positionGlyphs();
    this.media?.addEventListener("change", this.onVisibility);
    root.ownerDocument.addEventListener("visibilitychange", this.onVisibility);
    root.ownerDocument.fonts?.addEventListener("loadingdone", this.onFonts);
    if (view?.ResizeObserver) {
      this.observer = new view.ResizeObserver(this.onResize);
      this.observer.observe(sizer);
    }
  }

  private onVisibility = () => {
    if (!this.canAnimate()) this.settle();
  };

  private onResize = () => {
    this.refresh();
  };

  private onFonts = () => {
    this.settle();
    this.positionGlyphs();
  };

  private typographySignature() {
    const style = this.root.ownerDocument.defaultView?.getComputedStyle(this.sizer);
    return style
      ? [style.font, style.letterSpacing, style.wordSpacing, style.direction].join("|")
      : "";
  }

  refresh() {
    const size = this.sizer.getBoundingClientRect();
    if (
      Math.abs(size.width - this.size.width) > 0.1 ||
      Math.abs(size.height - this.size.height) > 0.1 ||
      this.typographySignature() !== this.typography
    ) {
      this.settle();
      this.positionGlyphs();
    }
  }

  private positionGlyphs() {
    const text = this.sizer.firstChild;
    if (!text) return;
    const rootRect = this.root.getBoundingClientRect();
    const scale = measureElementScale(this.root, rootRect);
    const line = this.sizer.getBoundingClientRect();
    const range = this.root.ownerDocument.createRange();
    const graphemes = splitGraphemes(text.textContent ?? "");
    let offset = 0;
    const positions = graphemes.map((character) => {
      range.setStart(text, offset);
      offset += character.length;
      range.setEnd(text, offset);
      return range.getBoundingClientRect();
    });
    this.root
      .querySelectorAll<HTMLSpanElement>('[data-gust-part="slot"]')
      .forEach((slot, index) => {
        const position = positions[index];
        if (!position) return;
        slot.style.left = `${(position.left - rootRect.left) / scale.x}px`;
        slot.style.top = `${(line.top - rootRect.top) / scale.y}px`;
        slot.style.width = `${position.width / scale.x}px`;
        slot.style.height = `${line.height / scale.y}px`;
      });
    this.root.dataset.gustReady = "true";
    this.size = this.sizer.getBoundingClientRect();
    this.typography = this.typographySignature();
  }

  private canAnimate() {
    return (
      this.animated &&
      !this.media?.matches &&
      !this.root.ownerDocument.hidden &&
      typeof this.root.animate === "function"
    );
  }

  setAnimated(animated: boolean) {
    this.animated = animated;
    if (!this.canAnimate()) this.settle();
  }

  snapshot(): GustSnapshot {
    const slots = new Map<string, HTMLSpanElement>();
    this.root.querySelectorAll<GustEntryElement>('[data-gust-part="slot"]').forEach((slot) => {
      slots.set(slot.dataset.gustEntry, slot);
    });
    const measures = measureGustCharacterSlots(this.root, slots);
    const glyphs: GlyphSnapshot[] = [];
    for (const [key, slot] of slots) {
      const element = slot.querySelector<HTMLSpanElement>('[data-gust-part="glyph"]');
      const measure = measures.get(key);
      if (!element || !measure) continue;
      const style = this.entrances.has(key)
        ? this.root.ownerDocument.defaultView?.getComputedStyle(element)
        : undefined;
      glyphs.push({
        key,
        element,
        text: element.textContent ?? "",
        measure,
        visual: style
          ? {
              transform: style.transform,
              opacity: style.opacity,
              blur: style.filter.startsWith("blur(") ? style.filter.slice(5, -1) : "0px",
            }
          : undefined,
      });
    }
    return { rect: measureElementRect(this.root), glyphs };
  }

  transition(snapshot: GustSnapshot, config: GustConfig) {
    const glyphs = Array.from(
      this.root.querySelectorAll<GustEntryElement>('[data-gust-part="glyph"]'),
    );
    const keys = new Set(glyphs.map((glyph) => glyph.dataset.gustEntry));
    const carried = new Map<Element, number>();
    for (const glyph of snapshot.glyphs) {
      if (keys.has(glyph.key)) carried.set(glyph.element, snapshot.rect.left + glyph.measure.x);
    }

    this.layout?.cancel();
    this.layout = null;
    this.positionGlyphs();
    for (const [key, animation] of this.entrances) {
      if (!keys.has(key)) {
        animation.onfinish = null;
        animation.cancel();
        this.entrances.delete(key);
      }
    }
    for (const key of this.entered) if (!keys.has(key)) this.entered.delete(key);
    if (!this.canAnimate()) {
      this.settle();
      for (const key of keys) this.entered.add(key);
      return;
    }

    const removed = snapshot.glyphs.filter(
      ({ key, text }) => !keys.has(key) && !isWhitespaceCharacter(text),
    );
    const entering = glyphs.filter(
      (glyph) =>
        glyph.dataset.gustStable !== "true" &&
        !isWhitespaceCharacter(glyph.textContent ?? "") &&
        !this.entered.has(glyph.dataset.gustEntry),
    );
    config = resolveTransitionConfig(config, entering.length, removed.length);
    if (removed.length) this.startExits(removed, snapshot.rect.left, config);

    const enter = buildEnterKeyframes(config);
    entering.forEach((glyph, index) => {
      const key = glyph.dataset.gustEntry;
      const order = config.staggerDirection === "reverse" ? entering.length - index - 1 : index;
      glyph.style.transformOrigin = config.transformOrigin;
      const animation = this.play(glyph, enter, config.enterDelay + order * config.enterStagger);
      this.entered.add(key);
      this.entrances.set(key, animation);
      animation.onfinish = () => {
        animation.onfinish = null;
        animation.cancel();
        this.entrances.delete(key);
      };
    });

    const target = measureElementRect(this.root);
    const anchors = Array.from(this.exits.keys(), (element) => ({
      element,
      left: Number(element.dataset.gustAnchor),
    }));
    const layoutDuration = resolveLayoutDuration(config, entering.length, removed.length);
    if (layoutDuration === 0) {
      for (const { element, left } of anchors) element.style.left = `${left - target.left}px`;
      return;
    }
    const layout = animateGustLayout({
      root: this.root,
      to: target,
      duration: layoutDuration,
      easing: easingToCss(config.layoutEasing),
      exits: anchors,
      carried,
    });
    if (!layout.animation) return;
    this.layout = layout;
    layout.animation.onfinish = () => {
      layout.cancel();
      if (this.layout === layout) this.layout = null;
    };
  }

  private play(element: HTMLSpanElement, motion: GustKeyframes, delay: number) {
    // Stagger is held in the keyframes, not WAAPI delay: WebKit otherwise skips
    // the first painted frames on quiet pages. CSS owns the settled state.
    const leadIn = withLeadIn(motion, delay);
    return element.animate(leadIn.keyframes, {
      duration: leadIn.duration,
      easing: "linear",
      fill: "backwards",
    });
  }

  private startExits(glyphs: GlyphSnapshot[], anchor: number, config: GustConfig) {
    const batch = this.root.ownerDocument.createElement("span");
    batch.dataset.gustPart = "exit-batch";
    batch.dataset.gustAnchor = String(anchor);
    this.outgoing.append(batch);
    const animations: Animation[] = [];
    this.exits.set(batch, animations);
    const exit = buildExitKeyframes(config);
    let remaining = glyphs.length;
    glyphs.forEach(({ text, measure, visual }, index) => {
      const element = this.root.ownerDocument.createElement("span");
      element.dataset.gustPart = "exit";
      element.textContent = text;
      element.style.color = measure.color;
      element.style.translate = `${measure.x}px ${measure.y}px`;
      element.style.transformOrigin = config.transformOrigin;
      batch.append(element);
      const order = config.staggerDirection === "reverse" ? glyphs.length - index - 1 : index;
      const delay = config.exitDelay + order * config.exitStagger;
      if (visual) {
        // Carry an interrupted entrance to rest independently of the exit curve.
        // This preserves its current transform without changing the default exit path.
        const carry = this.root.ownerDocument.createElement("span");
        carry.dataset.gustPart = "exit-carry";
        carry.style.translate = element.style.translate;
        element.style.translate = "none";
        carry.style.transformOrigin = config.transformOrigin;
        carry.style.width = `${measure.width}px`;
        carry.style.height = `${measure.height}px`;
        element.replaceWith(carry);
        carry.append(element);
        const carryAnimation = this.play(
          carry,
          {
            duration: exit.duration,
            keyframes: [
              {
                transform:
                  visual.transform === "none" ? "translate(0px, 0px) scale(1)" : visual.transform,
                opacity: visual.opacity,
                filter: `blur(${visual.blur})`,
              },
              {
                transform: "translate(0px, 0px) scale(1)",
                opacity: 1,
                filter: "blur(0px)",
              },
            ],
          },
          delay,
        );
        animations.push(carryAnimation);
      }
      const animation = this.play(element, exit, delay);
      animations.push(animation);
      animation.onfinish = () => {
        animation.onfinish = null;
        remaining -= 1;
        const wrapper = element.parentElement;
        if (wrapper?.dataset.gustPart === "exit-carry") wrapper.remove();
        else element.remove();
        if (remaining === 0) {
          for (const effect of animations) {
            effect.onfinish = null;
            effect.cancel();
          }
          batch.remove();
          this.exits.delete(batch);
        }
      };
    });
  }

  settle() {
    this.layout?.cancel();
    this.layout = null;
    for (const animation of this.entrances.values()) {
      animation.onfinish = null;
      animation.cancel();
    }
    this.entrances.clear();
    for (const [batch, animations] of this.exits) {
      for (const animation of animations) {
        animation.onfinish = null;
        animation.cancel();
      }
      batch.remove();
    }
    this.exits.clear();
  }

  destroy() {
    this.settle();
    this.entered.clear();
    this.observer?.disconnect();
    this.media?.removeEventListener("change", this.onVisibility);
    this.root.ownerDocument.removeEventListener("visibilitychange", this.onVisibility);
    this.root.ownerDocument.fonts?.removeEventListener("loadingdone", this.onFonts);
    delete this.root.dataset.gustReady;
  }
}

export function animateGustLayout({
  root,
  to,
  duration,
  easing,
  exits = [],
  carried,
}: {
  root: HTMLSpanElement;
  to: Pick<GustRootRect, "left" | "scale">;
  duration: number;
  easing: string;
  exits?: readonly GustExitAnchor[];
  /** Viewport x in the root's own CSS pixels, before the commit. */
  carried: ReadonlyMap<Element, number>;
}) {
  const effects: Animation[] = [];
  // New glyphs already occupy final layout. Only retained glyphs need a FLIP.
  root.querySelectorAll<HTMLSpanElement>('[data-gust-part="slot"]').forEach((slot) => {
    const glyph = slot.querySelector('[data-gust-part="glyph"]');
    const shown = glyph ? carried.get(glyph) : undefined;
    if (shown === undefined) return;
    const offset = shown - slot.getBoundingClientRect().left / to.scale;
    if (Math.abs(offset) <= 0.001) return;
    effects.push(
      slot.animate([{ transform: `translateX(${offset}px)` }, { transform: "translateX(0px)" }], {
        duration,
        easing,
        fill: "both",
      }),
    );
  });
  for (const { element, left } of exits) element.style.left = `${left - to.left}px`;

  return {
    animation: effects.at(0),
    cancel() {
      for (const effect of effects) {
        effect.onfinish = null;
        effect.cancel();
      }
    },
  };
}
