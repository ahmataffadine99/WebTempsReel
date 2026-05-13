import React, { createContext, useContext, useState } from 'react';

type Section = 'dashboard' | 'messages' | 'news';

interface NavContextType {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const NavContext = createContext<NavContextType>({
  activeSection: 'dashboard',
  setActiveSection: () => {},
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export const useNav = () => useContext(NavContext);

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <NavContext.Provider value={{ activeSection, setActiveSection, isSidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </NavContext.Provider>
  );
};