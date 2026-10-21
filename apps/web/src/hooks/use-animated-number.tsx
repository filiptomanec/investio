import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

// Eases a displayed number toward its target whenever the target changes,
// so results count up or down instead of jumping. Respects reduced motion.
export function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);
  const valueRef = useRef(target);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion()) {
      valueRef.current = target;
      setValue(target);
      return;
    }
    fromRef.current = valueRef.current;
    const start = performance.now();
    const from = fromRef.current;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutExpo: fast start, soft landing
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const v = from + (target - from) * e;
      valueRef.current = v;
      setValue(v);
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}

// Renders a formatted number that counts toward its value.
export function AnimatedNumber({
  value,
  format,
  duration,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const v = useAnimatedNumber(value, duration);
  return <>{format(v)}</>;
}
