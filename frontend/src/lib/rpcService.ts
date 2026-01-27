// RPC Service to communicate with backend proxy
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface RPCRequest {
    chainId: number;
    method: string;
    params?: any[];
}

export interface RPCResponse<T = any> {
    jsonrpc: string;
    id: number;
    result?: T;
    result_formatted?: any;
    error?: {
        code: number;
        message: string;
    };
}

export class RPCError extends Error {
    constructor(
        message: string,
        public code?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'RPCError';
    }
}

/**
 * Make an RPC call through the backend proxy
 */
export async function rpcCall<T = any>(
    chainId: number,
    method: string,
    params: any[] = []
): Promise<T> {
    try {
        const response = await fetch(`${BACKEND_URL}/rpc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chainId,
                method,
                params,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new RPCError(
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        const data: RPCResponse<T> = await response.json();
        console.log(`[rpcService] Result for ${method} on chain ${chainId}:`, data.result);

        if (data.error) {
            throw new RPCError(
                data.error.message,
                data.error.code,
                data.error
            );
        }

        return data.result as T;
    } catch (error) {
        if (error instanceof RPCError) {
            throw error;
        }

        // Network or other errors
        throw new RPCError(
            error instanceof Error ? error.message : 'Unknown RPC error',
            -1,
            error
        );
    }
}

/**
 * Get balance for an address on a specific chain
 */
export async function getBalance(
    chainId: number,
    address: string
): Promise<string> {
    return rpcCall<string>(chainId, 'eth_getBalance', [address, 'latest']);
}

/**
 * Get current block number for a chain
 */
export async function getBlockNumber(chainId: number): Promise<string> {
    return rpcCall<string>(chainId, 'eth_blockNumber', []);
}

/**
 * Get transaction count (nonce) for an address
 */
export async function getTransactionCount(
    chainId: number,
    address: string
): Promise<string> {
    return rpcCall<string>(chainId, 'eth_getTransactionCount', [address, 'latest']);
}

/**
 * Get chain ID from the RPC
 */
export async function getChainId(chainId: number): Promise<string> {
    return rpcCall<string>(chainId, 'eth_chainId', []);
}

/**
 * Fetch supported chains from backend
 */
export async function getSupportedChains(): Promise<any> {
    try {
        const response = await fetch(`${BACKEND_URL}/chains`);
        if (!response.ok) {
            throw new Error(`Failed to fetch chains: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching supported chains:', error);
        throw error;
    }
}

/**
 * Convert Wei to Ether (as number)
 */
export function weiToEther(wei: string | bigint): number {
    const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
    return Number(weiValue) / 1e18;
}

/**
 * Format balance with symbol
 */
export function formatBalance(wei: string | bigint, symbol: string = 'ETH', decimals: number = 4): string {
    const ether = weiToEther(wei);
    return `${ether.toFixed(decimals)} ${symbol}`;
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/chains`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}
