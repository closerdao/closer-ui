import Image from 'next/image';

import React from 'react';

interface InformationProps {
  children: React.ReactNode;
}

const Information = ({ children }: InformationProps) => {
  return (
    <div className="flex mt-3 ">
      <Image
        src="/images/icon-info.svg"
        width={17}
        height={17}
        alt="Information icon"
      />
      <p className="px-2 text-light text-xs pt-[2px]">{children}</p>
    </div>
  );
};

export default Information;
