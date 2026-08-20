"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type AnimatedNumberProps = {
  value: number;
  className?: string;
  duration?: number;
  format?: (value: number) => string;
};

const defaultFormat = (value: number) => Math.round(value).toLocaleString("en-US");

export function AnimatedNumber({
  value,
  className,
  duration = 0.34,
  format = defaultFormat,
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const previousRef = useRef(value);
  const finalText = format(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      node.textContent = finalText;
      previousRef.current = value;
      return;
    }

    const state = { value: previousRef.current };
    const tween = gsap.to(state, {
      value,
      duration,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        node.textContent = format(state.value);
      },
      onComplete: () => {
        node.textContent = finalText;
        previousRef.current = value;
      },
    });

    return () => {
      tween.kill();
      previousRef.current = value;
    };
  }, [duration, finalText, format, value]);

  return (
    <span className={className} aria-label={finalText}>
      <span ref={nodeRef} aria-hidden="true">{finalText}</span>
    </span>
  );
}
