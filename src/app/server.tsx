/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { env } from '~/env';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import axios from 'axios';
import { fetchMultiPoolMarketCaps, getEthUsdPrice, getTokenBalance } from './onchain';

import * as z from 'zod';
import { type CastWithInteractions } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { getQuote, getSwapPrice } from '~/lib/0x';
import { getHotClankersCA, getTopClankersCA } from '~/lib/dune';
import { db } from '~/lib/db';
import Redis from 'ioredis';

const redis = new Redis(env.REDIS_URL);

const CACHE_EXPIRATION_SECONDS = 60; // 1 minutes

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
export type ClankerWithData = Clanker & { 
  marketCap: number, 
  decimals: number,
  priceUsd: number,
  cast: CastWithInteractions | null 
}

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

export async function serverFetchBalance(address?: string) {
  return await getTokenBalance(address)
}

export async function serverFetchHotClankers(): Promise<ClankerWithData[]> {
  const hotClankers = await getHotClankersCA()

  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: hotClankers.map(c => c.toLowerCase())
      },
    },
    orderBy: {
      contract_address: 'asc'
    },
  })

  // Sort dbClankers in the same order as hotClankers
  dbClankers.sort((a, b) => {
    const aIndex = hotClankers.findIndex(c => c.toLowerCase() === a.contract_address)
    const bIndex = hotClankers.findIndex(c => c.toLowerCase() === b.contract_address)
    return aIndex - bIndex
  })

  if (dbClankers.length === 0) {
    return []
  }

  const poolAddresses = dbClankers.map(d => d.pool_address).filter(h => h !== null)
  const contractAddresses = dbClankers.map(d => d.contract_address).filter(h => h !== null)
  const castHashes = dbClankers.map(d => d.cast_hash).filter(h => h !== null)

  const mcaps = await fetchMultiPoolMarketCaps(poolAddresses, contractAddresses)
  const casts = await fetchCastsNeynar(castHashes)

  return dbClankers.map((clanker, i) => {
    return {
      id: clanker.id,
      created_at: clanker.created_at.toString(),
      tx_hash: clanker.tx_hash,
      contract_address: clanker.contract_address,
      requestor_fid: clanker.requestor_fid,
      name: clanker.name,
      symbol: clanker.symbol,
      img_url: clanker.img_url,
      pool_address: clanker.pool_address,
      cast_hash: clanker.cast_hash,
      type: clanker.type ?? "unknown",
      marketCap: mcaps[clanker.pool_address]?.marketCap ?? -1,
      priceUsd: mcaps[clanker.pool_address]?.usdPrice ?? -1,
      decimals: mcaps[clanker.pool_address]?.decimals ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null
    }
  })
}

export async function serverSearchClankers(query: string): Promise<ClankerWithData[]> {
  const dbClankers = await db.clanker.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          symbol: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    take: 20
  });

  if (dbClankers.length === 0) {
    return []
  }

  const poolAddresses = dbClankers.map(d => d.pool_address).filter(h => h !== null)
  const contractAddresses = dbClankers.map(d => d.contract_address).filter(h => h !== null)
  const castHashes = dbClankers.map(d => d.cast_hash).filter(h => h !== null)

  const mcaps = await fetchMultiPoolMarketCaps(poolAddresses, contractAddresses)
  const casts = await fetchCastsNeynar(castHashes)

  const out = dbClankers.map((clanker, i) => {
    return {
      id: clanker.id,
      created_at: clanker.created_at.toString(),
      tx_hash: clanker.tx_hash,
      contract_address: clanker.contract_address,
      requestor_fid: clanker.requestor_fid,
      name: clanker.name,
      symbol: clanker.symbol,
      img_url: clanker.img_url,
      pool_address: clanker.pool_address,
      cast_hash: clanker.cast_hash,
      type: clanker.type ?? "unknown",
      marketCap: mcaps[clanker.pool_address]?.marketCap ?? -1,
      priceUsd: mcaps[clanker.pool_address]?.usdPrice ?? -1,
      decimals: mcaps[clanker.pool_address]?.decimals ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null
    }
  })

  out.sort((a, b) => b.marketCap - a.marketCap)
  return out
}

export async function serverFetchNativeCoin(): Promise<ClankerWithData> {
  const ca = "0x1d008f50fb828ef9debbbeae1b71fffe929bf317"
  return await serverFetchCA(ca)
}

export async function serverFetchCA(ca: string): Promise<ClankerWithData> {
  const cacheKey = `clanker:${ca}`;
  const cachedResult = await redis.get(cacheKey);
  if (cachedResult) {
    console.log(`Clanker cache hit for ${cacheKey}`);
    return JSON.parse(cachedResult);
  }
  const clanker = await db.clanker.findFirst({
    where: {
      contract_address: ca,
    },
  });
  if (!clanker) {
    throw new Error("CA not found in database")
  }
  const data = await fetchMultiPoolMarketCaps([clanker.pool_address], [clanker.contract_address])
  if (!data[clanker.pool_address]) {
    throw new Error("CA data not found")
  }
  const res = {
    id: clanker.id,
    created_at: clanker.created_at.toString(),
    tx_hash: clanker.tx_hash,
    contract_address: clanker.contract_address,
    requestor_fid: clanker.requestor_fid,
    name: clanker.name,
    symbol: clanker.symbol,
    img_url: clanker.img_url,
    pool_address: clanker.pool_address,
    cast_hash: clanker.cast_hash,
    type: clanker.type ?? "unknown",
    marketCap: data[clanker.pool_address]?.marketCap ?? -1,
    priceUsd: data[clanker.pool_address]?.usdPrice ?? -1,
    decimals: data[clanker.pool_address]?.decimals ?? -1,
    cast: null
  } 
  await redis.set(cacheKey, JSON.stringify(res), "EX", CACHE_EXPIRATION_SECONDS);
  return res
}

export async function serverFetchTopClankers(): Promise<ClankerWithData[]> {
  const hotClankers = await getTopClankersCA()

  const dbClankers = await db.clanker.findMany({
    where: {
      contract_address: {
        in: hotClankers.map(c => c.toLowerCase())
      },
    },
    orderBy: {
      contract_address: 'asc'
    }
  })

  // Sort dbClankers in the same order as hotClankers
  dbClankers.sort((a, b) => {
    const aIndex = hotClankers.findIndex(c => c.toLowerCase() === a.contract_address)
    const bIndex = hotClankers.findIndex(c => c.toLowerCase() === b.contract_address)
    return aIndex - bIndex
  })

  if (dbClankers.length === 0) {
    return []
  }

  const poolAddresses = dbClankers.map(d => d.pool_address).filter(h => h !== null)
  const contractAddresses = dbClankers.map(d => d.contract_address).filter(h => h !== null)
  const castHashes = dbClankers.map(d => d.cast_hash).filter(h => h !== null)

  const mcaps = await fetchMultiPoolMarketCaps(poolAddresses, contractAddresses)
  const casts = await fetchCastsNeynar(castHashes)

  return dbClankers.map((clanker, i) => {
    return {
      id: clanker.id,
      created_at: clanker.created_at.toString(),
      tx_hash: clanker.tx_hash,
      contract_address: clanker.contract_address,
      requestor_fid: clanker.requestor_fid,
      name: clanker.name,
      symbol: clanker.symbol,
      img_url: clanker.img_url,
      pool_address: clanker.pool_address,
      cast_hash: clanker.cast_hash,
      type: clanker.type ?? "unknown",
      marketCap: mcaps[clanker.pool_address]?.marketCap ?? -1,
      priceUsd: mcaps[clanker.pool_address]?.usdPrice ?? -1,
      decimals: mcaps[clanker.pool_address]?.decimals ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null
    }
  })
}

export async function serverFetchClankers(page = 1): Promise<ClankerResponse> {
  let clankers: ClankerWithData[] = [];
  let lastPage = page;

  while (clankers.length < 6) {
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

  const mcaps = await fetchMultiPoolMarketCaps(parsedData.map(d => d.pool_address), parsedData.map(d => d.contract_address))
  const casts = await fetchCastsNeynar(parsedData.map(d => d.cast_hash))
  const clankersWithMarketCap = parsedData.map((clanker, i) => {
    return { 
      ...clanker, 
      marketCap: mcaps[clanker.pool_address]?.marketCap ?? -1,
      priceUsd: mcaps[clanker.pool_address]?.usdPrice ?? -1,
      decimals: mcaps[clanker.pool_address]?.decimals ?? -1,
      cast: casts.find(c => c.hash === clanker.cast_hash) ?? null
    }
  })
  return clankersWithMarketCap.filter((c) => (c.cast?.author.follower_count ?? 0) > 99)
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