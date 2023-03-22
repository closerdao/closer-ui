// make a simple React Context Provider for a config object
import { FC, PropsWithChildren, createContext } from 'react';

export const ConfigContext = createContext<Record<string, any> | null>(null);

export interface ConfigProps extends PropsWithChildren {
  config: Record<string, any>;
}

export const ConfigProvider: FC<ConfigProps> = ({ children, config }) => {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};
