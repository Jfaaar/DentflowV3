import React, { createContext, useContext } from 'react';

interface MobileMenuContextValue {
  openMobileMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue>({
  openMobileMenu: () => {},
});

export const MobileMenuProvider: React.FC<{
  openMobileMenu: () => void;
  children: React.ReactNode;
}> = ({ openMobileMenu, children }) => (
  <MobileMenuContext.Provider value={{ openMobileMenu }}>
    {children}
  </MobileMenuContext.Provider>
);

export const useMobileMenu = () => useContext(MobileMenuContext);
