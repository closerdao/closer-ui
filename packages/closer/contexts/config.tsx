// make a simple React Context Provider for a config object
import { FC, PropsWithChildren, createContext } from 'react';

export const ConfigContext = createContext<any | null>(null);

export interface ConfigProps extends PropsWithChildren {
  config: any;
}

export const ConfigProvider: FC<ConfigProps> = ({ children, config }) => {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
