import { NextResponse } from 'next/server';
import { env } from '~/env';
import { scrapeLatestTimeRestricted } from '~/lib/clanker';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  await scrapeLatestTimeRestricted()
  return NextResponse.json({ message: 'Scraped!' });
}
