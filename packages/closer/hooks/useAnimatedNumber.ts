import { useEffect, useState } from 'react';

const animateNumber = (
  target: number,
  setValue: (value: number) => void,
  durationMs: number,
) => {
  let animationFrame = 0;
  const startedAt = performance.now();
  const animate = (now: number) => {
    const elapsed = now - startedAt;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    setValue(target * eased);
    if (t < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  };
  animationFrame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrame);
};

type UseAnimatedNumberOptions = {
  durationMs?: number;
  enabled?: boolean;
};

export const useAnimatedNumber = (
  target: number,
  options: UseAnimatedNumberOptions = {},
) => {
  const { durationMs = 1400, enabled = true } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(0);
      setIsAnimating(false);
      return;
    }
    setIsAnimating(true);
    const cleanup = animateNumber(target, setDisplayValue, durationMs);
    const doneTimer = window.setTimeout(() => {
      setIsAnimating(false);
    }, durationMs);
    return () => {
      cleanup();
      window.clearTimeout(doneTimer);
    };
  }, [target, durationMs, enabled]);

  return { displayValue, isAnimating };
};
