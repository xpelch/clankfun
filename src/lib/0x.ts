/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  parseUnits,
} from "viem";
import { ethers } from "ethers";

const env = {
  OX_API_KEY: "297fd66f-fb71-4d30-908b-7287e880a970",
  NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT: "https://base-mainnet.g.alchemy.com/v2/Iz4a0uLN_7520Cq2Q8nJAhpYG1s5vji7"
}

const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": "297fd66f-fb71-4d30-908b-7287e880a970",
  "0x-version": "v2",
});

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"

export async function getSwapPrice(
  takerAddress: string,
  tokenAddress: string, 
  amount: number, 
  sell: boolean
) {
  const sellToken = sell ? tokenAddress : WETH_ADDRESS;
  const buyToken = sell ? WETH_ADDRESS : tokenAddress;
  const sellAmount = parseUnits(amount.toString(), 18).toString();

  const priceParams = new URLSearchParams({
    chainId: "8453",
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount,
    taker: takerAddress,
  });

  const priceResponse = await fetch(
    "https://api.0x.org/swap/permit2/price?" + priceParams.toString(),
    {
      headers,
    }
  );

  const price = await priceResponse.json();
  return price
}