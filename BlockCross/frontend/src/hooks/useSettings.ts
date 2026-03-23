import { useState, useEffect } from 'react';

export type RiskProfile = 'Conservative' | 'Balanced' | 'Aggressive';
export type NetworkModePreference = 'auto' | 'mainnet' | 'testnet';
export type CurrencyPreference = 'USD' | 'INR';

export interface TargetAllocation {
  ETH: number;
  USDC: number;
}

export interface PortfolioSettings {
  riskProfile: RiskProfile;
  targetAllocation: TargetAllocation;
  slippage: number;
  networkMode: NetworkModePreference;
  currency: CurrencyPreference;
}

const DEFAULT_SETTINGS: PortfolioSettings = {
  riskProfile: 'Balanced',
  targetAllocation: {
    ETH: 50,
    USDC: 50
  },
  slippage: 1,
  networkMode: 'auto',
  currency: 'USD'
};

const RISK_PROFILE_ALLOCATIONS: Record<RiskProfile, TargetAllocation> = {
  Conservative: { ETH: 20, USDC: 80 },
  Balanced: { ETH: 50, USDC: 50 },
  Aggressive: { ETH: 80, USDC: 20 }
};

export function useSettings() {
  const [settings, setSettings] = useState<PortfolioSettings>(() => {
    const saved = localStorage.getItem('portfolio_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('portfolio_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<PortfolioSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      
      // If risk profile changed, auto-update allocation
      if (updates.riskProfile && updates.riskProfile !== prev.riskProfile) {
        next.targetAllocation = RISK_PROFILE_ALLOCATIONS[updates.riskProfile];
      }
      
      return next;
    });
  };

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return { settings, updateSettings, resetSettings };
}
