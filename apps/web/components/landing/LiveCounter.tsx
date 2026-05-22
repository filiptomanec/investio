"use client";

import { useEffect, useRef, useState } from "react";

type LiveCounterProps = {
  /** Final value the counter animates to. */
  target: number;
  /** Total animation duration in ms. */
  durationMs?: number;
  /** Localized thousands separator (cs uses a non-breaking space, en uses ",") */
  thousandsSeparator?: string;
};

/**
 * Lightweight rolling-number counter — pure useEffect + requestAnimationFrame,
 * no animation lib. Respects `prefers-reduced-motion` by rendering the final
 * value immediately.
 *
 * Renders an aria-hidden visual counter plus an sr-only static label so
 * screen readers get the final value without the noisy interim numbers.
 */
export function LiveCounter({
  target,
  durationMs = 1400,
  thousandsSeparator = " ",
}: LiveCounterProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Honor reduced motion — jump straight to the final value.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  // Format with the chosen thousands separator (default: NBSP, cs convention).
  const formatted = value
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  return (
    <>
      <span aria-hidden="true">{formatted}</span>
      <span className="sr-only">{target.toLocaleString("cs-CZ")}</span>
    </>
  );
}
