import axios from "axios";
import { z } from "zod";
import { db } from "./db";

const APIClankerSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  tx_hash: z.string(),
  contract_address: z.string(),
  requestor_fid: z.number().nullable(),
  name: z.string(),
  symbol: z.string(),
  img_url: z.string().nullable(),
  pool_address: z.string(),
  cast_hash: z.string().nullable(),
  type: z.string().nullable(),
});

const APIPageSchema = z.object({
  data: z.array(APIClankerSchema),
  hasMore: z.boolean(),
  total: z.number(),
});

export type APIClanker = z.infer<typeof APIClankerSchema>
export type APIPage = z.infer<typeof APIPageSchema>

export async function scrapeLatestTimeRestricted(time = 1000 * 40) {
  const latestClanker = await db.clanker.findFirst({
    orderBy: {
      created_at: 'desc'
    }
  })
  let page = 1
  if (latestClanker) {
    page = latestClanker.page
  }

  await scrapeClankers(page, time)
}

export async function scrapeClankers(startPage: number, maxRunTimeMs = 1000 * 40) {
  const startTimeMs = Date.now()
  let page = startPage
  while(true) {
    console.log("Fetching page", page)
    const data = await clankerListAPI('asc', page)

    const clankerPromises = data.data.map(async clanker => {
      try {
        const existing = await db.clanker.findFirst({
          where: {
            id: clanker.id
          }
        })

        if (existing) {
          console.log("Skipping existing clanker", clanker.id)
          return true
        }
      } catch (e: any) {
        console.log("Failed to find", clanker.id)
        return true
      }

      try {
        await db.clanker.create({
          data: {
            id: clanker.id,
            created_at: new Date(clanker.created_at),
            tx_hash: clanker.tx_hash,
            contract_address: clanker.contract_address.toLowerCase(),
            requestor_fid: clanker.requestor_fid ?? 0,
            name: clanker.name,
            symbol: clanker.symbol,
            img_url: clanker.img_url,
            pool_address: clanker.pool_address,
            cast_hash: clanker.cast_hash,
            type: clanker.type,
            page: page
          }
        })
        return true
      } catch (e: any) {
        console.log("Failed to insert", clanker.id)
        return true
      }
    })

    await Promise.all(clankerPromises)
    const elapsedMs = Date.now() - startTimeMs
    if (elapsedMs > maxRunTimeMs) {
      console.log("Max runtime exceeded")
      break
    }

    if (!data.hasMore) break
    page++
  }
}

// Internal function used to test that every output from the API is valid under the schema
// async function debugTestSchema() {
//   let page = 1
//   while(true) {
//     const data = await clankerListAPI('asc', page)
//     console.log("Page", page, data.data.length)
//     page++
//     if (!data.hasMore) break
//   }
// }

export async function clankerListAPI(sort: 'desc' | 'asc', page = 1): Promise<APIPage> {
  const res = await axios.get(`https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`);
  const data = res.data;
  console.log(JSON.stringify(data))
  const parsed = APIPageSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Failed to parse", JSON.stringify(parsed.error.errors, null, 2));
    throw new Error(`Invalid clanker data: ${parsed.error.errors.join(", ")}`);
  }
  return parsed.data
}