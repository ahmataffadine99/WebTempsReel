import React, { createContext, useContext, useState } from 'react';

type Section = 'dashboard' | 'messages' | 'news';

interface NavContextType {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const NavContext = createContext<NavContextType>({
  activeSection: 'dashboard',
  setActiveSection: () => {},
});

export const useNav = () => useContext(NavContext);

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  return (
    <NavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavContext.Provider>
  );
};
