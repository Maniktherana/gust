"use client";

import { createContext, useContext, useLayoutEffect, useRef } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { useScrollFade } from "@/components/ui/scroll-fade";

const IndicatorContext = createContext<{ current: boolean }>({ current: false });

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  ...props
}: TabsPrimitive.Root.Props) {
  const animateIndicator = useRef(false);
  const previousValue = useRef(value);
  if (previousValue.current !== value) {
    animateIndicator.current = true;
    previousValue.current = value;
  }
  return (
    <IndicatorContext value={animateIndicator}>
      <TabsPrimitive.Root
        {...props}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          onValueChange?.(next, details);
          if (!details.isCanceled) animateIndicator.current = details.reason === "none";
        }}
        data-slot="tabs"
        orientation={orientation}
        className={cn(
          "flex min-w-0 w-full gap-2",
          orientation === "horizontal" ? "flex-col" : "flex-row",
          className,
        )}
      />
    </IndicatorContext>
  );
}

function TabsIndicator({
  position,
  size,
}: {
  position: TabsPrimitive.Tab.Position;
  size: TabsPrimitive.Tab.Size;
}) {
  const pendingSelection = useContext(IndicatorContext);
  const reducedMotion = useReducedMotion();
  const previous = useRef({
    x: position.left,
    y: position.top,
    width: size.width,
    height: size.height,
  });
  const geometryChanged =
    previous.current.x !== position.left ||
    previous.current.y !== position.top ||
    previous.current.width !== size.width ||
    previous.current.height !== size.height;
  const animateSelection = geometryChanged && pendingSelection.current;
  useLayoutEffect(() => {
    if (geometryChanged) {
      pendingSelection.current = false;
      previous.current = {
        x: position.left,
        y: position.top,
        width: size.width,
        height: size.height,
      };
    }
  }, [geometryChanged, pendingSelection, position.left, position.top, size.width, size.height]);
  return (
    <motion.span
      data-slot="tabs-indicator"
      className="absolute top-0 left-0 rounded-lg bg-field"
      initial={false}
      animate={{ x: position.left, y: position.top, width: size.width, height: size.height }}
      transition={{
        type: "tween",
        duration: reducedMotion || !animateSelection ? 0 : 0.25,
        ease: [0.19, 1, 0.22, 1],
      }}
    />
  );
}

function TabsList({
  className,
  children,
  ref,
  onScroll,
  style,
  ...props
}: TabsPrimitive.List.Props) {
  const fade = useScrollFade<HTMLDivElement>();
  return (
    <TabsPrimitive.List
      activateOnFocus
      {...props}
      ref={(node) => {
        fade.ref.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      onScroll={(event) => {
        fade.onScroll();
        onScroll?.(event);
      }}
      style={(state) => ({
        ...(typeof style === "function" ? style(state) : style),
        ...fade.style,
      })}
      data-slot="tabs-list"
      className={(state) =>
        cn(
          "relative isolate flex w-full min-w-0 gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[orientation=vertical]:flex-col",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      <TabsPrimitive.Indicator
        className="pointer-events-none absolute inset-0 -z-10"
        render={(indicatorProps, { activeTabPosition, activeTabSize }) => (
          <span {...indicatorProps}>
            {activeTabPosition &&
              activeTabSize &&
              activeTabSize.width > 0 &&
              activeTabSize.height > 0 && (
                <TabsIndicator position={activeTabPosition} size={activeTabSize} />
              )}
          </span>
        )}
      />
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      {...props}
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg px-2.5 text-base font-normal text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/24 data-disabled:pointer-events-none data-disabled:opacity-50 data-active:text-foreground",
        className,
      )}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      {...props}
      data-slot="tabs-content"
      className={cn("min-w-0 outline-none", className)}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
