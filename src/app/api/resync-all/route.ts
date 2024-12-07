import { NextResponse } from 'next/server';
import { env } from '~/env';
import { clankerListAPI, scrapeClankers, scrapeLatestTimeRestricted } from '~/lib/clanker';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await scrapeClankers(1, 1000 * 60 * 60 * 24)

  return NextResponse.json({ status: "done" });
}