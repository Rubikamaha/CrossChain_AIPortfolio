import { useState, useEffect } from 'react';
import { openConnectModal, disconnect as walletDisconnect } from '@/lib/walletConnect';
import { useToast } from '@/hooks/use-toast';

export function useWallet() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState<string | null>(null);
    const { toast } = useToast();

    // Listen for adapter-driven disconnect events
    useEffect(() => {
        const onDisconnected = () => setIsConnected(false);
        window.addEventListener('wallet:disconnected', onDisconnected);
        return () => window.removeEventListener('wallet:disconnected', onDisconnected);
    }, []);

    // Read initial accounts from injected provider and listen for account changes
    useEffect(() => {
        const updateAccounts = (accounts: any) => {
            if (Array.isArray(accounts) && accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
            } else {
                setAccount(null);
                setIsConnected(false);
            }
        };

        // Try to get accounts via ethereum provider
        const tryInit = async () => {
            try {
                // @ts-ignore
                const provider = (window as any).ethereum;
                if (provider && provider.request) {
                    const accounts = await provider.request({ method: 'eth_accounts' });
                    updateAccounts(accounts);

                    // subscribe to account changes
                    provider.on('accountsChanged', updateAccounts);
                }
            } catch (e) {
                // ignore
            }
        };

        tryInit();

        // fallback: listen for custom connect events
        const onConnectEvent = (e: any) => {
            const maybeAccounts = e?.detail?.accounts || null;
            if (maybeAccounts) {
                updateAccounts(maybeAccounts);
            }
        };
        window.addEventListener('wallet:connected', onConnectEvent);

        return () => {
            window.removeEventListener('wallet:connected', onConnectEvent);
            // cleaning up provider listener is harder without ref reference, but okay for now
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
