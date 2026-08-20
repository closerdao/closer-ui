import { useEffect, useMemo, useState } from 'react';

const CONFETTI_COLORS = [
  '#58b741',
  '#e4427d',
  '#e8ab1b',
  '#1b3bc3',
  '#9333ea',
  '#0891b2',
];

const FAIL_COLORS = ['#6b7280', '#9ca3af', '#4b5563', '#374151', '#d1d5db'];

type ConfettiVariant = 'celebrate' | 'fail' | 'vote';

export interface ConfettiOrigin {
  x: number;
  y: number;
}

interface GovernanceConfettiProps {
  active: boolean;
  intensity?: number;
  variant?: ConfettiVariant;
  durationMs?: number;
  /**
   * Viewport coordinates the burst radiates from. Defaults to the middle of
   * the screen when omitted.
   */
  origin?: ConfettiOrigin | null;
  onComplete?: () => void;
}

interface ConfettiParticle {
  id: number;
  left: string;
  top: string;
  color: string;
  tx: number;
  ty: number;
  rotation: number;
  size: number;
  delay: number;
}

const clampIntensity = (value: number) => Math.min(1, Math.max(0, value));

const createParticles = (
  count: number,
  variant: ConfettiVariant,
  origin?: ConfettiOrigin | null,
): ConfettiParticle[] => {
  const colors = variant === 'fail' ? FAIL_COLORS : CONFETTI_COLORS;

  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.8;
    const distance =
      variant === 'vote'
        ? 80 + Math.random() * 180
        : 120 + Math.random() * 320;
    const tx = Math.cos(angle) * distance;
    const ty =
      variant === 'fail'
        ? 120 + Math.random() * 280
        : Math.sin(angle) * distance - (variant === 'celebrate' ? 40 : 0);

    // Jitter keeps the burst from looking like it fires out of a single pixel.
    const jitterX = (Math.random() - 0.5) * 12;
    const jitterY = (Math.random() - 0.5) * 12;

    return {
      id: index,
      left: origin
        ? `${origin.x + jitterX}px`
        : `${40 + Math.random() * 20}%`,
      top: origin
        ? `${origin.y + jitterY}px`
        : `${variant === 'vote' ? 70 + Math.random() * 10 : 45 + Math.random() * 10}%`,
      color: colors[index % colors.length],
      tx,
      ty,
      rotation: (Math.random() - 0.5) * 720,
      size: variant === 'vote' ? 6 + Math.random() * 4 : 8 + Math.random() * 6,
      delay: Math.random() * 0.25,
    };
  });
};

const GovernanceConfetti = ({
  active,
  intensity = 0.5,
  variant = 'celebrate',
  durationMs = 2200,
  origin = null,
  onComplete,
}: GovernanceConfettiProps) => {
  const [burstKey, setBurstKey] = useState(0);
  const normalizedIntensity = clampIntensity(intensity);

  useEffect(() => {
    if (active) {
      setBurstKey((current) => current + 1);
    }
  }, [active, intensity, variant]);

  useEffect(() => {
    if (!active || !onComplete) {
      return;
    }

    const timeoutId = window.setTimeout(onComplete, durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [active, burstKey, durationMs, onComplete]);

  const particleCount = useMemo(() => {
    if (variant === 'vote') {
      return Math.round(8 + normalizedIntensity * 48);
    }

    if (variant === 'fail') {
      return Math.round(24 + normalizedIntensity * 36);
    }

    return Math.round(36 + normalizedIntensity * 72);
  }, [normalizedIntensity, variant]);

  const particles = useMemo(
    () => createParticles(particleCount, variant, origin),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey, particleCount, variant, origin?.x, origin?.y],
  );

  if (!active) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className={`governance-confetti ${variant === 'vote' ? 'governance-confetti--vote' : ''}`}
        key={burstKey}
      >
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`governance-confetti__particle governance-confetti__particle--${variant}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              marginLeft: `${-particle.size / 2}px`,
              marginTop: `${-particle.size / 2}px`,
              background: particle.color,
              animationDelay: `${particle.delay}s`,
              ['--tx' as string]: `${particle.tx}px`,
              ['--ty' as string]: `${particle.ty}px`,
              ['--r' as string]: `${particle.rotation}deg`,
              animationDuration: `${durationMs / 1000}s`,
            }}
          />
        ))}
      </div>
      <style jsx global>{`
        .governance-confetti {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 60;
        }
        .governance-confetti--vote {
          z-index: 40;
        }
        .governance-confetti__particle {
          position: absolute;
          border-radius: 2px;
          opacity: 0;
        }
        .governance-confetti__particle--celebrate,
        .governance-confetti__particle--vote {
          animation: governance-confetti-burst ease-out forwards;
        }
        .governance-confetti__particle--fail {
          border-radius: 9999px;
          animation: governance-confetti-fall ease-in forwards;
        }
        @keyframes governance-confetti-burst {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(var(--r)) scale(0.8);
          }
        }
        @keyframes governance-confetti-fall {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(var(--r));
          }
        }
      `}</style>
    </>
  );
};

export default GovernanceConfetti;
