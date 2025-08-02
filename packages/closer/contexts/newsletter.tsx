import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NewsletterContextType {
  isFloatingNewsletterActive: boolean;
  setFloatingNewsletterActive: (active: boolean) => void;
  hideFooterNewsletter: boolean;
  setHideFooterNewsletter: (hide: boolean) => void;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
};

interface NewsletterProviderProps {
  children: ReactNode;
}

export const NewsletterProvider: React.FC<NewsletterProviderProps> = ({ children }) => {
  const [isFloatingNewsletterActive, setFloatingNewsletterActive] = useState(false);
  const [hideFooterNewsletter, setHideFooterNewsletter] = useState(false);

  return (
    <NewsletterContext.Provider
      value={{
        isFloatingNewsletterActive,
        setFloatingNewsletterActive,
        hideFooterNewsletter,
        setHideFooterNewsletter,
      }}
    >
      {children}
    </NewsletterContext.Provider>
  );
}; 