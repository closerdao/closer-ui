import { twMerge } from 'tailwind-merge';

import Button from '../ui/Button';

interface UploadPhotoButtonProps {
  isMinimal?: boolean;
  isPrompt?: boolean;
  label?: string;
  getInputProps: any;
}

const UploadPhotoButton = ({
  isMinimal,
  isPrompt,
  label,
  getInputProps,
}: UploadPhotoButtonProps) => {
  return (
    <div
      className={`
      
      ${twMerge(
        ' top-0  left-0 w-full h-full items-center ',
        `${
          isMinimal
            ? ' h-[30px] w-[120px] visible'
            : 'absolute  w-full h-full invisible group-hover:visible flex  items-center justify-center'
        } `,
        `${
          isPrompt &&
          'absolute  w-full h-full invisible group-hover:visible flex '
        } `,
      )}     `}
    >
      <Button
        onClick={(e) => {
          e.preventDefault();
        }}
        size="small"
        className={` ${isMinimal ? '' : 'opacity-75'} `}
      >
        {isPrompt ? '+' : label}
      </Button>

      <input {...getInputProps()} className="w-full h-full" />
    </div>
  );
};

export default UploadPhotoButton;
