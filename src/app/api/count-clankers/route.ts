import { NextResponse } from 'next/server';
import { env } from '~/env';
import { clankerListAPI, scrapeLatestTimeRestricted } from '~/lib/clanker';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  let count = 0
  let page = 1
  while (true) {
    console.log("Fetching page", page, count)
    const res = await clankerListAPI('asc', page)
    page++
    count += res.data.length
    if (!res.hasMore) {
      break
    }
  }

  return NextResponse.json({ count: count });
}