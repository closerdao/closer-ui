import { FC } from 'react';

/**
 * The two sliders the residency tool runs on.
 *
 * Both paint the track as plain divs with theme classes and lay a transparent
 * `<input type="range">` over the top. The theme's colours are compiled into
 * Tailwind at build time rather than exposed as CSS variables, so a gradient
 * `background` on the input itself could only ever be a hard-coded hex.
 */

const THUMB_CLASSNAME =
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer';

const DISABLED_THUMB_CLASSNAME =
  '[&::-webkit-slider-thumb]:!bg-line [&::-moz-range-thumb]:!bg-line [&::-webkit-slider-thumb]:cursor-not-allowed';

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (value: number) => void;
}

export const RangeSlider: FC<RangeSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  disabled,
  ariaLabel,
  onChange,
}) => {
  const filled = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="relative h-6">
      <div className="absolute left-0 right-0 top-[9px] h-1.5 rounded-full bg-line" />
      {!disabled && (
        <div
          className="absolute left-0 top-[9px] h-1.5 rounded-full bg-accent"
          style={{ width: `${filled}%` }}
        />
      )}
      <input
        type="range"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`absolute inset-0 m-0 h-6 w-full cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-not-allowed ${THUMB_CLASSNAME} ${
          disabled ? DISABLED_THUMB_CLASSNAME : ''
        }`}
      />
    </div>
  );
};

interface DualRangeSliderProps {
  min: number;
  max: number;
  values: [number, number];
  /** Day offsets where a tick is drawn — the month boundaries. */
  marks?: number[];
  lowLabel: string;
  highLabel: string;
  onChange: (values: [number, number]) => void;
}

/**
 * Two overlaid range inputs. `pointer-events` is off on the tracks and back on
 * for the thumbs, so the lower thumb stays grabbable where the two overlap.
 */
export const DualRangeSlider: FC<DualRangeSliderProps> = ({
  min,
  max,
  values,
  marks = [],
  lowLabel,
  highLabel,
  onChange,
}) => {
  const [low, high] = values;
  const toPercent = (value: number) =>
    max > min ? ((value - min) / (max - min)) * 100 : 0;

  const inputClassName = `pointer-events-none absolute inset-0 m-0 h-6 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto ${THUMB_CLASSNAME}`;

  return (
    <div className="relative h-6">
      <div className="absolute left-0 right-0 top-[9px] h-1.5 rounded-full bg-line" />
      <div
        className="absolute top-[9px] h-1.5 rounded-full bg-accent"
        style={{
          left: `${toPercent(low)}%`,
          width: `${Math.max(0, toPercent(high) - toPercent(low))}%`,
        }}
      />
      {marks.map((mark) => (
        <div
          key={mark}
          aria-hidden
          className="absolute top-[6px] h-3 w-px bg-complimentary-light/40"
          style={{ left: `${toPercent(mark)}%` }}
        />
      ))}
      <input
        type="range"
        aria-label={lowLabel}
        min={min}
        max={max}
        value={low}
        className={inputClassName}
        onChange={(event) =>
          onChange([Math.min(Number(event.target.value), high), high])
        }
      />
      <input
        type="range"
        aria-label={highLabel}
        min={min}
        max={max}
        value={high}
        className={inputClassName}
        onChange={(event) =>
          onChange([low, Math.max(Number(event.target.value), low)])
        }
      />
    </div>
  );
};
