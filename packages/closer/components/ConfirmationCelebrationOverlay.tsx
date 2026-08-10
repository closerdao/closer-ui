const OVERLAY_FADE_MS = 500;

export const CONFIRMATION_CELEBRATION_DURATION_MS = 2800;

interface ConfirmationCelebrationOverlayProps {
  show: boolean;
  title: string;
}

function ConfirmationCelebrationOverlay({ show, title }: ConfirmationCelebrationOverlayProps) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        style={{
          opacity: show ? 1 : 0,
          pointerEvents: show ? 'auto' : 'none',
          transition: `opacity ${OVERLAY_FADE_MS}ms ease-out`,
        }}
      >
        <div className="confirmation-celebration__particles">
          {[...Array(24)].map((_, i) => (
            <span
              key={i}
              className="confirmation-celebration__particle"
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-success"
            style={{
              animation: show ? 'confirmation-check-pop 0.5s ease-out forwards' : 'none',
            }}
          >
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-center text-2xl font-semibold text-foreground max-w-md px-4">
            {title}
          </h2>
        </div>
      </div>
      <style jsx global>{`
        @keyframes confirmation-check-pop {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .confirmation-celebration__particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .confirmation-celebration__particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          margin-left: -4px;
          margin-top: -4px;
          border-radius: 2px;
          animation: confirmation-confetti 1.8s ease-out forwards;
          opacity: 0;
        }
        .confirmation-celebration__particle:nth-child(1) {
          background: #58b741;
          --tx: 120px;
          --ty: -80px;
          --r: 180deg;
        }
        .confirmation-celebration__particle:nth-child(2) {
          background: #e4427d;
          --tx: -100px;
          --ty: -100px;
          --r: -120deg;
        }
        .confirmation-celebration__particle:nth-child(3) {
          background: #e8ab1b;
          --tx: 90px;
          --ty: 100px;
          --r: 90deg;
        }
        .confirmation-celebration__particle:nth-child(4) {
          background: #1b3bc3;
          --tx: -130px;
          --ty: 60px;
          --r: -60deg;
        }
        .confirmation-celebration__particle:nth-child(5) {
          background: #58b741;
          --tx: 0;
          --ty: -150px;
          --r: 45deg;
        }
        .confirmation-celebration__particle:nth-child(6) {
          background: #e4427d;
          --tx: 140px;
          --ty: 20px;
          --r: 200deg;
        }
        .confirmation-celebration__particle:nth-child(7) {
          background: #e8ab1b;
          --tx: -80px;
          --ty: -120px;
          --r: -90deg;
        }
        .confirmation-celebration__particle:nth-child(8) {
          background: #1b3bc3;
          --tx: -110px;
          --ty: -50px;
          --r: 120deg;
        }
        .confirmation-celebration__particle:nth-child(9) {
          background: #58b741;
          --tx: 70px;
          --ty: -130px;
          --r: -30deg;
        }
        .confirmation-celebration__particle:nth-child(10) {
          background: #e4427d;
          --tx: -70px;
          --ty: 110px;
          --r: 150deg;
        }
        .confirmation-celebration__particle:nth-child(11) {
          background: #e8ab1b;
          --tx: 110px;
          --ty: -60px;
          --r: -180deg;
        }
        .confirmation-celebration__particle:nth-child(12) {
          background: #1b3bc3;
          --tx: 50px;
          --ty: 130px;
          --r: 60deg;
        }
        .confirmation-celebration__particle:nth-child(13) {
          background: #58b741;
          --tx: -140px;
          --ty: -30px;
          --r: -150deg;
        }
        .confirmation-celebration__particle:nth-child(14) {
          background: #e4427d;
          --tx: 80px;
          --ty: 90px;
          --r: 30deg;
        }
        .confirmation-celebration__particle:nth-child(15) {
          background: #e8ab1b;
          --tx: -90px;
          --ty: 80px;
          --r: -45deg;
        }
        .confirmation-celebration__particle:nth-child(16) {
          background: #1b3bc3;
          --tx: 130px;
          --ty: -100px;
          --r: 100deg;
        }
        .confirmation-celebration__particle:nth-child(17) {
          background: #58b741;
          --tx: -50px;
          --ty: -140px;
          --r: -100deg;
        }
        .confirmation-celebration__particle:nth-child(18) {
          background: #e4427d;
          --tx: 100px;
          --ty: 70px;
          --r: 0deg;
        }
        .confirmation-celebration__particle:nth-child(19) {
          background: #e8ab1b;
          --tx: -120px;
          --ty: 100px;
          --r: 75deg;
        }
        .confirmation-celebration__particle:nth-child(20) {
          background: #1b3bc3;
          --tx: 60px;
          --ty: -110px;
          --r: -75deg;
        }
        .confirmation-celebration__particle:nth-child(21) {
          background: #58b741;
          --tx: -60px;
          --ty: -90px;
          --r: 160deg;
        }
        .confirmation-celebration__particle:nth-child(22) {
          background: #e4427d;
          --tx: 150px;
          --ty: 50px;
          --r: -160deg;
        }
        .confirmation-celebration__particle:nth-child(23) {
          background: #e8ab1b;
          --tx: -150px;
          --ty: -70px;
          --r: 40deg;
        }
        .confirmation-celebration__particle:nth-child(24) {
          background: #1b3bc3;
          --tx: 40px;
          --ty: -120px;
          --r: -40deg;
        }
        @keyframes confirmation-confetti {
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
}

export default ConfirmationCelebrationOverlay;
