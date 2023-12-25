import { FC, MouseEventHandler } from 'react';

interface Props {
  color?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const CheckIcon: FC<Props> = ({
  color = '000000',
  className,
  onClick,
}) => {
  return (
    <div className={`${className}`} onClick={onClick}>
      <svg
        width="24"
        height="25"
        viewBox="0 0 24 25"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20.6644 5.92106C21.0772 6.28798 21.1143 6.92005 20.7474 7.33283L10.0808 19.3328C9.89099 19.5463 9.61898 19.6685 9.33334 19.6685C9.04771 19.6685 8.7757 19.5463 8.58593 19.3328L3.2526 13.3328C2.88568 12.92 2.92286 12.288 3.33565 11.9211C3.74843 11.5541 4.3805 11.5913 4.74742 12.0041L9.33334 17.1633L19.2526 6.0041C19.6195 5.59132 20.2516 5.55414 20.6644 5.92106Z"
          fill={color}
        />
      </svg>
    </div>
  );
};
