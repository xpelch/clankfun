/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { env } from '~/env';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import axios from 'axios';
import { fetchMultiPoolMarketCaps, getEthUsdPrice } from './onchain';

import * as z from 'zod';
import { type CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { getQuote, getSwapPrice } from '~/lib/0x';

const ClankerSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  tx_hash: z.string(),
  contract_address: z.string(),
  requestor_fid: z.number(),
  name: z.string(),
  symbol: z.string(),
  img_url: z.string().nullable(),
  pool_address: z.string(),
  cast_hash: z.string(),
  type: z.string(),
});

export type Clanker = z.infer<typeof ClankerSchema>
export type ClankerWithData = Clanker & { marketCap: number, cast: CastWithInteractions | null }

type ClankerResponse = {
  data: ClankerWithData[];
  lastPage: number;
}

export async function serverFetchSwapQuote(userAddress: string, tokenAddress: string, amount: number, isSell: boolean) {
  return await getQuote(userAddress, tokenAddress, amount, isSell)
}

export async function serverFetchSwapPrice(userAddress: string, tokenAddress: string, amount: number, isSell: boolean) {
  return await getSwapPrice(userAddress, tokenAddress, amount, isSell)
}

export async function serverEthUSDPrice() {
  return getEthUsdPrice()
}

export async function serverFetchClankers(page = 1): Promise<ClankerResponse> {
  let clankers: ClankerWithData[] = [];
  let lastPage = page;

  while (clankers.length < 6) {
    console.log(`Fetching page ${page}`);
    const newClankers = await fetchPage(page);
    clankers = [...clankers, ...newClankers];
    lastPage = page;
    page++;
  }

  return {
    data: clankers,
    lastPage,
  }
}

async function fetchPage(page = 1): Promise<ClankerWithData[]> {
  const res = await axios.get(`https://www.clanker.world/api/tokens?sort=desc&page=${page}&type=all`);
  const data = res.data.data;
  const parsedData = data.map((item: any) => {
    const parsed = ClankerSchema.safeParse(item);
    if (!parsed.success) {
      console.log(JSON.stringify(parsed.error.errors, null, 2));
      throw new Error(`Invalid clanker data: ${parsed.error.errors.join(", ")}`);
    }
    return parsed.data;
  }) as Clanker[];

  const mcaps = await fetchMultiPoolMarketCaps(parsedData.map(d => d.pool_address))
  const casts = await fetchCastsNeynar(parsedData.map(d => d.cast_hash))
  const clankersWithMarketCap = parsedData.map((clanker, i) => {
    return { 
      ...clanker, 
      marketCap: mcaps[clanker.pool_address] ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null
    }
  })
  return clankersWithMarketCap.filter((c) => (c.cast?.author.follower_count ?? 0) > 0)
}

export async function fetchParentCast(hash: string) {
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);
  const casts = await neynar.fetchBulkCasts([hash])
  if (casts.result.casts.length === 0) {
    return undefined
  }
  return casts.result.casts[0]
}

async function fetchCastsNeynar(hashes: string[]) {
  const neynar = new NeynarAPIClient(env.NEYNAR_API_KEY);
  const castData = (await neynar.fetchBulkCasts(hashes)).result.casts
  return castData
}