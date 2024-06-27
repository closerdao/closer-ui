import Button from '../../components/ui/Button';

import { Spinner } from '../ui';
import { __ } from '../../utils/helpers';

interface Props {
  onClick: () => void;
  isLoading: boolean;
}

const GoogleButton = ({ onClick, isLoading }: Props) => {
  return (
    <Button
      className="gap-2 border-[#747775] text-[#1F1F1F] normal-case"
      type="secondary"
          onClick={onClick}
          isEnabled={!isLoading}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.56 11.25C21.56 10.47 21.49 9.72 21.36 9H11V13.26H16.92C16.66 14.63 15.88 15.79 14.71 16.57V19.34H18.28C20.36 17.42 21.56 14.6 21.56 11.25Z"
          fill="#4285F4"
        />
        <path
          d="M11.0002 22.0001C13.9702 22.0001 16.4602 21.0201 18.2802 19.3401L14.7102 16.5701C13.7302 17.2301 12.4802 17.6301 11.0002 17.6301C8.14018 17.6301 5.71018 15.7001 4.84018 13.1001H1.18018V15.9401C2.99018 19.5301 6.70018 22.0001 11.0002 22.0001Z"
          fill="#34A853"
        />
        <path
          d="M4.84 13.0901C4.62 12.4301 4.49 11.7301 4.49 11.0001C4.49 10.2701 4.62 9.57007 4.84 8.91007V6.07007H1.18C0.43 7.55007 0 9.22007 0 11.0001C0 12.7801 0.43 14.4501 1.18 15.9301L4.03 13.7101L4.84 13.0901Z"
          fill="#FBBC05"
        />
        <path
          d="M11.0002 4.38C12.6202 4.38 14.0602 4.94 15.2102 6.02L18.3602 2.87C16.4502 1.09 13.9702 0 11.0002 0C6.70018 0 2.99018 2.47 1.18018 6.07L4.84018 8.91C5.71018 6.31 8.14018 4.38 11.0002 4.38Z"
          fill="#EA4335"
        />
      </svg>
      { __('google_button')}{' '}
        {isLoading ? <Spinner /> : null}
    </Button>
  );
};

export default GoogleButton;
