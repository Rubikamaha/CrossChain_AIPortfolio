import React, { createContext, useContext, ReactNode } from 'react';
import { usePortfolioData, PortfolioMode } from '@/hooks/usePortfolioData';
import { useWallet } from '@/hooks/useWallet';
import { PortfolioData } from '@/lib/walletService';

interface PortfolioContextType {
  data: any; // Using any for now to match the processedData from usePortfolioData
  mode: PortfolioMode;
  isLoading: boolean;
  isConnected: boolean;
  account: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, account, connect, disconnect } = useWallet();
  const { data, mode, isLoading } = usePortfolioData();

  const value: PortfolioContextType = {
    data,
    mode,
    isLoading,
    isConnected,
    account,
    connect,
    disconnect,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
};
