// src/contexts/ModalContext.tsx
import React, { createContext, useContext } from 'react';

const ModalContext = createContext({ /* your modal state */ });

export const useModalContext = () => useContext(ModalContext);
export const ModalProvider = ({ children }: { children: React.ReactNode }) => (
  <ModalContext.Provider value={{ /* provide values */ }}>
    {children}
  </ModalContext.Provider>
);