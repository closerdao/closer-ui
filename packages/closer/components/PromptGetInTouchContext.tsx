import React, { createContext, useCallback, useState } from 'react';

export interface PromptGetInTouchContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const PromptGetInTouchContext =
  createContext<PromptGetInTouchContextType>({
    isOpen: false,
    setIsOpen: () => {},
  });

export const PromptGetInTouchProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const setIsOpenCallback = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <PromptGetInTouchContext.Provider
      value={{ isOpen, setIsOpen: setIsOpenCallback }}
    >
      {children}
    </PromptGetInTouchContext.Provider>
  );
};
