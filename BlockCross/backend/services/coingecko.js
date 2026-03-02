import fetch from "node-fetch";

export async function getMarketData() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-pos,binancecoin,avalanche-2&vs_currencies=usd&include_24hr_change=true";

  const res = await fetch(url);
  return res.json();
}
