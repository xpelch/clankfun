import { DuneClient } from "@duneanalytics/client-sdk";
import { env } from "~/env";

const dune = new DuneClient(env.DUNE_API_KEY);

export async function getHotClankers(): Promise<any> {
  const query_result = await dune.getLatestResult({queryId: 4335462});
  return query_result.result?.rows ?? null
}