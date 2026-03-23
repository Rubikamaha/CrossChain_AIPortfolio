import { useState, useEffect } from "react";
import { parseIntent, ParsedIntent } from "../services/geminiParser";
import { executeSwap, swapETHToUSDC } from "../services/swapService";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { ethers } from "ethers";

export default function SwapAssistant() {
    const { data, mode, isConnected } = usePortfolioData();
    const [input, setInput] = useState("");
    const [preview, setPreview] = useState<ParsedIntent | null>(null);
    const [isTestnet, setIsTestnet] = useState(false);

    // States
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    useEffect(() => {
        const checkNetwork = async () => {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum as any);
                const network = await provider.getNetwork();
                setIsTestnet(network.chainId !== 1n);
            }
        };
        checkNetwork();
    }, [isConnected]);

    const handleParse = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setError(null);
        setPreview(null);
        setTxHash(null);

        try {
            const intent = await parseIntent(input);
            setPreview(intent);
        } catch (err: any) {
            setError(err.message || "Failed to process intent. Try rephrasing.");
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = async () => {
        if (!preview) return;

        // Confirmation Modal (Simple)
        const confirmed = window.confirm(`Confirm swap of ${preview.amountValue} ${preview.tokenIn} to ${preview.tokenOut}?`);
        if (!confirmed) return;

        setExecuting(true);
        setError(null);

        try {
            // Testnet Mode or Demo Mode simulation
            if (isTestnet || mode === 'DEMO') {
                // Simulation delay (2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));
                setTxHash("0xTESTNET123456789");
                setPreview(null);
                return;
            }

            // Real execution for Mainnet
            const tx = await executeSwap(preview);
            setTxHash(tx.hash);
            setPreview(null);
        } catch (err: any) {
            if (err.message.includes("rejected") || err.code === 4001) {
                setError("Transaction was rejected by wallet.");
            } else {
                setError(err.message || "Execution Failed.");
            }
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl max-w-lg mx-auto border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                🤖 AI Swap Assistant
            </h2>

            <p className="text-sm text-slate-400 mb-6 font-medium">
                Use natural language to trade. Ex: "Swap 0.1 ETH to USDC"
            </p>

            {/* Testnet Badge */}
            {isTestnet && (
                <div className="mb-4 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold inline-block">
                    Testnet Mode — Simulated Swap
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Input Field */}
            <div className="flex gap-2 mb-6">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleParse()}
                    placeholder="I want to swap 0.5 ETH to USDC..."
                    disabled={loading || executing}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 disabled:opacity-50"
                />

                <button
                    onClick={handleParse}
                    disabled={loading || executing || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 px-6 font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    {loading ? "Thinking..." : "Parse Intent"}
                </button>
            </div>

            {/* Preview Section */}
            {preview && !executing && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold mb-3 border-b border-slate-600 pb-2 flex justify-between items-center">
                        Review Swap details
                        {isTestnet && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">Simulated</span>}
                    </h3>

                    <div className="space-y-2 text-slate-300 font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Selling:</span>
                            <span className="text-white font-bold">{preview.amountValue} {preview.tokenIn.toUpperCase()}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-500">Buying:</span>
                            <span className="text-green-400 font-bold">
                                ${(preview.amountValue * (data?.ethPrice || 2500)).toFixed(2)} USDC
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-500">Rate:</span>
                            <span className="text-white text-xs">1 ETH = ${data?.ethPrice || "2,500"} USDC</span>
                        </div>

                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700/50">
                            <span className="text-slate-500">Gas Estimate:</span>
                            <span>{isTestnet ? "~0.002 ETH (Fake)" : "Calculating..."}</span>
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Slippage:</span>
                            <span className="text-green-400">1.0%</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSwap}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 font-bold py-3 rounded-lg transition-colors shadow-lg shadow-green-900/50"
                    >
                        Confirm & Swap
                    </button>
                </div>
            )}

            {/* Loading Execute */}
            {executing && (
                <div className="mb-6 p-4 text-center rounded-xl bg-blue-900/20 border border-blue-800 animate-pulse">
                    <p className="text-blue-400 font-bold mb-1">
                        {isTestnet ? "Simulating Swap... ⏳" : "Waiting for Signature ✍️"}
                    </p>
                    <p className="text-sm text-slate-400">
                        {isTestnet ? "Processing transaction on testnet..." : "Please review and confirm inside your wallet."}
                    </p>
                </div>
            )}

            {/* TxHash display */}
            {txHash && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-xl text-green-300 animate-in fade-in zoom-in duration-300">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        ✅ Swap Successful {isTestnet ? "(Simulated)" : ""}
                    </h3>
                    <p className="text-xs break-all break-words text-green-400/80">
                        Hash: <span className="font-mono">{txHash}</span>
                    </p>
                </div>
            )}

        </div>
    );
}

