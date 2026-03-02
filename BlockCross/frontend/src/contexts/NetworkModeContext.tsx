// Network Mode Context for mainnet/testnet switching
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { NetworkMode } from '@/lib/chainConfig';

interface NetworkModeContextType {
    networkMode: NetworkMode;
    setNetworkMode: (mode: NetworkMode) => void;
    selectedChainId: number | null;
    setSelectedChainId: (chainId: number | null) => void;
}

const NetworkModeContext = createContext<NetworkModeContextType | undefined>(undefined);

const STORAGE_KEY = 'blockcross_network_mode';
const CHAIN_ID_KEY = 'blockcross_selected_chain_id';

export function NetworkModeProvider({ children }: { children: ReactNode }) {
    const [networkMode, setNetworkModeState] = useState<NetworkMode>(() => {
        // Load from localStorage or default to 'all'
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored as NetworkMode) || 'all';
    });

    const [selectedChainId, setSelectedChainIdState] = useState<number | null>(() => {
        const stored = localStorage.getItem(CHAIN_ID_KEY);
        return stored ? parseInt(stored) : null;
    });

    const setNetworkMode = (mode: NetworkMode) => {
        setNetworkModeState(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    };

    const setSelectedChainId = (chainId: number | null) => {
        setSelectedChainIdState(chainId);
        if (chainId) {
            localStorage.setItem(CHAIN_ID_KEY, chainId.toString());
        } else {
            localStorage.removeItem(CHAIN_ID_KEY);
        }
    }

    return (
        <NetworkModeContext.Provider value={{ networkMode, setNetworkMode, selectedChainId, setSelectedChainId }}>
            {children}
        </NetworkModeContext.Provider>
    );
}

export function useNetworkMode() {
    const context = useContext(NetworkModeContext);
    if (!context) {
        throw new Error('useNetworkMode must be used within NetworkModeProvider');
    }
    return context;
}
