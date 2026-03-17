import { useState } from "react";
import { parseIntent, ParsedIntent } from "../services/geminiParser";
import { executeSwap } from "../services/swapService";
import { usePortfolioData } from "@/hooks/usePortfolioData";

export default function SwapAssistant() {
    const { mode } = usePortfolioData();
    const [input, setInput] = useState("");
    const [preview, setPreview] = useState<ParsedIntent | null>(null);

    // States
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

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

        setExecuting(true);
        setError(null);

        try {
            if (mode === 'DEMO') {
                // Simulation delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                setTxHash("0xDEMO_TRANSACTION_HASH_" + Math.random().toString(16).slice(2));
                setPreview(null);
                return;
            }

            // executeSwap guarantees it handles gas, slippage (1%), and 10min deadline
            const tx = await executeSwap(preview);
            setTxHash(tx.hash);
            // Wait for mining explicitly if desired: await tx.wait(); 
            setPreview(null);
        } catch (err: any) {
            // Handle user rejection clearly
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
                Use natural language to trade. Ex: "Swap 0.1 ETH to USDC" or "Buy $100 USDC"
            </p>

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
                    placeholder="I want to sell 0.5 ETH..."
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

            {/* Preview Section - Prevent Auto Execute */}
            {preview && !executing && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold mb-3 border-b border-slate-600 pb-2">Review Swap details</h3>

                    <div className="space-y-2 text-slate-300 font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Action:</span>
                            <span className="uppercase text-blue-400">{preview.action}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-500">Amount:</span>
                            <span className="text-white text-lg font-bold">
                                {preview.amountValue} {preview.tokenIn.toUpperCase() === "ETH" || preview.tokenIn.toUpperCase() === "BNB" ? preview.tokenIn.toUpperCase() : "Tokens"}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-500">Route:</span>
                            <span>{preview.tokenIn} ➡️ {preview.tokenOut}</span>
                        </div>

                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/50">
                            <span className="text-slate-500 text-sm">Slippage Guard:</span>
                            <span className="text-green-400 text-sm">1.0% Max</span>
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
                    <p className="text-blue-400 font-bold mb-1">Waiting for Signature ✍️</p>
                    <p className="text-sm text-slate-400">Please review and confirm inside your wallet.</p>
                </div>
            )}

            {/* TxHash display */}
            {txHash && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-xl text-green-300 animate-in fade-in zoom-in duration-300">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        ✅ Swap Transaction Submitted!
                    </h3>
                    <p className="text-xs break-all break-words text-green-400/80">
                        Hash: <a href={'https://sepolia.etherscan.io/tx/' + txHash} target="_blank" rel="noreferrer" className="underline hover:text-green-300">{txHash}</a>
                    </p>
                </div>
            )}

        </div>
    );
}
