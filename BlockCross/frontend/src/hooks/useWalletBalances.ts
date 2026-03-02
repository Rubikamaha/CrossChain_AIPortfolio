// Custom hook for fetching and managing wallet balances
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPortfolioData, type PortfolioData } from '@/lib/walletService';
import { getChainsByMode, type NetworkMode } from '@/lib/chainConfig';

interface UseWalletBalancesOptions {
    address: string | null;
    networkMode: NetworkMode;
    enabled?: boolean;
    refetchInterval?: number;
}

export function useWalletBalances({
    address,
    networkMode,
    enabled = true,
    refetchInterval = 30000, // 30 seconds default
}: UseWalletBalancesOptions) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['walletBalances', address, networkMode],
        queryFn: async (): Promise<PortfolioData> => {
            console.log(`[useWalletBalances] Query triggered. Address: ${address}, Mode: ${networkMode}`);
            if (!address) {
                console.log('[useWalletBalances] No address, skipping fetch.');
                throw new Error('No address provided');
            }

            // Get chains based on network mode
            const chains = getChainsByMode(networkMode);
            const chainIds = chains.map(c => c.chainId);
            console.log(`[useWalletBalances] Fetching for ${chainIds.length} chains:`, chainIds);

            // Fetch portfolio data
            const data = await getPortfolioData(address, chainIds);
            console.log(`[useWalletBalances] Fetch complete. Total value: ${data.totalValue}`);
            return data;
        },
        enabled: enabled && !!address,
        refetchInterval,
        staleTime: 20000, // Consider data stale after 20 seconds
        retry: 2,
        retryDelay: 1000,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['walletBalances', address, networkMode] });
    };

    return {
        ...query,
        portfolioData: query.data,
        refresh,
    };
}
