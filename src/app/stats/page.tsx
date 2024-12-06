/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { env } from "~/env"

export default async function Page() {

  const headers = new Headers({
    "Content-Type": "application/json",
    "0x-api-key": env.OX_API_KEY,
    "0x-version": "v2",
  });

  let trades = [] as any[];
  let cursor = null;

  const quoteResponse = await fetch(
    "https://api.0x.org/trade-analytics/swap",
    {
      headers,
    }
  );

  const quote = await quoteResponse.json();
  trades = trades.concat(quote.trades);
  cursor = quote.nextCursor;

  while (cursor) {
    console.log("Fetching page: ", cursor);
    const quoteParams = new URLSearchParams({
      cursor: cursor || undefined,
    }) as any

    const quoteResponse = await fetch(
      "https://api.0x.org/trade-analytics/swap?" + quoteParams.toString(),
      {
        headers,
      }
    );

    const quote = await quoteResponse.json();
    trades = trades.concat(quote.trades);
    cursor = quote.nextCursor;
  }

  const tradesByAddress: Record<string, { numTrades: number, revenue: number }> = {};
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);

  for (const trade of trades) {
    const address = trade.taker;
    const revenue = trade.fees.integratorFee.token == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? parseFloat(trade.fees.integratorFee.amount) : 0;

    if (!tradesByAddress[address]) {
      tradesByAddress[address] = { numTrades: 0, revenue: 0 };
    }

    tradesByAddress[address].numTrades++;
    tradesByAddress[address].revenue += revenue;
  }

  const sortedTradesByAddress = Object.entries(tradesByAddress)
    .sort((a, b) => b[1].revenue - a[1].revenue);

  const users = await neynar.fetchBulkUsersByEthereumAddress(sortedTradesByAddress.map(([address]) => address));
  console.log(Object.keys(users).length)
  const data = [];

  for (const [address, { numTrades, revenue }] of sortedTradesByAddress) {
    const user = users[address];
    const item = {
      address,
      numTrades,
      revenue,
    } as any;

    if (user?.[0]) {
      item.username = user[0].username;
    }

    data.push(item);
  }

  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}