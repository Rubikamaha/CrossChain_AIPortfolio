import { useState, useEffect } from 'react';
import { openConnectModal, disconnect as walletDisconnect, modal } from '@/lib/walletConnect';
import { useToast } from '@/hooks/use-toast';

export function useWallet() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState<string | null>(null);
    const { toast } = useToast();

    // Subscribe to AppKit account state for a single source of truth
    useEffect(() => {
        const unsubscribe = modal.subscribeAccount((state) => {
            setAccount(state.address || null);
            setIsConnected(state.isConnected);
        });

        return () => {
            if (typeof unsubscribe === 'function') (unsubscribe as any)();
        };
    }, []);

    const connect = () => {
        openConnectModal();
        // optimistic update
        setIsConnected(true);
    };

    const disconnect = async () => {
        setIsConnected(false);
        setAccount(null);
        try {
            await walletDisconnect();
        } catch (err) {
            console.error('Disconnect error', err);
        }
    };

    return {
        isConnected,
        account,
        connect,
        disconnect
    };
}
