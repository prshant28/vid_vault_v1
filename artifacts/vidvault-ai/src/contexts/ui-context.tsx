import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  isAiSidebarOpen: boolean;
  setAiSidebarOpen: (isOpen: boolean) => void;
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
  isUrlModalOpen: boolean;
  setUrlModalOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isUrlModalOpen, setUrlModalOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        isAiSidebarOpen,
        setAiSidebarOpen,
        activeVideoId,
        setActiveVideoId,
        isUrlModalOpen,
        setUrlModalOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
