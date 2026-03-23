import { GoogleGenerativeAI } from "@google/generative-ai";
import { PortfolioMetrics } from "./insightsService";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export interface AIInsightResponse {
  summary: string;
  risk_assessment: string;
  recommendation: "BUY" | "SELL" | "HOLD";
  reason: string;
  diversification_analysis: string;
  confidence_score: string;
}

export const geminiInsightsService = {
  /**
   * Generates AI insights based on portfolio metrics and user risk profile
   */
  async generateInsights(metrics: PortfolioMetrics, riskProfile: string = "Balanced"): Promise<AIInsightResponse> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are a professional Web3 Portfolio Manager.
      Analyze the following portfolio metrics and provide a structured reasoning.

      Data:
      - Risk Profile: ${riskProfile}
      - Total Value: $${metrics.total_value_usd}
      - ETH Percentage: ${metrics.asset_distribution.eth_percentage}%
      - USDC Percentage: ${metrics.asset_distribution.usdc_percentage}%
      - Concentration Risk Score: ${metrics.concentration_risk_score}/100
      - Health Score: ${metrics.portfolio_health_score}/100
      - Market Trend: ${metrics.market_trend}

      Decision Guidelines:
      1. IF Risk Profile is Conservative -> prioritize USDC and safety.
      2. IF Risk Profile is Aggressive -> favor higher ETH allocation.
      3. IF ETH allocation is high (>70%) and market is bearish -> RECOMMEND SELL or REDUCE.
      4. IF portfolio is balanced (around 50/50) -> RECOMMEND HOLD.
      5. IF low ETH allocation and bullish trend -> RECOMMEND BUY.

      Return ONLY a JSON object with this exact structure:
      {
        "summary": "short summary",
        "risk_assessment": "assessment of current risk",
        "recommendation": "BUY" | "SELL" | "HOLD",
        "reason": "detailed reason for the move",
        "diversification_analysis": "how diversified the user is",
        "confidence_score": "85%"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON if it's wrapped in markdown
      const jsonStr = text.includes("```json") 
        ? text.split("```json")[1].split("```")[0].trim() 
        : text.trim();

      return JSON.parse(jsonStr) as AIInsightResponse;
    } catch (err) {
      console.error("Gemini Error:", err);
      // Fallback for zero balance or error cases
      if (metrics.total_value_usd === 0) {
        return {
          summary: "Portfolio is empty.",
          risk_assessment: "No assets to assess.",
          recommendation: "HOLD",
          reason: "Connect your wallet and add assets to receive analysis.",
          diversification_analysis: "N/A",
          confidence_score: "100%"
        };
      }
      throw new Error("AI analysis engine failed. Please check your API key.");
    }
  }
};
