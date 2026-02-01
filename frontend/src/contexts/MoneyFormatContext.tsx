import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MoneyFormatContextType {
  useManwon: boolean;
  toggleFormat: () => void;
}

const MoneyFormatContext = createContext<MoneyFormatContextType>({
  useManwon: true,
  toggleFormat: () => {},
});

export const useMoneyFormat = () => useContext(MoneyFormatContext);

interface Props {
  children: ReactNode;
}

export const MoneyFormatProvider: React.FC<Props> = ({ children }) => {
  const [useManwon, setUseManwon] = useState(true);

  const toggleFormat = useCallback(() => {
    setUseManwon(prev => !prev);
  }, []);

  return (
    <MoneyFormatContext.Provider value={{ useManwon, toggleFormat }}>
      {children}
    </MoneyFormatContext.Provider>
  );
};
