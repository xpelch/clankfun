import { DuneClient } from "@duneanalytics/client-sdk";
import { env } from "~/env";

const dune = new DuneClient(env.DUNE_API_KEY);

type DuneHotClanker = {
  contract_address: string;
  creation_time: string;
  market_cap_usd: number;
  ratio: number;
  symbol: string;
  total_volume_usd: number;
}

export async function getHotClankersCA(): Promise<string[]> {
  const query_result = await dune.getLatestResult({queryId: 4358090});
  const rows = query_result.result?.rows
  if (!rows) {
    throw new Error("Failed to query dune")
  }
  return rows.filter((r) => r.contract_address !== null).map(r => r.contract_address) as string[]
}

export async function getTopClankersCA(): Promise<string[]> {
  const query_result = await dune.getLatestResult({queryId: 4358063});
  const rows = query_result.result?.rows
  if (!rows) {
    throw new Error("Failed to query dune")
  }
  return rows.filter((r) => r.contract_address !== null).map(r => r.contract_address) as string[]
}