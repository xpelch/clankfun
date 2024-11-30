/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ethers } from 'ethers';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { env } from '~/env';
import { Alchemy, Network, Utils } from 'alchemy-sdk';

const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT);

import { BigNumber } from '@ethersproject/bignumber';

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(settings);

export async function getEthUsdPrice(): Promise<number> {
  const poolAddress = "0x4200000000000000000000000000000000000006"; // e.g., WETH-USDC pool address
  const poolData = await alchemy.prices.getTokenPriceByAddress([{ network: Network.BASE_MAINNET, address: poolAddress }]);
  return poolData.data[0]!.prices[0]!.value as unknown as number;
}

function calculatePrice(sqrtPriceX96: bigint, decimalsToken0: number, decimalsToken1: number): number {
    // Convert sqrtPrice to price
    const price = Number(sqrtPriceX96) ** 2 / (2 ** 192);
    
    // Adjust for decimals
    const decimalAdjustment = 10 ** (decimalsToken1 - decimalsToken0);
    return price * decimalAdjustment;
}

function calculateMarketCap(
    sqrtPriceX96: bigint,
    liquidity: bigint,
    ethPriceUsd: number,
    decimalsToken0 = 18, // ETH typically has 18 decimals
    decimalsToken1 = 5  // Most ERC20s have 18 decimals
): number {
    const price = calculatePrice(sqrtPriceX96, decimalsToken0, decimalsToken1);
    
    // Calculate total value in the pool
    // Note: This is a simplified calculation and might need adjustment based on the price range
    const totalValue = Number(liquidity) * price;
    const totalValueUSD = totalValue * ethPriceUsd;
    
    return totalValueUSD;
}

async function fetchSinglePoolMarketCap(poolAddress: string, ethPrice: number): Promise<number> {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi,
    provider
  ) as any;

  try {
    const [slot0, liquidity] = await Promise.all([
      poolContract.slot0(),
      poolContract.liquidity(),
    ]);

    return calculateMarketCap(slot0.sqrtPriceX96 as bigint, liquidity as bigint, ethPrice);
  } catch (error) {
    console.error(`Error fetching data for pool ${poolAddress}:`, error);
    return -1;
  }
}

export async function fetchMultiPoolMarketCaps(poolAddresses: string[]): Promise<Record<string, number>> {
  // Get ETH price once for all calculations
  const ethPrice = await getEthUsdPrice();
  
  // Fetch all pool data in parallel
  const marketCapPromises = poolAddresses.map(address => 
    fetchSinglePoolMarketCap(address, ethPrice)
  );
  
  const marketCaps = await Promise.all(marketCapPromises);
  
  // Create a map of pool addresses to their market caps
  return Object.fromEntries(
    poolAddresses.map((address, index) => [address, marketCaps[index]!])
  );
}