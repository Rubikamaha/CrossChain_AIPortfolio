export function generateInsights(balances, marketData) {
  const insights = [];

  const mainnetChains = ["1", "137", "56", "42161", "10", "8453", "43114"];
  const hasMainnet = Object.keys(balances).some(c =>
    mainnetChains.includes(c)
  );

  if (!hasMainnet) {
    insights.push(
      "Your portfolio is currently only on testnets. There is no real market risk."
    );
    insights.push(
      "Connect a mainnet wallet to unlock advanced portfolio intelligence."
    );
  } else {
    insights.push(
      "You have exposure to mainnet assets. Market volatility can affect portfolio value."
    );
  }

  if (marketData.ethereum.usd_24h_change > 0) {
    insights.push("ETH price trend is bullish in the last 24 hours.");
  } else {
    insights.push("ETH price shows a bearish trend in the last 24 hours.");
  }

  insights.push(
    "Gas fees are generally lower on Layer-2 chains like Polygon, Base, and Arbitrum."
  );

  return insights;
}
