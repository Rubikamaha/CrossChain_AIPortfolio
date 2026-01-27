import React, { createContext, useContext, useState, useEffect } from 'react';

export type RiskPersonality = 'Conservative' | 'Balanced' | 'Aggressive';
export type PreferredCurrency = 'USD' | 'INR';
export type LearningMode = 'Beginner' | 'Expert';

interface ProfileState {
    riskPersonality: RiskPersonality;
    preferredCurrency: PreferredCurrency;
    learningMode: LearningMode;
    notifications: {
        highRiskAlert: boolean;
        imbalanceAlert: boolean;
    };
    activity: {
        lastSyncTime: string | null;
        lastAIInsightTime: string | null;
        rebalanceCount: number;
        healthScore: number;
        healthExplanation: string;
    };
}

interface ProfileContextType extends ProfileState {
    setRiskPersonality: (risk: RiskPersonality) => void;
    setPreferredCurrency: (currency: PreferredCurrency) => void;
    setLearningMode: (mode: LearningMode) => void;
    toggleNotification: (key: keyof ProfileState['notifications']) => void;
    updateSyncTime: () => void;
    updateAIInsightTime: () => void;
    incrementRebalanceCount: () => void;
    updateHealthScore: (score: number, explanation: string) => void;
}

const DEFAULT_STATE: ProfileState = {
    riskPersonality: 'Balanced',
    preferredCurrency: 'USD',
    learningMode: 'Beginner',
    notifications: {
        highRiskAlert: true,
        imbalanceAlert: true,
    },
    activity: {
        lastSyncTime: null,
        lastAIInsightTime: null,
        rebalanceCount: 0,
        healthScore: 0,
        healthExplanation: 'Connect and analyze your portfolio to see your health score.',
    },
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ProfileState>(() => {
        const saved = localStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : DEFAULT_STATE;
    });

    useEffect(() => {
        localStorage.setItem('user_profile', JSON.stringify(state));
    }, [state]);

    const setRiskPersonality = (risk: RiskPersonality) => setState(prev => ({ ...prev, riskPersonality: risk }));
    const setPreferredCurrency = (currency: PreferredCurrency) => setState(prev => ({ ...prev, preferredCurrency: currency }));
    const setLearningMode = (mode: LearningMode) => setState(prev => ({ ...prev, learningMode: mode }));

    const toggleNotification = (key: keyof ProfileState['notifications']) =>
        setState(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
        }));

    const updateSyncTime = () =>
        setState(prev => ({
            ...prev,
            activity: { ...prev.activity, lastSyncTime: new Date().toISOString() }
        }));

    const updateAIInsightTime = () =>
        setState(prev => ({
            ...prev,
            activity: { ...prev.activity, lastAIInsightTime: new Date().toISOString() }
        }));

    const incrementRebalanceCount = () =>
        setState(prev => ({
            ...prev,
            activity: { ...prev.activity, rebalanceCount: prev.activity.rebalanceCount + 1 }
        }));

    const updateHealthScore = (score: number, explanation: string) =>
        setState(prev => ({
            ...prev,
            activity: { ...prev.activity, healthScore: score, healthExplanation: explanation }
        }));

    return (
        <ProfileContext.Provider value={{
            ...state,
            setRiskPersonality,
            setPreferredCurrency,
            setLearningMode,
            toggleNotification,
            updateSyncTime,
            updateAIInsightTime,
            incrementRebalanceCount,
            updateHealthScore,
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
