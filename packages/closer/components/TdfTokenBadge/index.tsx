import clsx from 'clsx';

interface Props {
  className?: string;
  textClassName?: string;
}

const TdfTokenBadge = ({ className, textClassName }: Props) => {
  return (
    <span className={clsx('tdf-token-scene inline-flex', className)} aria-hidden>
      <span className="tdf-token-wrap">
        <span className="tdf-token-face tdf-token-front">
          <span
            className={clsx(
              'tdf-token-text text-[18px] font-black tracking-[0.14em] text-white',
              textClassName,
            )}
          >
            $TDF
          </span>
        </span>
      </span>
      <span className="tdf-token-sparkle tdf-token-sparkle-a">✦</span>
      <span className="tdf-token-sparkle tdf-token-sparkle-b">✧</span>
      <style jsx>{`
        .tdf-token-scene {
          position: relative;
          perspective: 800px;
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='12' fill='%23ff4fb7'/%3E%3Ctext x='14' y='18.2' text-anchor='middle' font-size='14' font-family='Arial, sans-serif' font-weight='700' fill='white'%3E%24%3C/text%3E%3C/svg%3E")
            14 14,
            pointer;
        }

        .tdf-token-wrap {
          width: 88px;
          height: 88px;
          position: relative;
          border-radius: 9999px;
          transform-style: preserve-3d;
          box-shadow:
            0 0 0 1px rgba(255, 126, 199, 0.28),
            0 8px 18px rgba(207, 70, 154, 0.22);
          animation: tdfTokenHoverMotion 2.1s ease-in-out infinite;
          transform-origin: center;
          will-change: transform;
          transition: filter 220ms ease;
        }

        .tdf-token-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          transform: translateZ(-2px);
          background: linear-gradient(145deg, #eba3d1 0%, #d874b4 60%, #c358a0 100%);
        }

        .tdf-token-face {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 236, 247, 0.5);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 -8px 12px rgba(117, 12, 74, 0.24);
          background:
            radial-gradient(circle at 28% 20%, rgba(255, 235, 248, 0.85) 0%, rgba(255, 235, 248, 0) 36%),
            linear-gradient(145deg, #f2add8 0%, #dd86c0 58%, #c863a7 100%);
          backface-visibility: hidden;
          overflow: hidden;
        }

        .tdf-token-face::before {
          content: '';
          position: absolute;
          inset: 6px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 233, 247, 0.34);
          box-shadow:
            inset 0 0 0 1px rgba(153, 39, 114, 0.1),
            0 0 0 1px rgba(255, 236, 248, 0.12);
          pointer-events: none;
        }

        .tdf-token-front {
          transform: translateZ(5px);
        }

        .tdf-token-text {
          text-shadow:
            0 1px 0 rgba(255, 255, 255, 0.28),
            0 0 9px rgba(255, 223, 244, 0.55);
        }

        .tdf-token-scene:hover .tdf-token-wrap {
          animation: tdfTokenHoverMotion 2.1s ease-in-out infinite;
          filter: saturate(1.12) brightness(1.05);
        }

        .tdf-token-sparkle {
          position: absolute;
          color: rgba(255, 244, 251, 0.95);
          text-shadow:
            0 0 7px rgba(255, 200, 232, 0.75),
            0 0 16px rgba(255, 118, 192, 0.48);
          pointer-events: none;
          opacity: 0;
          transform: scale(0.7);
          transition: opacity 180ms ease;
          will-change: transform, opacity;
        }

        .tdf-token-sparkle-a {
          top: -8px;
          right: -4px;
          font-size: 13px;
        }

        .tdf-token-sparkle-b {
          bottom: -6px;
          left: -3px;
          font-size: 11px;
        }

        .tdf-token-scene:hover .tdf-token-sparkle {
          opacity: 1;
        }

        .tdf-token-scene:hover .tdf-token-sparkle-a {
          animation: tdfSparkleFloatA 1.2s ease-in-out infinite;
        }

        .tdf-token-scene:hover .tdf-token-sparkle-b {
          animation: tdfSparkleFloatB 1.35s ease-in-out infinite;
        }

        @keyframes tdfTokenIdleMotion {
          0% {
            transform: rotateX(16deg) rotateY(-7deg) skewX(-0.45deg) scale(0.995);
          }
          50% {
            transform: rotateX(16deg) rotateY(7deg) skewX(0.45deg) scale(1.01);
          }
          100% {
            transform: rotateX(16deg) rotateY(-7deg) skewX(-0.45deg) scale(0.995);
          }
        }

        @keyframes tdfTokenHoverMotion {
          0% {
            transform: rotateX(16deg) rotateY(-9deg) skewX(-0.7deg) scale(1.03);
          }
          25% {
            transform: rotateX(16deg) rotateY(10deg) skewX(1deg) scale(1.08);
          }
          55% {
            transform: rotateX(16deg) rotateY(-11deg) skewX(-1.1deg) scale(1.11);
          }
          80% {
            transform: rotateX(16deg) rotateY(8deg) skewX(0.8deg) scale(1.07);
          }
          100% {
            transform: rotateX(16deg) rotateY(-9deg) skewX(-0.7deg) scale(1.03);
          }
        }

        @keyframes tdfSparkleFloatA {
          0% {
            transform: translateY(0) scale(0.75) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) scale(1.03) rotate(8deg);
          }
          100% {
            transform: translateY(0) scale(0.75) rotate(0deg);
          }
        }

        @keyframes tdfSparkleFloatB {
          0% {
            transform: translateY(0) scale(0.68) rotate(0deg);
          }
          50% {
            transform: translateY(-3px) scale(0.96) rotate(-10deg);
          }
          100% {
            transform: translateY(0) scale(0.68) rotate(0deg);
          }
        }
      `}</style>
    </span>
  );
};

export default TdfTokenBadge;
